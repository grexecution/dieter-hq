import { NextRequest } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

import { db } from "@/server/db";
import { artefacts, messages } from "@/server/db/schema";
import { logEvent } from "@/server/events/log";
import { notifyAgentResponse } from "@/lib/push";
import { artefactRelPath, artefactsBaseDir, ensureDirForFile } from "@/server/artefacts/storage";
import { placeholderSvg } from "@/server/tools/image";

// Helper: Extract and save base64 images from content, return modified content with URLs
// Also handles MEDIA:<path> tags from OpenClaw Gateway
async function processImagesInContent(content: string, threadId: string): Promise<string> {
  let result = content;
  
  // 1. Handle MEDIA:<path> tags from OpenClaw Gateway
  // Matches: MEDIA:/path/to/file.png or MEDIA:~/path/to/file.png
  const mediaPattern = /MEDIA:((?:\/[^\s\n]+|~\/[^\s\n]+))/g;
  let mediaMatch;
  
  while ((mediaMatch = mediaPattern.exec(content)) !== null) {
    const [fullMatch, filePath] = mediaMatch;
    
    // Convert to API URL - don't encode, browser handles it
    const mediaUrl = `/api/media?path=${filePath}`;
    
    // Replace MEDIA: tag with markdown image
    result = result.replace(fullMatch, `![Screenshot](${mediaUrl})`);
  }
  
  // 2. Handle base64 image patterns: data:image/xxx;base64,...
  const base64Pattern = /data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)/g;
  let match;
  
  while ((match = base64Pattern.exec(content)) !== null) {
    const [fullMatch, imageType, base64Data] = match;
    
    try {
      const imgId = crypto.randomUUID();
      const createdAt = new Date();
      const ext = imageType === 'jpeg' ? 'jpg' : imageType;
      const buffer = Buffer.from(base64Data, 'base64');
      
      const rel = artefactRelPath({ date: createdAt, id: imgId, ext });
      const abs = path.join(artefactsBaseDir(), rel);
      await ensureDirForFile(abs);
      await fs.writeFile(abs, buffer);
      
      await db.insert(artefacts).values({
        id: imgId,
        threadId,
        originalName: `image-${imgId}.${ext}`,
        mimeType: `image/${imageType}`,
        sizeBytes: buffer.byteLength,
        storagePath: rel,
        createdAt,
      });
      
      const url = `/api/artefacts/${encodeURIComponent(imgId)}`;
      // Replace inline base64 with markdown image pointing to artefact
      result = result.replace(fullMatch, `![Image](${url})`);
    } catch (err) {
      console.error('Error saving inline image:', err);
    }
  }
  
  return result;
}
// TODO: Re-enable when Infinite Context is stable
// import { 
//   processMessageWithInfiniteContext, 
//   recordAssistantResponse,
//   getContextStatus 
// } from "@/server/infinite-context";

export const runtime = "nodejs";

const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || 'http://127.0.0.1:18789';
const GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD;

type Payload = {
  threadId?: string;
  content?: string;
  skipUserMessage?: boolean; // For voice messages where user message already exists
};

function fmtLabel(d: Date): string {
  return new Intl.DateTimeFormat("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Vienna",
  }).format(d);
}

export async function POST(req: NextRequest) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const threadId = String(body.threadId ?? "main");
  const raw = String(body.content ?? "");
  const content = raw.trim();
  const skipUserMessage = body.skipUserMessage === true;
  
  if (!content) {
    return new Response(JSON.stringify({ ok: false, error: "missing_content" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const id = crypto.randomUUID();

  // Skip creating user message if it already exists (e.g., voice messages)
  if (!skipUserMessage) {
    await db.insert(messages).values({
      id,
      threadId,
      role: "user",
      content,
      createdAt: now,
    });

    await logEvent({
      threadId,
      type: "message.create",
      payload: { role: "user" },
    });
  }

  // Tool command: /image <prompt>
  if (content.startsWith("/image")) {
    const prompt = content.replace(/^\/image\s*/i, "").trim();
    const imgId = crypto.randomUUID();
    const createdAt = new Date();

    const svg = placeholderSvg(prompt || "(empty prompt)");
    const rel = artefactRelPath({ date: createdAt, id: imgId, ext: "svg" });
    const abs = path.join(artefactsBaseDir(), rel);
    await ensureDirForFile(abs);
    await fs.writeFile(abs, svg, "utf8");

    await db.insert(artefacts).values({
      id: imgId,
      threadId,
      originalName: `image-${imgId}.svg`,
      mimeType: "image/svg+xml",
      sizeBytes: Buffer.byteLength(svg, "utf8"),
      storagePath: rel,
      createdAt,
    });

    const url = `/api/artefacts/${encodeURIComponent(imgId)}`;
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      threadId,
      role: "assistant",
      content: `🖼️ Generated image\n${url}`,
      createdAt,
    });

    await logEvent({
      threadId,
      type: "tool.image",
      payload: { prompt, artefactId: imgId },
    });

    return new Response(JSON.stringify({
      ok: true,
      item: {
        id,
        threadId,
        role: "user" as const,
        content,
        createdAt: now.getTime(),
        createdAtLabel: fmtLabel(now),
      },
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Call OpenClaw gateway with streaming + Infinite Context
  // Support fixed threads + workspace project threads (dev:project-name)
  const fixedThreadIds = ["life", "sport", "work", "dev", "main"];
  const isWorkspaceThread = threadId.startsWith("dev:");
  const isSupported = fixedThreadIds.includes(threadId) || isWorkspaceThread;
  
  if (isSupported) {
    const contextPrefixes: Record<string, string> = {
      life: "[Life Context] ",
      sport: "[Sport Context] ",
      work: "[Work Context] ",
      dev: "[Dev Context] ",
      main: ""
    };
    // For workspace projects, extract project name for context
    let contextPrefix = contextPrefixes[threadId] || "";
    if (isWorkspaceThread) {
      const projectSlug = threadId.replace("dev:", "");
      contextPrefix = `[Dev Project: ${projectSlug}] `;
    }
    const contextualMessage = contextPrefix + content;

    // 🧠 INFINITE CONTEXT: Temporarily disabled - just use the user message
    const infiniteContextResult = {
      contextMessages: [{ role: 'user', content: contextualMessage }],
      contextState: { contextUtilization: 0 },
      summarizationTriggered: false,
    };

    // Create SSE stream for frontend
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // First, send the user message confirmation (skip for voice messages)
        if (!skipUserMessage) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "user_confirmed",
            item: {
              id,
              threadId,
              role: "user",
              content,
              createdAt: now.getTime(),
              createdAtLabel: fmtLabel(now),
            },
            contextStatus: {
              utilization: Math.round(infiniteContextResult.contextState.contextUtilization),
              summarized: infiniteContextResult.summarizationTriggered,
            }
          })}\n\n`));
        }

        let fullContent = "";
        const assistantMsgId = crypto.randomUUID();

        // Thread → Agent Mapping
        // Workspace project threads (dev:*) use the coder agent
        const threadToAgent: Record<string, string> = {
          'main': 'main',
          'life': 'main',
          'dev': 'coder',
          'sport': 'sport',
          'work': 'work',
        };
        const agentId = isWorkspaceThread ? 'coder' : (threadToAgent[threadId] || 'main');

        try {
          // 🧠 INFINITE CONTEXT: Send full context to OpenClaw
          const response = await fetch(`${GATEWAY_HTTP_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(GATEWAY_PASSWORD && { 'Authorization': `Bearer ${GATEWAY_PASSWORD}` }),
              'x-openclaw-agent-id': agentId,
              'x-openclaw-session-key': `agent:${agentId}:dieter-hq:${threadId}`,
              'x-openclaw-source': 'dieter-hq',
            },
            body: JSON.stringify({
              model: `openclaw:${agentId}`,
              // Use the full context from infinite context system
              messages: infiniteContextResult.contextMessages,
              user: `dieter-hq:${threadId}`,
              stream: true,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'unknown');
            console.error(`[Chat Send] Gateway error ${response.status}: ${errorText}`);
            fullContent = `⚠️ Gateway error (${response.status}).`;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "delta",
              content: fullContent,
            })}\n\n`));
          } else if (!response.body) {
            console.error(`[Chat Send] No response body from gateway`);
            fullContent = "⚠️ No response body from gateway.";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "delta",
              content: fullContent,
            })}\n\n`));
          } else {
            // Parse SSE stream from OpenClaw
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const payload = line.slice(6).trim();
                if (payload === "[DONE]") continue;

                try {
                  const chunk = JSON.parse(payload);
                  
                  // Log chunk structure for debugging (remove in production)
                  // console.log('[Gateway Chunk]', JSON.stringify(chunk, null, 2));
                  
                  // Handle text delta
                  const delta = chunk.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullContent += delta;
                    // Send delta to frontend
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: "delta",
                      content: delta,
                    })}\n\n`));
                  }
                  
                  // Handle tool calls / images that might come as tool results
                  // OpenClaw may send images via tool_calls or as content blocks
                  const toolCalls = chunk.choices?.[0]?.delta?.tool_calls;
                  if (toolCalls && Array.isArray(toolCalls)) {
                    for (const tc of toolCalls) {
                      // Log tool calls for debugging
                      console.log('[Tool Call]', JSON.stringify(tc));
                    }
                  }
                } catch {
                  // Ignore parse errors for malformed chunks
                }
              }
            }
          }
        } catch (err) {
          console.error('[Chat Send] OpenClaw gateway error:', err);
          fullContent = fullContent || '⚠️ Cannot reach OpenClaw gateway.';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "delta",
            content: fullContent,
          })}\n\n`));
        }
        
        // Log final content length for debugging
        console.log(`[Chat Send] Thread ${threadId}, agent ${agentId}: response length = ${fullContent.length} chars`);

        // Save complete assistant response to DB
        // Process any inline base64 images and save them as artefacts
        // Log if we got an empty response - this helps debug "no response" issues
        if (!fullContent || fullContent.trim() === "") {
          console.error(`[Chat Send] Empty response from gateway for thread ${threadId}, agent ${agentId}`);
        }
        const processedContent = await processImagesInContent(fullContent || "⏳ Dieter ist gerade beschäftigt. Bitte nochmal versuchen.", threadId);
        const assistantCreatedAt = new Date();
        await db.insert(messages).values({
          id: assistantMsgId,
          threadId,
          role: "assistant",
          content: processedContent,
          createdAt: assistantCreatedAt,
        });

        // 🔔 Push Notification for Dieter's response
        try {
          await notifyAgentResponse(processedContent);
        } catch (pushErr) {
          console.error('[Chat Send] Push notification failed:', pushErr);
        }

        // 🧠 INFINITE CONTEXT: Temporarily disabled
        // try {
        //   await recordAssistantResponse(threadId, fullContent || "");
        // } catch (err) {
        //   console.error('[InfiniteContext] Error recording response:', err);
        // }

        await logEvent({
          threadId,
          type: "openclaw.response",
          payload: { channel: "dieter-hq", context: threadId },
        });

        // Send completion signal with processed content (images converted to artefact URLs)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "done",
          item: {
            id: assistantMsgId,
            threadId,
            role: "assistant",
            content: processedContent,
            createdAt: assistantCreatedAt.getTime(),
            createdAtLabel: fmtLabel(assistantCreatedAt),
          }
        })}\n\n`));

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // Fallback for unsupported threads (non-streaming)
  return new Response(JSON.stringify({
    ok: true,
    item: {
      id,
      threadId,
      role: "user" as const,
      content,
      createdAt: now.getTime(),
      createdAtLabel: fmtLabel(now),
    },
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

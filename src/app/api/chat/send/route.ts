import { NextRequest } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

import { db } from "@/server/db";
import { artefacts, messages } from "@/server/db/schema";
import { logEvent } from "@/server/events/log";
import { artefactRelPath, artefactsBaseDir, ensureDirForFile } from "@/server/artefacts/storage";
import { placeholderSvg } from "@/server/tools/image";

export const runtime = "nodejs";

const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || 'http://127.0.0.1:18789';
const GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD;

type Payload = {
  threadId?: string;
  content?: string;
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
  if (!content) {
    return new Response(JSON.stringify({ ok: false, error: "missing_content" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const id = crypto.randomUUID();

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

  // Call OpenClaw gateway with streaming
  const supportedThreadIds = ["life", "sport", "work", "dev", "main"];
  if (supportedThreadIds.includes(threadId)) {
    const contextPrefixes: Record<string, string> = {
      life: "[Life Context] ",
      sport: "[Sport Context] ",
      work: "[Work Context] ",
      dev: "[Dev Context] ",
      main: ""
    };
    const contextPrefix = contextPrefixes[threadId] || "";
    const contextualMessage = contextPrefix + content;

    // Create SSE stream for frontend
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // First, send the user message confirmation
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "user_confirmed",
          item: {
            id,
            threadId,
            role: "user",
            content,
            createdAt: now.getTime(),
            createdAtLabel: fmtLabel(now),
          }
        })}\n\n`));

        let fullContent = "";
        const assistantMsgId = crypto.randomUUID();

        // Route "dev" thread to coder agent, all others to main
        const agentId = threadId === 'dev' ? 'coder' : 'main';

        try {
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
              messages: [
                { role: 'user', content: contextualMessage }
              ],
              user: `dieter-hq:${threadId}`,
              stream: true,
            }),
          });

          if (!response.ok) {
            fullContent = `⚠️ Gateway error (${response.status}).`;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "delta",
              content: fullContent,
            })}\n\n`));
          } else if (!response.body) {
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
                  const delta = chunk.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullContent += delta;
                    // Send delta to frontend
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: "delta",
                      content: delta,
                    })}\n\n`));
                  }
                } catch {
                  // Ignore parse errors for malformed chunks
                }
              }
            }
          }
        } catch (err) {
          console.error('OpenClaw gateway error:', err);
          fullContent = fullContent || '⚠️ Cannot reach OpenClaw gateway.';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "delta",
            content: fullContent,
          })}\n\n`));
        }

        // Save complete assistant response to DB
        const assistantCreatedAt = new Date();
        await db.insert(messages).values({
          id: assistantMsgId,
          threadId,
          role: "assistant",
          content: fullContent || "No response",
          createdAt: assistantCreatedAt,
        });

        await logEvent({
          threadId,
          type: "openclaw.response",
          payload: { channel: "dieter-hq", context: threadId },
        });

        // Send completion signal
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "done",
          item: {
            id: assistantMsgId,
            threadId,
            role: "assistant",
            content: fullContent || "No response",
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

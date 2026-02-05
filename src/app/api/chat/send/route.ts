import { NextRequest, NextResponse } from "next/server";
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
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const threadId = String(body.threadId ?? "main");
  const raw = String(body.content ?? "");
  const content = raw.trim();
  if (!content) return NextResponse.json({ ok: false, error: "missing_content" }, { status: 400 });

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

    return NextResponse.json({
      ok: true,
      item: {
        id,
        threadId,
        role: "user" as const,
        content,
        createdAt: now.getTime(),
        createdAtLabel: fmtLabel(now),
      },
    });
  }

  // Call OpenClaw gateway (instant via Tailscale Funnel)
  const supportedThreadIds = ["life", "sport", "work", "dev", "main"];
  if (supportedThreadIds.includes(threadId)) {
    let assistantContent = '';
    
    const contextPrefixes: Record<string, string> = {
      life: "[Life Context] ",
      sport: "[Sport Context] ",
      work: "[Work Context] ",
      dev: "[Dev Context] ",
      main: ""
    };
    const contextPrefix = contextPrefixes[threadId] || "";
    const contextualMessage = contextPrefix + content;
    
    try {
      const response = await fetch(`${GATEWAY_HTTP_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(GATEWAY_PASSWORD && { 'Authorization': `Bearer ${GATEWAY_PASSWORD}` }),
          'x-openclaw-agent-id': 'main',
          'x-openclaw-session-key': `agent:main:dieter-hq:${threadId}`,
        },
        body: JSON.stringify({
          model: 'openclaw:main',
          messages: [
            { role: 'user', content: contextualMessage }
          ],
          user: `dieter-hq:${threadId}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        assistantContent = data.choices?.[0]?.message?.content || 'No response';
      } else {
        assistantContent = `⚠️ Gateway error (${response.status}).`;
      }
    } catch (err) {
      console.error('OpenClaw gateway error:', err);
      assistantContent = '⚠️ Cannot reach OpenClaw gateway.';
    }

    // Save assistant response
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      threadId,
      role: "assistant",
      content: assistantContent,
      createdAt: new Date(now.getTime() + 1),
    });

    await logEvent({
      threadId,
      type: "openclaw.response",
      payload: { channel: "dieter-hq", context: threadId },
    });
  }

  return NextResponse.json({
    ok: true,
    item: {
      id,
      threadId,
      role: "user" as const,
      content,
      createdAt: now.getTime(),
      createdAtLabel: fmtLabel(now),
    },
  });
}

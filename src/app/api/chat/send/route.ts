import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { messages, outbox } from "@/server/db/schema";
import { logEvent } from "@/server/events/log";

export const runtime = "nodejs";

type Payload = {
  threadId?: string;
  content?: string;
};

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

  if (threadId === "main") {
    await db.insert(outbox).values({
      id: crypto.randomUUID(),
      threadId: "main",
      channel: "hq",
      target: "main",
      text: content,
      status: "pending",
      createdAt: now,
      sentAt: null,
    });

    await logEvent({
      threadId: "main",
      type: "outbox.enqueue",
      payload: { channel: "hq" },
    });
  }

  await logEvent({
    threadId,
    type: "message.create",
    payload: { role: "user" },
  });

  const label = new Intl.DateTimeFormat("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Vienna",
  }).format(now);

  return NextResponse.json({
    ok: true,
    item: {
      id,
      threadId,
      role: "user" as const,
      content,
      createdAt: now.getTime(),
      createdAtLabel: label,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { messages } from "@/server/db/schema";

// Inbox Bridge v0
// Receives external/inbound messages (e.g. forwarded from OpenClaw) and stores
// them in the HQ messages table so the Chat UI can display them.
//
// NOTE: currently unauthenticated. Lock down before exposing beyond localhost.

type InboxPayload = {
  source: "openclaw";
  channel: string; // telegram|...
  chatId?: string;
  messageId?: string;
  author?: string;
  text: string;
  ts?: number; // unix ms
};

export async function POST(req: NextRequest) {
  let body: InboxPayload;
  try {
    body = (await req.json()) as InboxPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const text = String(body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ ok: false, error: "missing_text" }, { status: 400 });
  }

  const channel = String(body.channel ?? "unknown");
  const chatId = body.chatId ? String(body.chatId) : "unknown";
  const threadId = `inbox:${channel}:${chatId}`;

  // Use a stable id for dedupe if caller provides messageId.
  const id = body.messageId
    ? `inbox:${channel}:${chatId}:${String(body.messageId)}`
    : crypto.randomUUID();

  const author = body.author ? String(body.author) : channel;
  const prefix = `[${author}] `;

  const createdAt = body.ts ? new Date(Number(body.ts)) : new Date();

  try {
    await db.insert(messages).values({
      id,
      threadId,
      role: "user",
      content: prefix + text,
      createdAt,
    });
  } catch {
    // Likely duplicate id (already inserted). Treat as success.
  }

  return NextResponse.json({ ok: true, threadId, id });
}

import { NextRequest } from "next/server";
import { db } from "@/server/db";
import { messages, chatQueue } from "@/server/db/schema";
import { logEvent } from "@/server/events/log";

export const runtime = "nodejs";

type Payload = {
  threadId?: string;
  content?: string;
  skipUserMessage?: boolean;
};

function fmtLabel(d: Date): string {
  return new Intl.DateTimeFormat("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Vienna",
  }).format(d);
}

/**
 * Async chat send - queues the message for processing by Mac Mini cron job.
 * Returns immediately with a queueId that can be polled for the response.
 */
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
  const messageId = crypto.randomUUID();
  const queueId = crypto.randomUUID();

  // Save user message to DB (unless already exists for voice messages)
  if (!skipUserMessage) {
    await db.insert(messages).values({
      id: messageId,
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

  // Add context prefix based on thread
  const contextPrefixes: Record<string, string> = {
    life: "[Life Context] ",
    sport: "[Sport Context] ",
    work: "[Work Context] ",
    dev: "[Dev Context] ",
    main: ""
  };
  
  const isWorkspaceThread = threadId.startsWith("dev:");
  let contextualMessage = content;
  
  if (isWorkspaceThread) {
    const projectSlug = threadId.replace("dev:", "");
    contextualMessage = `[Dev Project: ${projectSlug}] ${content}`;
  } else if (contextPrefixes[threadId]) {
    contextualMessage = contextPrefixes[threadId] + content;
  }

  // Queue the message for async processing
  await db.insert(chatQueue).values({
    id: queueId,
    threadId,
    userMessage: contextualMessage,
    status: "pending",
    createdAt: now,
  });

  await logEvent({
    threadId,
    type: "chat.queued",
    payload: { queueId },
  });

  // Return immediately with queue info
  return new Response(JSON.stringify({
    ok: true,
    queued: true,
    queueId,
    item: {
      id: messageId,
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

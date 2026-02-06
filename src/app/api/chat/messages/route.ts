import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { messages } from "@/server/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const threadId = String(req.nextUrl.searchParams.get("thread") ?? "main");
  const since = req.nextUrl.searchParams.get("since");
  const sinceMs = since ? Number(since) : null;

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt));

  const fmt = new Intl.DateTimeFormat("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Vienna",
  });

  const mapped = rows
    .map((m) => ({
      id: m.id,
      threadId: m.threadId,
      role: m.role,
      content: m.content,
      createdAt: new Date(m.createdAt).getTime(),
      createdAtLabel: fmt.format(new Date(m.createdAt)),
      // Voice message fields (Telegram-style)
      audioUrl: m.audioUrl ?? null,
      audioDurationMs: m.audioDurationMs ?? null,
      transcription: m.transcription ?? null,
    }))
    .filter((m) => (sinceMs ? m.createdAt > sinceMs : true));

  return NextResponse.json({ ok: true, threadId, items: mapped });
}

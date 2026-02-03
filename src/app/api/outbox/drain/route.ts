import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { outbox } from "@/server/db/schema";
import { and, asc, eq } from "drizzle-orm";

// Outbox Bridge v0
// Used by OpenClaw to fetch messages composed in HQ (to send to Telegram, etc.).
//
// NOTE: currently unauthenticated. Lock down before exposing beyond localhost.

export async function GET(req: NextRequest) {
  const limit = Math.max(
    1,
    Math.min(50, Number(req.nextUrl.searchParams.get("limit") ?? 20)),
  );

  const channel = req.nextUrl.searchParams.get("channel");

  const where = channel
    ? and(eq(outbox.status, "pending"), eq(outbox.channel, channel))
    : eq(outbox.status, "pending");

  const pending = await db
    .select()
    .from(outbox)
    .where(where)
    .orderBy(asc(outbox.createdAt))
    .limit(limit);

  const now = new Date();
  for (const row of pending) {
    await db
      .update(outbox)
      .set({ status: "sent", sentAt: now })
      .where(eq(outbox.id, row.id));
  }

  return NextResponse.json({ ok: true, items: pending });
}

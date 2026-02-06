import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, pendingReplies } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get the inbox item to find the sender info
    const items = await db
      .select()
      .from(inboxItems)
      .where(eq(inboxItems.id, id))
      .limit(1);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    const item = items[0];
    const trimmedMessage = message.trim();
    const now = new Date();

    // Store pending reply in DB - OpenClaw cron will send it
    await db.insert(pendingReplies).values({
      id: crypto.randomUUID(),
      inboxItemId: id,
      channel: item.source,
      recipient: item.sender,
      recipientName: item.senderName,
      message: trimmedMessage,
      status: "pending",
      createdAt: now,
    });

    console.log(`[REPLY] Queued ${item.source} reply to ${item.sender}: ${trimmedMessage.slice(0, 50)}...`);

    return NextResponse.json({ 
      success: true, 
      method: "queued",
      message: "Reply queued - will be sent shortly",
      recipient: item.sender,
      source: item.source,
    });

  } catch (error) {
    console.error("Error queueing reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

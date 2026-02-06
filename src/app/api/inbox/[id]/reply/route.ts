import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems } from "@/server/db/schema";
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

    // Store pending reply in the item's metadata
    // OpenClaw/Dieter will poll for these and send them
    const existingMetadata = (item.metadata as Record<string, unknown>) || {};
    const pendingReplies = (existingMetadata.pendingReplies as Array<{message: string, createdAt: string}>) || [];
    
    pendingReplies.push({
      message: message.trim(),
      createdAt: new Date().toISOString(),
    });

    await db
      .update(inboxItems)
      .set({
        metadata: {
          ...existingMetadata,
          pendingReplies,
        },
        updatedAt: new Date(),
      })
      .where(eq(inboxItems.id, id));

    // Log for debugging
    console.log(`[PENDING REPLY] ${item.source} to ${item.sender}: ${message}`);

    return NextResponse.json({ 
      success: true, 
      method: "queued",
      message: "Reply queued for Dieter to send",
      recipient: item.sender,
      source: item.source,
    });

  } catch (error) {
    console.error("Error queuing reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch pending replies (for OpenClaw to poll)
export async function GET() {
  try {
    const items = await db
      .select()
      .from(inboxItems)
      .where(eq(inboxItems.status, "pending"));

    // Filter items with pending replies
    const itemsWithReplies = items.filter(item => {
      const metadata = item.metadata as Record<string, unknown>;
      const pendingReplies = metadata?.pendingReplies as Array<unknown>;
      return pendingReplies && pendingReplies.length > 0;
    });

    return NextResponse.json({
      items: itemsWithReplies.map(item => ({
        id: item.id,
        source: item.source,
        sender: item.sender,
        senderName: item.senderName,
        pendingReplies: (item.metadata as Record<string, unknown>)?.pendingReplies,
      })),
    });
  } catch (error) {
    console.error("Error fetching pending replies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

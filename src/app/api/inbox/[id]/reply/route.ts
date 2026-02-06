import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, inboxActionLog } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/lib/messaging";

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

    // Send based on source
    if (item.source === "whatsapp") {
      console.log(`[REPLY] Sending WhatsApp to ${item.sender}: ${trimmedMessage.slice(0, 50)}...`);
      
      const result = await sendWhatsAppMessage(item.sender, trimmedMessage);
      
      if (!result.ok) {
        console.error(`[REPLY] WhatsApp send failed:`, result.error);
        return NextResponse.json(
          { error: `Failed to send: ${result.error}` },
          { status: 500 }
        );
      }

      // Log the successful send
      await db.insert(inboxActionLog).values({
        id: crypto.randomUUID(),
        recommendationId: null,
        inboxItemId: id,
        action: "reply:whatsapp",
        executedBy: "user",
        result: `Sent to ${item.senderName || item.sender}: "${trimmedMessage.slice(0, 100)}${trimmedMessage.length > 100 ? '...' : ''}"`,
        metadata: JSON.stringify({
          message: trimmedMessage,
          recipient: item.sender,
          messageId: result.messageId,
        }),
        createdAt: now,
      });

      // Mark item as actioned
      await db
        .update(inboxItems)
        .set({
          status: "actioned",
          updatedAt: now,
        })
        .where(eq(inboxItems.id, id));

      console.log(`[REPLY] WhatsApp sent successfully to ${item.sender}`);

      return NextResponse.json({ 
        success: true, 
        method: "sent",
        message: "Reply sent via WhatsApp",
        recipient: item.sender,
        source: item.source,
        messageId: result.messageId,
      });
    } else {
      // For non-WhatsApp sources, still queue for now
      console.log(`[REPLY] Queuing reply for ${item.source} (not yet implemented)`);
      
      return NextResponse.json({ 
        success: false, 
        error: `Sending to ${item.source} not yet implemented`,
      }, { status: 501 });
    }

  } catch (error) {
    console.error("Error sending reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Note: GET endpoint removed - replies are now sent directly, not queued

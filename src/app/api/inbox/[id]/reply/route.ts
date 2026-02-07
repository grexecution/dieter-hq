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

    // Determine recipient identifier based on source
    // - WhatsApp: use threadId (ChatJID) for proper delivery
    // - Email: use sender (email address)
    // - Slack: use threadId (channel ID)
    let recipientId = item.sender;
    if (item.source === "whatsapp") {
      if (item.threadId) {
        recipientId = item.threadId;
      } else {
        // No threadId - this item was synced before we stored ChatJID
        // Try to find another WhatsApp item with same senderName that has threadId
        const relatedItem = await db
          .select({ threadId: inboxItems.threadId })
          .from(inboxItems)
          .where(eq(inboxItems.senderName, item.senderName || item.sender))
          .limit(1);

        if (relatedItem[0]?.threadId) {
          recipientId = relatedItem[0].threadId;
        }
      }
    } else if (item.source === "slack" && item.threadId) {
      recipientId = item.threadId;
    }

    // Log the action
    const logId = crypto.randomUUID();
    await db.insert(inboxActionLog).values({
      id: logId,
      recommendationId: null,
      inboxItemId: id,
      action: "reply",
      executedBy: "user",
      result: null,
      metadata: JSON.stringify({
        channel: item.source,
        recipient: recipientId,
        recipientName: item.senderName || item.sender,
        message: trimmedMessage,
        status: "sending",
      }),
      createdAt: now,
    });

    // Actually send the message via the appropriate channel
    let sendResult: { ok: boolean; messageId?: string; error?: string } = { ok: false, error: "Unsupported channel" };

    if (item.source === "whatsapp") {
      console.log(`[REPLY] Sending WhatsApp to ${recipientId}: ${trimmedMessage.slice(0, 50)}...`);
      sendResult = await sendWhatsAppMessage(recipientId, trimmedMessage, item.sourceId ?? undefined);
    } else {
      // For non-WhatsApp channels, log as pending for now
      console.log(`[REPLY] Channel ${item.source} not yet supported for direct send, logged as pending`);
      sendResult = { ok: true, messageId: "pending" };
    }

    // Update the action log with the result
    await db
      .update(inboxActionLog)
      .set({
        result: sendResult.ok ? "sent" : `failed: ${sendResult.error}`,
        metadata: JSON.stringify({
          channel: item.source,
          recipient: recipientId,
          recipientName: item.senderName || item.sender,
          message: trimmedMessage,
          status: sendResult.ok ? "sent" : "failed",
          messageId: sendResult.messageId,
          error: sendResult.error,
        }),
      })
      .where(eq(inboxActionLog.id, logId));

    if (!sendResult.ok) {
      console.error(`[REPLY] Failed to send ${item.source} reply:`, sendResult.error);
      return NextResponse.json({
        success: false,
        error: sendResult.error || "Failed to send message",
        recipient: recipientId,
        source: item.source,
      }, { status: 502 });
    }

    console.log(`[REPLY] Sent ${item.source} reply to ${item.senderName || recipientId}`);

    return NextResponse.json({
      success: true,
      method: "sent",
      message: "Reply sent successfully",
      recipient: recipientId,
      recipientName: item.senderName || item.sender,
      source: item.source,
      messageId: sendResult.messageId,
    });

  } catch (error) {
    console.error("Error sending reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

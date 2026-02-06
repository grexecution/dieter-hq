import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { pendingReplies, inboxItems, inboxActionLog } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// GET - fetch pending replies for OpenClaw to process
export async function GET() {
  try {
    const pending = await db
      .select()
      .from(pendingReplies)
      .where(eq(pendingReplies.status, "pending"))
      .limit(10);

    return NextResponse.json({
      ok: true,
      replies: pending.map(r => ({
        id: r.id,
        channel: r.channel,
        recipient: r.recipient,
        recipientName: r.recipientName,
        message: r.message,
        createdAt: r.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching pending replies:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch pending replies" },
      { status: 500 }
    );
  }
}

// POST - mark reply as sent (called by OpenClaw after sending)
export async function POST(request: NextRequest) {
  try {
    const { id, success, error } = await request.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Get the pending reply
    const replies = await db
      .select()
      .from(pendingReplies)
      .where(eq(pendingReplies.id, id))
      .limit(1);

    if (replies.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Reply not found" },
        { status: 404 }
      );
    }

    const reply = replies[0];

    if (success) {
      // Mark as sent
      await db
        .update(pendingReplies)
        .set({
          status: "sent",
          sentAt: now,
        })
        .where(eq(pendingReplies.id, id));

      // Log the action
      await db.insert(inboxActionLog).values({
        id: crypto.randomUUID(),
        recommendationId: null,
        inboxItemId: reply.inboxItemId,
        action: `reply:${reply.channel}`,
        executedBy: "dieter",
        result: `Sent to ${reply.recipientName || reply.recipient}: "${reply.message.slice(0, 100)}${reply.message.length > 100 ? '...' : ''}"`,
        metadata: JSON.stringify({
          message: reply.message,
          recipient: reply.recipient,
        }),
        createdAt: now,
      });

      // Mark inbox item as actioned
      if (reply.inboxItemId) {
        await db
          .update(inboxItems)
          .set({
            status: "actioned",
            updatedAt: now,
          })
          .where(eq(inboxItems.id, reply.inboxItemId));
      }
    } else {
      // Mark as failed
      await db
        .update(pendingReplies)
        .set({
          status: "failed",
          error: error || "Unknown error",
        })
        .where(eq(pendingReplies.id, id));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating reply status:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update reply" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, inboxActionLog } from "@/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// GET - fetch pending replies for OpenClaw to process
export async function GET() {
  try {
    // Get pending_reply entries that haven't been processed (result is null)
    const pending = await db
      .select()
      .from(inboxActionLog)
      .where(
        and(
          eq(inboxActionLog.action, "pending_reply"),
          isNull(inboxActionLog.result)
        )
      )
      .limit(10);

    return NextResponse.json({
      ok: true,
      replies: pending.map(r => {
        const meta = r.metadata ? JSON.parse(r.metadata) : {};
        return {
          id: r.id,
          inboxItemId: r.inboxItemId,
          channel: meta.channel,
          recipient: meta.recipient,
          recipientName: meta.recipientName,
          message: meta.message,
          createdAt: r.createdAt?.toISOString(),
        };
      }),
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
    const { id, success, error: errorMsg } = await request.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Get the pending reply entry
    const entries = await db
      .select()
      .from(inboxActionLog)
      .where(eq(inboxActionLog.id, id))
      .limit(1);

    if (entries.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Reply not found" },
        { status: 404 }
      );
    }

    const entry = entries[0];
    const meta = entry.metadata ? JSON.parse(entry.metadata) : {};

    if (success) {
      // Update the entry to mark as sent
      await db
        .update(inboxActionLog)
        .set({
          action: `reply:${meta.channel}`,
          executedBy: "dieter",
          result: `Sent to ${meta.recipientName || meta.recipient}: "${meta.message?.slice(0, 100)}${meta.message?.length > 100 ? '...' : ''}"`,
          metadata: JSON.stringify({ ...meta, status: "sent", sentAt: now.toISOString() }),
        })
        .where(eq(inboxActionLog.id, id));

      // Mark inbox item as actioned
      if (entry.inboxItemId) {
        await db
          .update(inboxItems)
          .set({
            status: "actioned",
            updatedAt: now,
          })
          .where(eq(inboxItems.id, entry.inboxItemId));
      }
    } else {
      // Mark as failed
      await db
        .update(inboxActionLog)
        .set({
          action: `reply_failed:${meta.channel}`,
          result: `Failed: ${errorMsg || "Unknown error"}`,
          metadata: JSON.stringify({ ...meta, status: "failed", error: errorMsg }),
        })
        .where(eq(inboxActionLog.id, id));
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

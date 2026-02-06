import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems } from "@/server/db/schema";
import { sql } from "drizzle-orm";

// GET endpoint to fetch all items with pending replies (for OpenClaw to poll)
export async function GET() {
  try {
    // Find all items where metadata->pendingReplies is not empty
    const items = await db
      .select()
      .from(inboxItems)
      .where(
        sql`${inboxItems.metadata}->>'pendingReplies' IS NOT NULL 
            AND ${inboxItems.metadata}->>'pendingReplies' != '[]'
            AND ${inboxItems.metadata}->>'pendingReplies' != 'null'`
      );

    return NextResponse.json({
      items: items.map(item => ({
        id: item.id,
        source: item.source,
        sender: item.sender,
        senderName: item.senderName,
        sourceId: item.sourceId,
        pendingReplies: (item.metadata as Record<string, unknown>)?.pendingReplies || [],
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

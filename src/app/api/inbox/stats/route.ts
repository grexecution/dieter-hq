import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems } from "@/server/db/schema";
import { sql, eq, isNotNull } from "drizzle-orm";
import {
  apiSuccess,
  apiError,
  ErrorCodes,
  type InboxStatsResponse,
  type InboxSource,
  type InboxStatus,
  type InboxPriority,
} from "@/server/inbox/validation";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "private, max-age=10", // Cache stats for 10 seconds
};

// GET /api/inbox/stats - Get counts by source, status, priority
export async function GET() {
  try {
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(inboxItems);
    const total = Number(totalResult[0]?.count || 0);

    // Get counts by source
    const sourceResult = await db
      .select({
        source: inboxItems.source,
        count: sql<number>`count(*)`,
      })
      .from(inboxItems)
      .groupBy(inboxItems.source);

    const bySource: Record<InboxSource, number> = {
      email: 0,
      whatsapp: 0,
      clickup: 0,
      slack: 0,
    };
    for (const row of sourceResult) {
      if (row.source in bySource) {
        bySource[row.source as InboxSource] = Number(row.count);
      }
    }

    // Get counts by status
    const statusResult = await db
      .select({
        status: inboxItems.status,
        count: sql<number>`count(*)`,
      })
      .from(inboxItems)
      .groupBy(inboxItems.status);

    const byStatus: Record<InboxStatus, number> = {
      pending: 0,
      actioned: 0,
      archived: 0,
      snoozed: 0,
    };
    for (const row of statusResult) {
      if (row.status in byStatus) {
        byStatus[row.status as InboxStatus] = Number(row.count);
      }
    }

    // Get counts by priority
    const priorityResult = await db
      .select({
        priority: inboxItems.priority,
        count: sql<number>`count(*)`,
      })
      .from(inboxItems)
      .groupBy(inboxItems.priority);

    const byPriority: Record<InboxPriority, number> = {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0,
    };
    for (const row of priorityResult) {
      if (row.priority in byPriority) {
        byPriority[row.priority as InboxPriority] = Number(row.count);
      }
    }

    // Get unread count
    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(inboxItems)
      .where(eq(inboxItems.isRead, false));
    const unread = Number(unreadResult[0]?.count || 0);

    // Get snoozed count (items with snoozedUntil set)
    const snoozedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(inboxItems)
      .where(isNotNull(inboxItems.snoozedUntil));
    const snoozed = Number(snoozedResult[0]?.count || 0);

    const stats: InboxStatsResponse = {
      total,
      bySource,
      byStatus,
      byPriority,
      unread,
      snoozed,
    };

    return NextResponse.json(
      apiSuccess(stats),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/stats] GET error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to fetch inbox stats"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

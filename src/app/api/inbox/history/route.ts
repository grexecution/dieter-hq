import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxActionLog, inboxItems, inboxRecommendations } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/inbox/history - Get action history
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const inboxItemId = searchParams.get("inboxItemId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  
  try {
    const whereClause = inboxItemId 
      ? eq(inboxActionLog.inboxItemId, inboxItemId) 
      : undefined;
    
    const logs = await db
      .select({
        log: inboxActionLog,
        inboxItem: inboxItems,
        recommendation: inboxRecommendations,
      })
      .from(inboxActionLog)
      .leftJoin(inboxItems, eq(inboxActionLog.inboxItemId, inboxItems.id))
      .leftJoin(inboxRecommendations, eq(inboxActionLog.recommendationId, inboxRecommendations.id))
      .where(whereClause)
      .orderBy(desc(inboxActionLog.createdAt))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json({
      ok: true,
      history: logs.map(l => ({
        ...l.log,
        inboxItem: l.inboxItem ? {
          id: l.inboxItem.id,
          source: l.inboxItem.source,
          sender: l.inboxItem.sender,
          subject: l.inboxItem.subject,
          preview: l.inboxItem.preview,
        } : null,
        recommendation: l.recommendation ? {
          id: l.recommendation.id,
          actionType: l.recommendation.actionType,
          actionLabel: l.recommendation.actionLabel,
        } : null,
        metadata: l.log.metadata ? JSON.parse(l.log.metadata) : null,
      })),
    });
  } catch (err) {
    console.error("Error fetching history:", err);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxRecommendations, inboxItems } from "@/server/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const runtime = "nodejs";

type RecommendationStatus = "pending" | "approved" | "rejected" | "executed";
type ActionType = "reply" | "archive" | "delegate" | "task" | "schedule" | "custom";

type RecommendationCreate = {
  inboxItemId: string;
  actionType: ActionType;
  actionLabel: string;
  actionDescription?: string;
  actionPayload?: string; // JSON string
  confidence?: number; // 0-100
  reasoning?: string;
};

// GET /api/inbox/recommendations - List recommendations with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const status = searchParams.get("status") as RecommendationStatus | null;
  const inboxItemId = searchParams.get("inboxItemId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  
  try {
    const conditions = [];
    if (status) conditions.push(eq(inboxRecommendations.status, status));
    if (inboxItemId) conditions.push(eq(inboxRecommendations.inboxItemId, inboxItemId));
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const recommendations = await db
      .select({
        recommendation: inboxRecommendations,
        inboxItem: inboxItems,
      })
      .from(inboxRecommendations)
      .leftJoin(inboxItems, eq(inboxRecommendations.inboxItemId, inboxItems.id))
      .where(whereClause)
      .orderBy(desc(inboxRecommendations.confidence), desc(inboxRecommendations.createdAt))
      .limit(limit);
    
    return NextResponse.json({
      ok: true,
      recommendations: recommendations.map(r => ({
        ...r.recommendation,
        inboxItem: r.inboxItem,
      })),
    });
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500 }
    );
  }
}

// POST /api/inbox/recommendations - Create new recommendation (used by AI/sync)
export async function POST(req: NextRequest) {
  let body: RecommendationCreate;
  try {
    body = (await req.json()) as RecommendationCreate;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }
  
  if (!body.inboxItemId || !body.actionType || !body.actionLabel) {
    return NextResponse.json(
      { ok: false, error: "missing_required_fields" },
      { status: 400 }
    );
  }
  
  const id = crypto.randomUUID();
  const now = new Date();
  
  try {
    // Verify inbox item exists
    const item = await db
      .select()
      .from(inboxItems)
      .where(eq(inboxItems.id, body.inboxItemId))
      .limit(1);
    
    if (item.length === 0) {
      return NextResponse.json(
        { ok: false, error: "inbox_item_not_found" },
        { status: 404 }
      );
    }
    
    await db.insert(inboxRecommendations).values({
      id,
      inboxItemId: body.inboxItemId,
      actionType: body.actionType,
      actionLabel: body.actionLabel,
      actionDescription: body.actionDescription || null,
      actionPayload: body.actionPayload || null,
      confidence: body.confidence ?? 50,
      reasoning: body.reasoning || null,
      status: "pending",
      createdAt: now,
    });
    
    return NextResponse.json({
      ok: true,
      recommendation: { id },
    });
  } catch (err) {
    console.error("Error creating recommendation:", err);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500 }
    );
  }
}

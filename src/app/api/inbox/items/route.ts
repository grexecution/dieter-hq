import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, inboxRecommendations } from "@/server/db/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";

export const runtime = "nodejs";

// Type definitions
type InboxSource = "email" | "whatsapp" | "clickup" | "slack";
type InboxPriority = "urgent" | "high" | "normal" | "low";
type InboxStatus = "pending" | "actioned" | "archived" | "snoozed";

type InboxItemCreate = {
  source: InboxSource;
  sourceId: string;
  sourceAccount?: string;
  threadId?: string;
  sender: string;
  senderName?: string;
  subject?: string;
  preview: string;
  content?: string;
  priority?: InboxPriority;
  receivedAt: string; // ISO date string
};

// GET /api/inbox/items - List inbox items with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Filter params
  const source = searchParams.get("source") as InboxSource | null;
  const status = searchParams.get("status") as InboxStatus | null;
  const priority = searchParams.get("priority") as InboxPriority | null;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  
  try {
    // Build query conditions
    const conditions = [];
    if (source) conditions.push(eq(inboxItems.source, source));
    if (status) conditions.push(eq(inboxItems.status, status));
    if (priority) conditions.push(eq(inboxItems.priority, priority));
    
    // Query with optional filters
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const items = await db
      .select()
      .from(inboxItems)
      .where(whereClause)
      .orderBy(desc(inboxItems.receivedAt))
      .limit(limit)
      .offset(offset);
    
    // Get recommendations for these items
    const itemIds = items.map(i => i.id);
    const recommendations = itemIds.length > 0 
      ? await db
          .select()
          .from(inboxRecommendations)
          .where(
            and(
              sql`${inboxRecommendations.inboxItemId} IN ${itemIds}`,
              eq(inboxRecommendations.status, "pending")
            )
          )
          .orderBy(desc(inboxRecommendations.confidence))
      : [];
    
    // Group recommendations by item
    const recommendationsByItem: Record<string, typeof recommendations> = {};
    for (const rec of recommendations) {
      if (!recommendationsByItem[rec.inboxItemId]) {
        recommendationsByItem[rec.inboxItemId] = [];
      }
      recommendationsByItem[rec.inboxItemId].push(rec);
    }
    
    // Combine items with their recommendations
    const itemsWithRecs = items.map(item => ({
      ...item,
      recommendations: recommendationsByItem[item.id] || [],
    }));
    
    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(inboxItems)
      .where(whereClause);
    
    const total = Number(countResult[0]?.count || 0);
    
    return NextResponse.json({
      ok: true,
      items: itemsWithRecs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    });
  } catch (err) {
    console.error("Error fetching inbox items:", err);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500 }
    );
  }
}

// POST /api/inbox/items - Create new inbox item
export async function POST(req: NextRequest) {
  let body: InboxItemCreate;
  try {
    body = (await req.json()) as InboxItemCreate;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }
  
  // Validate required fields
  if (!body.source || !body.sourceId || !body.sender || !body.preview || !body.receivedAt) {
    return NextResponse.json(
      { ok: false, error: "missing_required_fields" },
      { status: 400 }
    );
  }
  
  const id = crypto.randomUUID();
  const now = new Date();
  
  try {
    await db.insert(inboxItems).values({
      id,
      source: body.source,
      sourceId: body.sourceId,
      sourceAccount: body.sourceAccount || null,
      threadId: body.threadId || null,
      sender: body.sender,
      senderName: body.senderName || null,
      subject: body.subject || null,
      preview: body.preview,
      content: body.content || null,
      priority: body.priority || "normal",
      status: "pending",
      receivedAt: new Date(body.receivedAt),
      createdAt: now,
    });
    
    return NextResponse.json({
      ok: true,
      item: { id },
    });
  } catch (err) {
    console.error("Error creating inbox item:", err);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500 }
    );
  }
}

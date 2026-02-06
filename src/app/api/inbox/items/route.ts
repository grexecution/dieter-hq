import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, inboxRecommendations } from "@/server/db/schema";
import { eq, desc, asc, and, sql, lt, gt } from "drizzle-orm";
import {
  InboxItemsQuerySchema,
  CreateInboxItemSchema,
  apiSuccess,
  apiError,
  ErrorCodes,
  type InboxItemWithRecommendations,
  type PaginationInfo,
} from "@/server/inbox/validation";

export const runtime = "nodejs";

// Cache headers for list responses
const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, must-revalidate",
  "X-RateLimit-Limit": "100",
  "X-RateLimit-Window": "60",
};

// GET /api/inbox/items - List inbox items with filters, sorting, cursor pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Parse and validate query params
  const queryResult = InboxItemsQuerySchema.safeParse({
    source: searchParams.get("source") || undefined,
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
    isRead: searchParams.get("isRead") || undefined,
    limit: searchParams.get("limit") || undefined,
    cursor: searchParams.get("cursor") || undefined,
    offset: searchParams.get("offset") || undefined,
    sortBy: searchParams.get("sortBy") || undefined,
    sortOrder: searchParams.get("sortOrder") || undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid query parameters", queryResult.error.flatten()),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const query = queryResult.data;

  try {
    // Build filter conditions
    const conditions = [];
    if (query.source) conditions.push(eq(inboxItems.source, query.source));
    if (query.status) conditions.push(eq(inboxItems.status, query.status));
    if (query.priority) conditions.push(eq(inboxItems.priority, query.priority));
    if (query.isRead !== undefined) conditions.push(eq(inboxItems.isRead, query.isRead));
    
    // Cursor-based pagination (by receivedAt)
    if (query.cursor) {
      const cursorDate = new Date(query.cursor);
      if (query.sortOrder === "desc") {
        conditions.push(lt(inboxItems.receivedAt, cursorDate));
      } else {
        conditions.push(gt(inboxItems.receivedAt, cursorDate));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    const sortColumn = {
      receivedAt: inboxItems.receivedAt,
      priority: inboxItems.priority,
      source: inboxItems.source,
      createdAt: inboxItems.createdAt,
    }[query.sortBy];
    
    const orderFn = query.sortOrder === "desc" ? desc : asc;

    // Query items (fetch one extra to check hasMore)
    const items = await db
      .select()
      .from(inboxItems)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(query.limit + 1);

    const hasMore = items.length > query.limit;
    const resultItems = hasMore ? items.slice(0, -1) : items;
    
    // Get recommendations for these items in a single query (avoid N+1)
    const itemIds = resultItems.map(i => i.id);
    const recommendations = itemIds.length > 0
      ? await db
          .select()
          .from(inboxRecommendations)
          .where(
            and(
              sql`${inboxRecommendations.inboxItemId} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`,
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

    // Transform items with recommendations
    const itemsWithRecs: InboxItemWithRecommendations[] = resultItems.map(item => ({
      ...item,
      receivedAt: item.receivedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      archivedAt: item.archivedAt?.toISOString() || null,
      snoozedUntil: item.snoozedUntil?.toISOString() || null,
      recommendations: (recommendationsByItem[item.id] || []).map(rec => ({
        ...rec,
        executedAt: rec.executedAt?.toISOString() || null,
        createdAt: rec.createdAt.toISOString(),
        updatedAt: rec.updatedAt.toISOString(),
      })),
    })) as InboxItemWithRecommendations[];

    // Get total count (only if no cursor for efficiency)
    let total = 0;
    if (!query.cursor) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(inboxItems)
        .where(conditions.length > 0 ? and(...conditions.filter((_, i) => i < conditions.length)) : undefined);
      total = Number(countResult[0]?.count || 0);
    }

    // Compute next cursor
    const lastItem = resultItems[resultItems.length - 1];
    const nextCursor = hasMore && lastItem ? lastItem.receivedAt.toISOString() : null;

    const pagination: PaginationInfo = {
      total,
      limit: query.limit,
      hasMore,
      nextCursor,
    };

    return NextResponse.json(
      apiSuccess({ items: itemsWithRecs, pagination }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/items] GET error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to fetch inbox items"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

// POST /api/inbox/items - Create new inbox item
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      apiError(ErrorCodes.INVALID_JSON, "Request body must be valid JSON"),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const result = CreateInboxItemSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid request body", result.error.flatten()),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const data = result.data;
  const id = crypto.randomUUID();
  const now = new Date();

  try {
    await db.insert(inboxItems).values({
      id,
      source: data.source,
      sourceId: data.sourceId,
      sourceAccount: data.sourceAccount || null,
      threadId: data.threadId || null,
      sender: data.sender,
      senderName: data.senderName || null,
      subject: data.subject || null,
      preview: data.preview,
      content: data.content || null,
      priority: data.priority,
      status: "pending",
      isRead: false,
      receivedAt: new Date(data.receivedAt),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      snoozedUntil: null,
    });

    return NextResponse.json(
      apiSuccess({ id, createdAt: now.toISOString() }),
      { status: 201, headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/items] POST error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to create inbox item"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

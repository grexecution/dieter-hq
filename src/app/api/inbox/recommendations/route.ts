import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxRecommendations, inboxItems } from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import {
  CreateRecommendationSchema,
  RecommendationStatusSchema,
  apiSuccess,
  apiError,
  ErrorCodes,
} from "@/server/inbox/validation";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, must-revalidate",
};

// Query params schema
const QuerySchema = z.object({
  status: RecommendationStatusSchema.optional(),
  inboxItemId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/inbox/recommendations - List recommendations with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const queryResult = QuerySchema.safeParse({
    status: searchParams.get("status") || undefined,
    inboxItemId: searchParams.get("inboxItemId") || undefined,
    limit: searchParams.get("limit") || undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid query parameters", queryResult.error.flatten()),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const query = queryResult.data;

  try {
    const conditions = [];
    if (query.status) conditions.push(eq(inboxRecommendations.status, query.status));
    if (query.inboxItemId) conditions.push(eq(inboxRecommendations.inboxItemId, query.inboxItemId));

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
      .limit(query.limit);

    const transformed = recommendations.map(r => ({
      ...r.recommendation,
      executedAt: r.recommendation.executedAt?.toISOString() || null,
      createdAt: r.recommendation.createdAt.toISOString(),
      updatedAt: r.recommendation.updatedAt.toISOString(),
      inboxItem: r.inboxItem ? {
        ...r.inboxItem,
        receivedAt: r.inboxItem.receivedAt.toISOString(),
        createdAt: r.inboxItem.createdAt.toISOString(),
        updatedAt: r.inboxItem.updatedAt.toISOString(),
        archivedAt: r.inboxItem.archivedAt?.toISOString() || null,
        snoozedUntil: r.inboxItem.snoozedUntil?.toISOString() || null,
      } : null,
    }));

    return NextResponse.json(
      apiSuccess({ recommendations: transformed }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/recommendations] GET error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to fetch recommendations"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

// POST /api/inbox/recommendations - Create new recommendation (used by AI/sync)
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

  const result = CreateRecommendationSchema.safeParse(body);
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
    // Verify inbox item exists
    const item = await db
      .select()
      .from(inboxItems)
      .where(eq(inboxItems.id, data.inboxItemId))
      .limit(1);

    if (item.length === 0) {
      return NextResponse.json(
        apiError(ErrorCodes.NOT_FOUND, "Inbox item not found"),
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    await db.insert(inboxRecommendations).values({
      id,
      inboxItemId: data.inboxItemId,
      actionType: data.actionType,
      actionLabel: data.actionLabel,
      actionDescription: data.actionDescription || null,
      actionPayload: data.actionPayload || null,
      confidence: data.confidence ?? 50,
      reasoning: data.reasoning || null,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      apiSuccess({ id, createdAt: now.toISOString() }),
      { status: 201, headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/recommendations] POST error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to create recommendation"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

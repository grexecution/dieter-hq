import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, inboxRecommendations, inboxActionLog } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
  UpdateInboxItemSchema,
  apiSuccess,
  apiError,
  ErrorCodes,
  type InboxItemWithRecommendations,
} from "@/server/inbox/validation";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, must-revalidate",
};

// GET /api/inbox/items/[id] - Get single inbox item with recommendations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 1) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid item ID"),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  try {
    const items = await db
      .select()
      .from(inboxItems)
      .where(eq(inboxItems.id, id))
      .limit(1);

    if (items.length === 0) {
      return NextResponse.json(
        apiError(ErrorCodes.NOT_FOUND, "Inbox item not found"),
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    const item = items[0];

    // Get recommendations for this item
    const recommendations = await db
      .select()
      .from(inboxRecommendations)
      .where(eq(inboxRecommendations.inboxItemId, id))
      .orderBy(inboxRecommendations.createdAt);

    const response: InboxItemWithRecommendations = {
      ...item,
      receivedAt: item.receivedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      archivedAt: item.archivedAt?.toISOString() || null,
      snoozedUntil: item.snoozedUntil?.toISOString() || null,
      recommendations: recommendations.map(rec => ({
        ...rec,
        executedAt: rec.executedAt?.toISOString() || null,
        createdAt: rec.createdAt.toISOString(),
        updatedAt: rec.updatedAt.toISOString(),
      })),
    } as InboxItemWithRecommendations;

    return NextResponse.json(
      apiSuccess({ item: response }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/items/[id]] GET error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to fetch inbox item"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

// PATCH /api/inbox/items/[id] - Update inbox item status/priority/isRead
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 1) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid item ID"),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      apiError(ErrorCodes.INVALID_JSON, "Request body must be valid JSON"),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const result = UpdateInboxItemSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid request body", result.error.flatten()),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const updates = result.data;
  const now = new Date();

  try {
    // Check if item exists
    const existing = await db
      .select()
      .from(inboxItems)
      .where(eq(inboxItems.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        apiError(ErrorCodes.NOT_FOUND, "Inbox item not found"),
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    // Build update object
    const updateValues: Partial<typeof inboxItems.$inferInsert> = {
      updatedAt: now,
    };
    
    if (updates.status) {
      updateValues.status = updates.status;
      // Auto-set archivedAt when archiving
      if (updates.status === "archived") {
        updateValues.archivedAt = now;
      }
    }
    if (updates.priority) {
      updateValues.priority = updates.priority;
    }
    if (updates.isRead !== undefined) {
      updateValues.isRead = updates.isRead;
    }

    await db
      .update(inboxItems)
      .set(updateValues)
      .where(eq(inboxItems.id, id));

    // Log the action
    const actionParts = [];
    if (updates.status) actionParts.push(`status:${updates.status}`);
    if (updates.priority) actionParts.push(`priority:${updates.priority}`);
    if (updates.isRead !== undefined) actionParts.push(`isRead:${updates.isRead}`);

    await db.insert(inboxActionLog).values({
      id: crypto.randomUUID(),
      inboxItemId: id,
      action: actionParts.join(","),
      executedBy: "user",
      metadata: JSON.stringify(updates),
      createdAt: now,
    });

    return NextResponse.json(
      apiSuccess({ 
        id, 
        updated: updates, 
        updatedAt: now.toISOString() 
      }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/items/[id]] PATCH error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to update inbox item"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

// DELETE /api/inbox/items/[id] - Delete inbox item
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 1) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid item ID"),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  try {
    // Check if exists first
    const existing = await db
      .select({ id: inboxItems.id })
      .from(inboxItems)
      .where(eq(inboxItems.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        apiError(ErrorCodes.NOT_FOUND, "Inbox item not found"),
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    // Delete cascades to recommendations due to FK constraint
    await db.delete(inboxItems).where(eq(inboxItems.id, id));

    return NextResponse.json(
      apiSuccess({ deleted: true }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/items/[id]] DELETE error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to delete inbox item"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

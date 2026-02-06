import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, inboxActionLog } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  BulkCreateInboxItemsSchema,
  BulkUpdateInboxItemsSchema,
  apiSuccess,
  apiError,
  ErrorCodes,
} from "@/server/inbox/validation";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, must-revalidate",
  "X-RateLimit-Limit": "50",
  "X-RateLimit-Window": "60",
};

// POST /api/inbox/items/bulk - Bulk create inbox items (for sync)
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

  const result = BulkCreateInboxItemsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid request body", result.error.flatten()),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const { items } = result.data;
  const now = new Date();

  try {
    const insertValues = items.map(item => ({
      id: crypto.randomUUID(),
      source: item.source,
      sourceId: item.sourceId,
      sourceAccount: item.sourceAccount || null,
      threadId: item.threadId || null,
      sender: item.sender,
      senderName: item.senderName || null,
      subject: item.subject || null,
      preview: item.preview,
      content: item.content || null,
      priority: item.priority,
      status: "pending" as const,
      isRead: false,
      receivedAt: new Date(item.receivedAt),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      snoozedUntil: null,
    }));

    await db.insert(inboxItems).values(insertValues);

    const createdIds = insertValues.map(v => v.id);

    return NextResponse.json(
      apiSuccess({
        created: createdIds.length,
        ids: createdIds,
        createdAt: now.toISOString(),
      }),
      { status: 201, headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/items/bulk] POST error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to bulk create inbox items"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

// PATCH /api/inbox/items/bulk - Bulk update inbox items (archive/read multiple)
export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      apiError(ErrorCodes.INVALID_JSON, "Request body must be valid JSON"),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const result = BulkUpdateInboxItemsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid request body", result.error.flatten()),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const { ids, update } = result.data;
  const now = new Date();

  try {
    // Build update values
    const updateValues: Partial<typeof inboxItems.$inferInsert> = {
      updatedAt: now,
    };
    
    if (update.status) {
      updateValues.status = update.status;
      if (update.status === "archived") {
        updateValues.archivedAt = now;
      }
    }
    if (update.priority) {
      updateValues.priority = update.priority;
    }
    if (update.isRead !== undefined) {
      updateValues.isRead = update.isRead;
    }

    // Update all items matching the IDs
    await db
      .update(inboxItems)
      .set(updateValues)
      .where(sql`${inboxItems.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);

    // Log the bulk action
    const actionParts: string[] = [];
    if (update.status) actionParts.push(`status:${update.status}`);
    if (update.priority) actionParts.push(`priority:${update.priority}`);
    if (update.isRead !== undefined) actionParts.push(`isRead:${update.isRead}`);

    // Create log entries for each item
    const logEntries = ids.map(id => ({
      id: crypto.randomUUID(),
      inboxItemId: id,
      action: `bulk:${actionParts.join(",")}`,
      executedBy: "user" as const,
      metadata: JSON.stringify({ bulkIds: ids.length, update }),
      createdAt: now,
    }));

    if (logEntries.length > 0) {
      await db.insert(inboxActionLog).values(logEntries);
    }

    return NextResponse.json(
      apiSuccess({
        updated: ids.length,
        ids,
        changes: update,
        updatedAt: now.toISOString(),
      }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/items/bulk] PATCH error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to bulk update inbox items"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

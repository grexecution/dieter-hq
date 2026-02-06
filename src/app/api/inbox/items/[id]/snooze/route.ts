import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, inboxActionLog } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
  SnoozeInboxItemSchema,
  apiSuccess,
  apiError,
  ErrorCodes,
} from "@/server/inbox/validation";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, must-revalidate",
};

// POST /api/inbox/items/[id]/snooze - Snooze an inbox item until a specific time
export async function POST(
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

  const result = SnoozeInboxItemSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Invalid request body", result.error.flatten()),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

  const { until } = result.data;
  const snoozedUntil = new Date(until);
  const now = new Date();

  // Validate that snooze time is in the future
  if (snoozedUntil <= now) {
    return NextResponse.json(
      apiError(ErrorCodes.VALIDATION_ERROR, "Snooze time must be in the future"),
      { status: 400, headers: CACHE_HEADERS }
    );
  }

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

    // Update item with snooze
    await db
      .update(inboxItems)
      .set({
        status: "snoozed",
        snoozedUntil,
        updatedAt: now,
      })
      .where(eq(inboxItems.id, id));

    // Log the action
    await db.insert(inboxActionLog).values({
      id: crypto.randomUUID(),
      inboxItemId: id,
      action: `snoozed:${snoozedUntil.toISOString()}`,
      executedBy: "user",
      metadata: JSON.stringify({ snoozedUntil: snoozedUntil.toISOString() }),
      createdAt: now,
    });

    return NextResponse.json(
      apiSuccess({
        id,
        status: "snoozed",
        snoozedUntil: snoozedUntil.toISOString(),
        updatedAt: now.toISOString(),
      }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/items/[id]/snooze] POST error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to snooze inbox item"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

// DELETE /api/inbox/items/[id]/snooze - Unsnooze an inbox item
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

    // Clear snooze and set back to pending
    await db
      .update(inboxItems)
      .set({
        status: "pending",
        snoozedUntil: null,
        updatedAt: now,
      })
      .where(eq(inboxItems.id, id));

    // Log the action
    await db.insert(inboxActionLog).values({
      id: crypto.randomUUID(),
      inboxItemId: id,
      action: "unsnoozed",
      executedBy: "user",
      createdAt: now,
    });

    return NextResponse.json(
      apiSuccess({
        id,
        status: "pending",
        snoozedUntil: null,
        updatedAt: now.toISOString(),
      }),
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    console.error("[inbox/items/[id]/snooze] DELETE error:", err);
    return NextResponse.json(
      apiError(ErrorCodes.DATABASE_ERROR, "Failed to unsnooze inbox item"),
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

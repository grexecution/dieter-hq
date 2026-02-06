import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, inboxRecommendations, inboxActionLog } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

type InboxStatus = "pending" | "actioned" | "archived" | "snoozed";
type InboxPriority = "urgent" | "high" | "normal" | "low";

type UpdatePayload = {
  status?: InboxStatus;
  priority?: InboxPriority;
};

// GET /api/inbox/items/[id] - Get single inbox item with recommendations
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const items = await db
      .select()
      .from(inboxItems)
      .where(eq(inboxItems.id, id))
      .limit(1);
    
    if (items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }
    
    const item = items[0];
    
    // Get recommendations for this item
    const recommendations = await db
      .select()
      .from(inboxRecommendations)
      .where(eq(inboxRecommendations.inboxItemId, id))
      .orderBy(inboxRecommendations.createdAt);
    
    return NextResponse.json({
      ok: true,
      item: {
        ...item,
        recommendations,
      },
    });
  } catch (err) {
    console.error("Error fetching inbox item:", err);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500 }
    );
  }
}

// PATCH /api/inbox/items/[id] - Update inbox item status/priority
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  let body: UpdatePayload;
  try {
    body = (await req.json()) as UpdatePayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }
  
  // Validate at least one field to update
  if (!body.status && !body.priority) {
    return NextResponse.json(
      { ok: false, error: "no_fields_to_update" },
      { status: 400 }
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
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }
    
    // Build update object
    const updates: Partial<typeof inboxItems.$inferInsert> = {};
    if (body.status) updates.status = body.status;
    if (body.priority) updates.priority = body.priority;
    
    await db
      .update(inboxItems)
      .set(updates)
      .where(eq(inboxItems.id, id));
    
    // Log the action
    await db.insert(inboxActionLog).values({
      id: crypto.randomUUID(),
      inboxItemId: id,
      action: `status_change:${body.status || existing[0].status}`,
      executedBy: "user",
      metadata: JSON.stringify(body),
      createdAt: new Date(),
    });
    
    return NextResponse.json({
      ok: true,
      updated: { id, ...updates },
    });
  } catch (err) {
    console.error("Error updating inbox item:", err);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500 }
    );
  }
}

// DELETE /api/inbox/items/[id] - Delete inbox item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Delete cascades to recommendations due to FK constraint
    await db.delete(inboxItems).where(eq(inboxItems.id, id));
    
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error deleting inbox item:", err);
    return NextResponse.json(
      { ok: false, error: "database_error" },
      { status: 500 }
    );
  }
}

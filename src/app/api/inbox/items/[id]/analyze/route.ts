import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxItems, inboxRecommendations } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
  reanalyzeItem,
  type AnalysisContext,
} from "@/server/inbox";
import type { InboxItem } from "@/app/chat/inbox/types";

export const runtime = "nodejs";

type AnalyzePayload = {
  context?: AnalysisContext;
  updatePriority?: boolean; // Update item priority based on analysis
  replaceRecommendations?: boolean; // Replace existing recommendations
};

/**
 * POST /api/inbox/items/[id]/analyze
 *
 * Re-analyze an inbox item and regenerate recommendations.
 * Optionally updates the item's priority and replaces existing recommendations.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: AnalyzePayload = {};
  try {
    const text = await req.text();
    if (text) {
      body = JSON.parse(text) as AnalyzePayload;
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }

  try {
    // Fetch the inbox item
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

    const dbItem = items[0];

    // Convert DB item to InboxItem type
    const item: InboxItem = {
      id: dbItem.id,
      source: dbItem.source as InboxItem["source"],
      sourceId: dbItem.sourceId,
      sourceAccount: dbItem.sourceAccount,
      threadId: dbItem.threadId,
      sender: dbItem.sender,
      senderName: dbItem.senderName,
      subject: dbItem.subject,
      preview: dbItem.preview,
      content: dbItem.content,
      priority: dbItem.priority as InboxItem["priority"],
      status: dbItem.status as InboxItem["status"],
      isRead: dbItem.isRead,
      receivedAt: dbItem.receivedAt.toISOString(),
      createdAt: dbItem.createdAt.toISOString(),
      updatedAt: dbItem.updatedAt.toISOString(),
      archivedAt: dbItem.archivedAt?.toISOString() || null,
      snoozedUntil: dbItem.snoozedUntil?.toISOString() || null,
    };

    // Run analysis
    const analysisResult = await reanalyzeItem(item, body.context);

    // Update priority if requested
    if (body.updatePriority && analysisResult.priority !== item.priority) {
      await db
        .update(inboxItems)
        .set({ priority: analysisResult.priority })
        .where(eq(inboxItems.id, id));
    }

    // Handle recommendations
    const now = new Date();
    const newRecommendationIds: string[] = [];

    if (body.replaceRecommendations) {
      // Delete existing pending recommendations
      await db
        .delete(inboxRecommendations)
        .where(eq(inboxRecommendations.inboxItemId, id));
    }

    // Insert new recommendations
    for (const rec of analysisResult.recommendations) {
      const recId = crypto.randomUUID();
      newRecommendationIds.push(recId);

      await db.insert(inboxRecommendations).values({
        id: recId,
        inboxItemId: id,
        actionType: rec.actionType,
        actionLabel: rec.actionLabel,
        actionDescription: rec.actionDescription,
        actionPayload: JSON.stringify(rec.actionPayload),
        confidence: Math.round(rec.confidence),
        reasoning: rec.reasoning,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Fetch all current recommendations for response
    const allRecommendations = await db
      .select()
      .from(inboxRecommendations)
      .where(eq(inboxRecommendations.inboxItemId, id))
      .orderBy(inboxRecommendations.createdAt);

    return NextResponse.json({
      ok: true,
      itemId: id,
      analysis: {
        priority: analysisResult.priority,
        priorityUpdated:
          body.updatePriority && analysisResult.priority !== item.priority,
        contentType: analysisResult.analysis.contentType,
        needsToday: analysisResult.analysis.needsToday,
        isVip: analysisResult.analysis.isVip,
        hasDeadline: analysisResult.analysis.hasDeadline?.toISOString() || null,
      },
      recommendations: allRecommendations.map((r) => ({
        id: r.id,
        actionType: r.actionType,
        actionLabel: r.actionLabel,
        actionDescription: r.actionDescription,
        actionPayload: r.actionPayload ? JSON.parse(r.actionPayload) : null,
        confidence: r.confidence,
        reasoning: r.reasoning,
        status: r.status,
        isNew: newRecommendationIds.includes(r.id),
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Error analyzing inbox item:", err);
    return NextResponse.json(
      { ok: false, error: "analysis_failed" },
      { status: 500 }
    );
  }
}

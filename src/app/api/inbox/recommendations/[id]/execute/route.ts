import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxRecommendations, inboxItems, inboxActionLog } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/lib/messaging";

export const runtime = "nodejs";

type ExecutePayload = {
  approve?: boolean; // true = execute, false = reject
  modifiedPayload?: string; // JSON string if user modified the action
};

// POST /api/inbox/recommendations/[id]/execute - Execute or reject a recommendation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  let body: ExecutePayload;
  try {
    body = (await req.json()) as ExecutePayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }
  
  const approve = body.approve !== false; // Default to approve
  
  try {
    // Get the recommendation
    const recommendations = await db
      .select()
      .from(inboxRecommendations)
      .where(eq(inboxRecommendations.id, id))
      .limit(1);
    
    if (recommendations.length === 0) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }
    
    const recommendation = recommendations[0];
    
    if (recommendation.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "already_processed" },
        { status: 400 }
      );
    }
    
    const now = new Date();
    let executionResult = "";
    
    if (approve) {
      // Execute the action based on type
      const payload = body.modifiedPayload 
        ? JSON.parse(body.modifiedPayload) 
        : recommendation.actionPayload 
          ? JSON.parse(recommendation.actionPayload)
          : {};
      
      // Get the inbox item for context (sender, source, etc.)
      const inboxItemRows = await db
        .select()
        .from(inboxItems)
        .where(eq(inboxItems.id, recommendation.inboxItemId))
        .limit(1);
      
      const inboxItem = inboxItemRows[0];
      
      switch (recommendation.actionType) {
        case "reply": {
          // Get the draft text
          const draftText = payload.draft || payload.draftText || payload.message || payload.text;
          
          if (!draftText) {
            return NextResponse.json(
              { ok: false, error: "no_draft_text" },
              { status: 400 }
            );
          }
          
          if (!inboxItem) {
            return NextResponse.json(
              { ok: false, error: "inbox_item_not_found" },
              { status: 404 }
            );
          }
          
          // Send based on source
          if (inboxItem.source === "whatsapp") {
            const result = await sendWhatsAppMessage(
              inboxItem.sender,
              draftText,
              inboxItem.sourceId // reply to original message
            );
            
            if (!result.ok) {
              console.error("[execute] WhatsApp send failed:", result.error);
              return NextResponse.json(
                { ok: false, error: `send_failed: ${result.error}` },
                { status: 500 }
              );
            }
            
            executionResult = `WhatsApp sent to ${inboxItem.senderName || inboxItem.sender}: "${draftText.slice(0, 100)}${draftText.length > 100 ? '...' : ''}"`;
          } else {
            // For other sources, mark as not implemented yet
            executionResult = `Reply for ${inboxItem.source} not yet implemented. Draft: ${draftText.slice(0, 100)}`;
          }
          break;
        }
        case "archive":
          await db
            .update(inboxItems)
            .set({ status: "archived" })
            .where(eq(inboxItems.id, recommendation.inboxItemId));
          executionResult = "Item archived";
          break;
        case "delegate":
          executionResult = `Delegated to: ${payload.delegateTo || "unknown"}`;
          break;
        case "task":
          executionResult = `Task created: ${payload.taskTitle || "(untitled)"}`;
          break;
        case "schedule":
          executionResult = `Scheduled for: ${payload.scheduledTime || "later"}`;
          break;
        default:
          executionResult = "Custom action executed";
      }
      
      // Update recommendation status
      await db
        .update(inboxRecommendations)
        .set({
          status: "executed",
          executedAt: now,
          executionResult,
          actionPayload: body.modifiedPayload || recommendation.actionPayload,
        })
        .where(eq(inboxRecommendations.id, id));
      
      // Update inbox item status to actioned (unless archived)
      if (recommendation.actionType !== "archive") {
        await db
          .update(inboxItems)
          .set({ status: "actioned" })
          .where(eq(inboxItems.id, recommendation.inboxItemId));
      }
    } else {
      // Reject the recommendation
      await db
        .update(inboxRecommendations)
        .set({
          status: "rejected",
          executedAt: now,
          executionResult: "Rejected by user",
        })
        .where(eq(inboxRecommendations.id, id));
      
      executionResult = "Rejected";
    }
    
    // Log the action
    await db.insert(inboxActionLog).values({
      id: crypto.randomUUID(),
      recommendationId: id,
      inboxItemId: recommendation.inboxItemId,
      action: approve ? `execute:${recommendation.actionType}` : "reject",
      executedBy: "user",
      result: executionResult,
      metadata: JSON.stringify({
        originalPayload: recommendation.actionPayload,
        modifiedPayload: body.modifiedPayload,
      }),
      createdAt: now,
    });
    
    return NextResponse.json({
      ok: true,
      status: approve ? "executed" : "rejected",
      result: executionResult,
    });
  } catch (err) {
    console.error("Error executing recommendation:", err);
    return NextResponse.json(
      { ok: false, error: "execution_failed" },
      { status: 500 }
    );
  }
}

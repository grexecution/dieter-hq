import { NextRequest, NextResponse } from "next/server";
import { getContextStatus, getContextState, needsSummarization, autoSummarize } from "@/server/infinite-context";

export const runtime = "nodejs";

/**
 * GET /api/chat/context?threadId=xxx
 * Get context status for a thread (for debugging/display)
 */
export async function GET(req: NextRequest) {
  const threadId = req.nextUrl.searchParams.get("threadId") || "main";

  try {
    const status = await getContextStatus(threadId);
    const needsSum = await needsSummarization(threadId);

    return NextResponse.json({
      ok: true,
      threadId,
      contextUtilization: Math.round(status.state.contextUtilization),
      totalTokens: status.state.totalTokens,
      activeMessages: status.state.activeMessageCount,
      snapshotCount: status.snapshotCount,
      needsSummarization: needsSum,
      oldestSnapshot: status.oldestSnapshotDate?.toISOString() || null,
      latestSnapshot: status.latestSnapshotDate?.toISOString() || null,
      estimatedLength: status.estimatedConversationLength,
    });
  } catch (error) {
    console.error("[Context API] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get context status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/context
 * Trigger manual summarization for testing
 * Body: { threadId: string, action: "summarize" | "status" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const threadId = body.threadId || "main";
    const action = body.action || "status";

    if (action === "summarize") {
      console.log(`[Context API] Manual summarize triggered for thread ${threadId}`);
      const snapshot = await autoSummarize(threadId);
      
      if (snapshot) {
        return NextResponse.json({
          ok: true,
          action: "summarized",
          snapshot: {
            id: snapshot.id,
            messageCount: snapshot.messageCount,
            tokensSaved: snapshot.tokenCount - snapshot.compressedTokens,
            summary: snapshot.summary.slice(0, 200) + "...",
          },
        });
      } else {
        return NextResponse.json({
          ok: true,
          action: "skipped",
          reason: "Not enough messages to summarize or threshold not met",
        });
      }
    }

    // Default: return status
    const status = await getContextStatus(threadId);
    return NextResponse.json({
      ok: true,
      action: "status",
      status,
    });
  } catch (error) {
    console.error("[Context API] Error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

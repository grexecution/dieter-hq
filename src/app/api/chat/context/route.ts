/**
 * Context Status API
 * 
 * GET /api/chat/context?thread=main
 * Returns the infinite context status for a thread
 */

import { NextRequest, NextResponse } from "next/server";
import { getContextStatus, getContextState } from "@/server/infinite-context";

export async function GET(req: NextRequest) {
  const threadId = String(req.nextUrl.searchParams.get("thread") ?? "main");

  try {
    const status = await getContextStatus(threadId);
    
    return NextResponse.json({
      ok: true,
      threadId,
      context: {
        utilization: Math.round(status.state.contextUtilization),
        utilizationFormatted: `${Math.round(status.state.contextUtilization)}%`,
        totalTokens: status.state.totalTokens,
        activeMessages: status.state.activeMessageCount,
        snapshotCount: status.snapshotCount,
        totalConversationLength: status.estimatedConversationLength,
        oldestMemory: status.oldestSnapshotDate?.toISOString() || null,
        latestSnapshot: status.latestSnapshotDate?.toISOString() || null,
        lastSnapshotAt: status.state.lastSnapshotAt?.toISOString() || null,
        status: status.state.contextUtilization < 50 
          ? 'healthy' 
          : status.state.contextUtilization < 70 
            ? 'moderate' 
            : 'high',
      }
    });
  } catch (error) {
    console.error('[Context API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to get context status' },
      { status: 500 }
    );
  }
}

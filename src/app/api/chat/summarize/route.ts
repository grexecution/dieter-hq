/**
 * Manual Summarization API
 * 
 * POST /api/chat/summarize
 * { "threadId": "main" }
 * 
 * Manually triggers summarization for a thread (useful for testing)
 */

import { NextRequest, NextResponse } from "next/server";
import { autoSummarize, getContextStatus, DEFAULT_CONFIG } from "@/server/infinite-context";

export async function POST(req: NextRequest) {
  try {
    const { threadId = "main", force = false } = await req.json();

    // Get status before
    const statusBefore = await getContextStatus(threadId);

    if (!force && statusBefore.state.activeMessageCount < DEFAULT_CONFIG.minMessagesToSummarize + DEFAULT_CONFIG.keepRecentMessages) {
      return NextResponse.json({
        ok: false,
        error: 'Not enough messages to summarize',
        required: DEFAULT_CONFIG.minMessagesToSummarize + DEFAULT_CONFIG.keepRecentMessages,
        current: statusBefore.state.activeMessageCount,
      });
    }

    // Run summarization
    const snapshot = await autoSummarize(threadId, {
      ...DEFAULT_CONFIG,
      summarizeThreshold: force ? 0 : DEFAULT_CONFIG.summarizeThreshold,
      minMessagesToSummarize: force ? 5 : DEFAULT_CONFIG.minMessagesToSummarize,
    });

    if (!snapshot) {
      return NextResponse.json({
        ok: false,
        error: 'Summarization produced no snapshot',
        status: statusBefore,
      });
    }

    // Get status after
    const statusAfter = await getContextStatus(threadId);

    return NextResponse.json({
      ok: true,
      snapshot: {
        id: snapshot.id,
        summary: snapshot.summary,
        keyPoints: snapshot.keyPoints,
        messageCount: snapshot.messageCount,
        tokensSaved: snapshot.tokenCount - snapshot.compressedTokens,
        compressionRatio: `${Math.round((1 - snapshot.compressedTokens / snapshot.tokenCount) * 100)}%`,
      },
      before: {
        utilization: Math.round(statusBefore.state.contextUtilization),
        activeMessages: statusBefore.state.activeMessageCount,
        totalTokens: statusBefore.state.totalTokens,
      },
      after: {
        utilization: Math.round(statusAfter.state.contextUtilization),
        activeMessages: statusAfter.state.activeMessageCount,
        totalTokens: statusAfter.state.totalTokens,
        snapshotCount: statusAfter.snapshotCount,
      },
    });
  } catch (error) {
    console.error('[Summarize API] Error:', error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

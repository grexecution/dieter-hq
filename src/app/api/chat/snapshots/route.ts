/**
 * Memory Snapshots API
 * 
 * GET /api/chat/snapshots?thread=main
 * Returns all memory snapshots for a thread (conversation history summaries)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { memorySnapshots } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const threadId = String(req.nextUrl.searchParams.get("thread") ?? "main");

  try {
    const snapshots = await db
      .select()
      .from(memorySnapshots)
      .where(eq(memorySnapshots.threadId, threadId))
      .orderBy(desc(memorySnapshots.createdAt));

    const formatted = snapshots.map(s => ({
      id: s.id,
      summary: s.summary,
      keyPoints: JSON.parse(s.keyPointsJson),
      entities: JSON.parse(s.entitiesJson),
      messageCount: s.messageCount,
      tokenCount: s.tokenCount,
      compressedTokens: s.compressedTokens,
      compressionRatio: `${Math.round((1 - s.compressedTokens / s.tokenCount) * 100)}%`,
      dateRange: {
        from: s.firstMessageAt.toISOString(),
        to: s.lastMessageAt.toISOString(),
      },
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      threadId,
      count: snapshots.length,
      snapshots: formatted,
      totalMessagesArchived: snapshots.reduce((sum, s) => sum + s.messageCount, 0),
      totalTokensCompressed: snapshots.reduce((sum, s) => sum + (s.tokenCount - s.compressedTokens), 0),
    });
  } catch (error) {
    console.error('[Snapshots API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}

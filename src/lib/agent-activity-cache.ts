/**
 * Agent Activity Cache
 * Uses DB for persistence (Vercel serverless compatible)
 */

import { db } from "@/server/db";
import { inboxSyncState } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const CACHE_ID = "agent-activity";
const STALE_THRESHOLD_MS = 600_000; // 10 minutes - synced by launchd every 30 min

export interface AgentSession {
  key: string;
  label?: string;
  channel?: string;
  updatedAt: number;
  model?: string;
  totalTokens?: number;
  contextTokens?: number;
  abortedLastRun?: boolean;
  lastMessage?: string;
}

export interface AgentActivityData {
  sessions: AgentSession[];
  updatedAt: string;
}

/**
 * Get cached activity data from DB
 */
export async function getActivityCache(): Promise<AgentActivityData | null> {
  try {
    const result = await db
      .select()
      .from(inboxSyncState)
      .where(eq(inboxSyncState.id, CACHE_ID))
      .limit(1);

    if (result.length === 0 || !result[0].metadata) {
      return null;
    }

    const entry = result[0];
    const age = entry.lastSyncAt ? Date.now() - entry.lastSyncAt.getTime() : Infinity;

    // Return null if too stale
    if (age > STALE_THRESHOLD_MS) {
      return null;
    }

    const data = JSON.parse(entry.metadata) as AgentActivityData;
    return data;
  } catch (error) {
    console.error('[agent-activity-cache] Get error:', error);
    return null;
  }
}

/**
 * Store activity data in DB cache
 */
export async function setActivityCache(data: AgentActivityData): Promise<void> {
  try {
    const now = new Date();
    const metadata = JSON.stringify(data);

    await db
      .insert(inboxSyncState)
      .values({
        id: CACHE_ID,
        source: "openclaw",
        account: null,
        lastSyncAt: now,
        lastMessageId: null,
        metadata,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: inboxSyncState.id,
        set: {
          lastSyncAt: now,
          metadata,
          updatedAt: now,
        },
      });
  } catch (error) {
    console.error('[agent-activity-cache] Set error:', error);
    throw error;
  }
}

/**
 * Get cache stats
 */
export async function getCacheStats(): Promise<{
  hasData: boolean;
  isStale: boolean;
  ageMs: number | null;
  sessionCount: number;
}> {
  try {
    const result = await db
      .select()
      .from(inboxSyncState)
      .where(eq(inboxSyncState.id, CACHE_ID))
      .limit(1);

    if (result.length === 0 || !result[0].metadata) {
      return { hasData: false, isStale: true, ageMs: null, sessionCount: 0 };
    }

    const entry = result[0];
    const ageMs = entry.lastSyncAt ? Date.now() - entry.lastSyncAt.getTime() : null;
    const data = JSON.parse(entry.metadata) as AgentActivityData;

    return {
      hasData: true,
      isStale: ageMs !== null && ageMs > STALE_THRESHOLD_MS,
      ageMs,
      sessionCount: data.sessions?.length ?? 0,
    };
  } catch {
    return { hasData: false, isStale: true, ageMs: null, sessionCount: 0 };
  }
}

// Legacy exports for compatibility
export const agentActivityCache = {
  get: getActivityCache,
  set: setActivityCache,
  getStats: getCacheStats,
};

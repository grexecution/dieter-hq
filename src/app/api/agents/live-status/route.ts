import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { inboxSyncState } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const CACHE_ID = "agent-activity";

export interface LiveAgentStatus {
  ok: boolean;
  timestamp: number;
  mainSession: {
    key: string;
    isActive: boolean;
    lastActiveMs: number;
    tokens: number;
    maxTokens: number;
    model: string;
    percentUsed: number;
  } | null;
  subagents: {
    key: string;
    label: string;
    isActive: boolean;
    lastActiveMs: number;
    tokens: number;
  }[];
  totalActiveAgents: number;
  status: "idle" | "working" | "subagents-working" | "stuck" | "offline";
  statusText: string;
  cacheAgeMs: number;
}

interface CachedSession {
  key: string;
  label?: string;
  updatedAt: number;
  model?: string;
  totalTokens?: number;
  contextTokens?: number;
  percentUsed?: number;
  abortedLastRun?: boolean;
}

/**
 * GET /api/agents/live-status
 * 
 * Returns cached session data from the DB.
 * Synced by launchd script every 30 minutes (or manually).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const threadId = url.searchParams.get("thread") || "dieterhq";
  
  try {
    // Get the cached activity data
    const result = await db
      .select()
      .from(inboxSyncState)
      .where(eq(inboxSyncState.id, CACHE_ID))
      .limit(1);
    
    const now = Date.now();
    
    if (result.length === 0 || !result[0].metadata) {
      return NextResponse.json({
        ok: true,
        timestamp: now,
        mainSession: null,
        subagents: [],
        totalActiveAgents: 0,
        status: "offline",
        statusText: "Keine Daten",
        cacheAgeMs: 0,
      } as LiveAgentStatus);
    }
    
    const entry = result[0];
    const cacheTime = entry.lastSyncAt ? entry.lastSyncAt.getTime() : 0;
    const cacheAgeMs = now - cacheTime;
    
    // Parse cached data
    const cacheData = JSON.parse(entry.metadata) as { sessions: CachedSession[] };
    const sessions = cacheData.sessions || [];
    
    // Find main session for this thread
    const mainSessionData = sessions.find((s) => 
      s.key?.includes(`:${threadId}`) && !s.key.includes("subagent")
    );
    
    // Find active subagents
    const activeSubagents = sessions
      .filter((s) => s.key?.includes("subagent"))
      .filter((s) => (now - (s.updatedAt || 0)) < 120000) // Active in last 2 min
      .map((s) => ({
        key: s.key,
        label: s.label || s.key?.split(":").pop() || "subagent",
        isActive: (now - (s.updatedAt || 0)) < 60000,
        lastActiveMs: now - (s.updatedAt || 0),
        tokens: s.totalTokens || 0,
      }));
    
    // Check if main session is active
    const mainIsActive = mainSessionData && (now - (mainSessionData.updatedAt || 0)) < 60000;
    const isStuck = mainSessionData?.abortedLastRun === true;
    
    // Build main session response
    const mainSession = mainSessionData ? {
      key: mainSessionData.key,
      isActive: mainIsActive || false,
      lastActiveMs: now - (mainSessionData.updatedAt || cacheTime),
      tokens: mainSessionData.totalTokens || 0,
      maxTokens: mainSessionData.contextTokens || 200000,
      model: mainSessionData.model || "claude-opus-4-5",
      percentUsed: mainSessionData.percentUsed || Math.round(((mainSessionData.totalTokens || 0) / (mainSessionData.contextTokens || 200000)) * 100),
    } : null;
    
    // Determine status
    let status: LiveAgentStatus["status"] = "idle";
    let statusText = "Bereit";
    
    if (cacheAgeMs > 600000) {
      // Cache older than 10 minutes
      status = "offline";
      statusText = "Sync ausstehend";
    } else if (isStuck) {
      status = "stuck";
      statusText = "Fehler aufgetreten";
    } else if (mainIsActive) {
      status = "working";
      statusText = "Dieter arbeitet...";
    } else if (activeSubagents.length > 0) {
      status = "subagents-working";
      statusText = `${activeSubagents.length} Agent${activeSubagents.length > 1 ? "s" : ""} arbeiten`;
    }
    
    return NextResponse.json({
      ok: true,
      timestamp: now,
      mainSession,
      subagents: activeSubagents,
      totalActiveAgents: (mainIsActive ? 1 : 0) + activeSubagents.length,
      status,
      statusText,
      cacheAgeMs,
    } as LiveAgentStatus, {
      headers: {
        "Cache-Control": "public, s-maxage=3, stale-while-revalidate=10",
      },
    });
  } catch (error) {
    console.error("[LiveStatus] Error:", error);
    
    return NextResponse.json({
      ok: false,
      timestamp: Date.now(),
      mainSession: null,
      subagents: [],
      totalActiveAgents: 0,
      status: "offline",
      statusText: "Fehler",
      cacheAgeMs: 0,
    } as LiveAgentStatus);
  }
}

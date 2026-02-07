import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

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

/**
 * GET /api/agents/live-status
 * 
 * Returns cached session data from the DB.
 * The sync script (launchd) updates this every 30 minutes,
 * but the data also gets updated when agents are active.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const threadId = url.searchParams.get("thread") || "dieterhq";
  
  try {
    // Get the latest agent activity from the cache table
    const result = await db.execute(sql`
      SELECT 
        data,
        updated_at
      FROM agent_activity_cache
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    
    const now = Date.now();
    
    if (!result.rows || result.rows.length === 0) {
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
    
    const row = result.rows[0] as { data: string; updated_at: Date };
    const cacheData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    const cacheTime = new Date(row.updated_at).getTime();
    const cacheAgeMs = now - cacheTime;
    
    // Parse sessions from cache
    const sessions = cacheData.sessions || [];
    
    // Find main session for this thread
    const mainSessionData = sessions.find((s: { key?: string }) => 
      s.key?.includes(`dieter-hq:dev:${threadId}`) || s.key?.includes(`:${threadId}`)
    );
    
    // Find subagents (sessions with "subagent" in key)
    const subagentSessions = sessions.filter((s: { key?: string }) => 
      s.key?.includes("subagent")
    );
    
    // Determine if sessions are active (based on cache age + last update)
    const isStale = cacheAgeMs > 60000; // Cache older than 1 minute
    
    // Build response
    const mainSession = mainSessionData ? {
      key: mainSessionData.key,
      isActive: !isStale && (now - (mainSessionData.updatedAt || 0)) < 30000,
      lastActiveMs: now - (mainSessionData.updatedAt || cacheTime),
      tokens: mainSessionData.totalTokens || 0,
      maxTokens: mainSessionData.contextTokens || 200000,
      model: mainSessionData.model || "claude-opus-4-5",
    } : null;
    
    const subagents = subagentSessions.map((s: { key?: string; label?: string; updatedAt?: number; totalTokens?: number }) => ({
      key: s.key || "",
      label: s.label || s.key?.split(":").pop() || "subagent",
      isActive: !isStale && (now - (s.updatedAt || 0)) < 60000,
      lastActiveMs: now - (s.updatedAt || cacheTime),
      tokens: s.totalTokens || 0,
    })).filter((s: { isActive: boolean }) => s.isActive);
    
    // Determine status
    let status: LiveAgentStatus["status"] = "idle";
    let statusText = "Bereit";
    
    if (isStale && cacheAgeMs > 300000) {
      // Cache older than 5 minutes
      status = "offline";
      statusText = "Sync ausstehend";
    } else if (mainSession?.isActive) {
      status = "working";
      statusText = "Dieter arbeitet...";
    } else if (subagents.length > 0) {
      status = "subagents-working";
      statusText = `${subagents.length} Agent${subagents.length > 1 ? "s" : ""} arbeiten`;
    }
    
    return NextResponse.json({
      ok: true,
      timestamp: now,
      mainSession,
      subagents,
      totalActiveAgents: (mainSession?.isActive ? 1 : 0) + subagents.length,
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
      error: error instanceof Error ? error.message : "Unknown error",
    } as LiveAgentStatus & { error: string });
  }
}

import { NextResponse } from "next/server";

// Gateway URL via Tailscale Funnel
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "https://mac-mini-von-dieter.tail954ecb.ts.net";
const GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD || "";

interface GatewaySession {
  key: string;
  kind: string;
  label?: string;
  displayName?: string;
  updatedAt: number;
  sessionId: string;
  model: string;
  totalTokens: number;
  contextTokens?: number;
  abortedLastRun?: boolean;
}

interface GatewaySessionsResponse {
  count: number;
  sessions: GatewaySession[];
}

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
  status: "idle" | "working" | "subagents-working" | "stuck";
  statusText: string;
}

/**
 * GET /api/agents/live-status
 * 
 * Fetches real-time session data from the OpenClaw Gateway
 * to show what the agent is currently doing.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const threadId = url.searchParams.get("thread") || "dieterhq";
  
  try {
    // Call the Gateway's sessions.list tool
    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GATEWAY_PASSWORD}`,
      },
      body: JSON.stringify({
        model: "tool",
        tool: "sessions_list",
        tool_input: {
          activeMinutes: 30,
          messageLimit: 0,
        },
      }),
      // Short timeout for status checks
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`);
    }

    const data = await response.json() as GatewaySessionsResponse;
    const now = Date.now();
    
    // Find the main session for this thread
    const mainSessionKey = `dieter-hq:dev:${threadId}`;
    const mainSession = data.sessions.find(s => s.key.includes(mainSessionKey));
    
    // Find all subagents (sessions with "subagent" in key)
    const subagents = data.sessions
      .filter(s => s.key.includes("subagent"))
      .map(s => ({
        key: s.key,
        label: s.label || s.key.split(":").pop() || "unknown",
        isActive: (now - s.updatedAt) < 60000, // Active if updated in last 60s
        lastActiveMs: now - s.updatedAt,
        tokens: s.totalTokens,
      }))
      .filter(s => s.isActive); // Only show active subagents
    
    // Determine overall status
    const mainIsActive = mainSession && (now - mainSession.updatedAt) < 30000;
    const hasActiveSubagents = subagents.length > 0;
    const isStuck = mainSession?.abortedLastRun === true;
    
    let status: LiveAgentStatus["status"] = "idle";
    let statusText = "Bereit";
    
    if (isStuck) {
      status = "stuck";
      statusText = "Fehler aufgetreten";
    } else if (mainIsActive) {
      status = "working";
      statusText = "Dieter arbeitet...";
    } else if (hasActiveSubagents) {
      status = "subagents-working";
      statusText = `${subagents.length} Agent${subagents.length > 1 ? "s" : ""} arbeiten`;
    }
    
    const result: LiveAgentStatus = {
      ok: true,
      timestamp: now,
      mainSession: mainSession ? {
        key: mainSession.key,
        isActive: mainIsActive || false,
        lastActiveMs: now - mainSession.updatedAt,
        tokens: mainSession.totalTokens,
        maxTokens: mainSession.contextTokens || 200000,
        model: mainSession.model,
      } : null,
      subagents,
      totalActiveAgents: (mainIsActive ? 1 : 0) + subagents.length,
      status,
      statusText,
    };
    
    return NextResponse.json(result, {
      headers: {
        // Short cache - this is real-time status
        "Cache-Control": "public, s-maxage=2, stale-while-revalidate=5",
      },
    });
  } catch (error) {
    console.error("[LiveStatus] Error:", error);
    
    // Return offline status on error
    return NextResponse.json({
      ok: false,
      timestamp: Date.now(),
      mainSession: null,
      subagents: [],
      totalActiveAgents: 0,
      status: "idle",
      statusText: "Offline",
      error: error instanceof Error ? error.message : "Unknown error",
    } as LiveAgentStatus & { error: string });
  }
}

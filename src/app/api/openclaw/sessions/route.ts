import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENCLAW_GATEWAY_URL =
  process.env.OPENCLAW_GATEWAY_URL ||
  "https://mac-mini-von-dieter.tail954ecb.ts.net";
const OPENCLAW_GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD || "";

export type SessionData = {
  key: string;
  model: string;
  totalTokens: number;
  inputTokens?: number;
  outputTokens?: number;
  updatedAt: string;
  createdAt?: string;
  label?: string;
  channel?: string;
  status?: string;
};

export type SessionsResponse = {
  ok: boolean;
  sessions: SessionData[];
  subagents: SessionData[];
  error?: string;
};

function isSubagent(session: SessionData): boolean {
  return session.key.includes("subagent");
}

function extractLabel(key: string): string {
  const parts = key.split(":");
  if (parts.length > 4) {
    return parts.slice(4).join(":");
  }
  const agentName = parts[1] || "agent";
  const uuid = parts[3] || "";
  const shortUuid = uuid.slice(0, 8);
  return `${agentName}-${shortUuid}`;
}

function calculateRuntime(createdAt?: string, updatedAt?: string): number {
  if (!createdAt && !updatedAt) return 0;
  const start = createdAt ? new Date(createdAt).getTime() : 0;
  const end = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  return Math.max(0, end - start);
}

export async function GET() {
  // If no password configured, return empty gracefully (feature not available)
  if (!OPENCLAW_GATEWAY_PASSWORD) {
    return NextResponse.json({
      ok: true,
      sessions: [],
      subagents: [],
      totalCount: 0,
      subagentCount: 0,
      note: "Gateway password not configured",
    });
  }

  try {
    // Note: OpenClaw Gateway doesn't expose a sessions HTTP endpoint by default.
    // The /sessions path returns the Control UI HTML, not JSON data.
    // We handle this gracefully by detecting HTML responses.
    
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/sessions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${OPENCLAW_GATEWAY_PASSWORD}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    
    // If we get HTML back, the endpoint isn't available as JSON API
    if (contentType.includes("text/html")) {
      return NextResponse.json({
        ok: true,
        sessions: [],
        subagents: [],
        totalCount: 0,
        subagentCount: 0,
        note: "Gateway sessions endpoint not available via HTTP",
      });
    }

    if (!response.ok) {
      // Return gracefully with empty data instead of error status
      return NextResponse.json({
        ok: true,
        sessions: [],
        subagents: [],
        totalCount: 0,
        subagentCount: 0,
        note: `Gateway returned ${response.status}`,
      });
    }

    // Try to parse JSON
    let data;
    try {
      data = await response.json();
    } catch {
      // If JSON parsing fails, return empty gracefully
      return NextResponse.json({
        ok: true,
        sessions: [],
        subagents: [],
        totalCount: 0,
        subagentCount: 0,
        note: "Failed to parse gateway response",
      });
    }
    
    // The gateway returns sessions in various formats, normalize them
    let sessions: SessionData[] = [];
    
    if (Array.isArray(data)) {
      sessions = data;
    } else if (data.sessions && Array.isArray(data.sessions)) {
      sessions = data.sessions;
    } else if (data.data && Array.isArray(data.data)) {
      sessions = data.data;
    }

    // Enrich sessions with computed fields
    const enrichedSessions = sessions.map((s: SessionData) => ({
      ...s,
      label: s.label || extractLabel(s.key),
      runtimeMs: calculateRuntime(s.createdAt, s.updatedAt),
      isSubagent: isSubagent(s),
    }));

    // Filter to only subagents
    const subagents = enrichedSessions.filter((s) => s.isSubagent);

    return NextResponse.json({
      ok: true,
      sessions: enrichedSessions,
      subagents,
      totalCount: enrichedSessions.length,
      subagentCount: subagents.length,
    });
  } catch (error) {
    // Network errors or other issues - return empty gracefully
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      ok: true,
      sessions: [],
      subagents: [],
      totalCount: 0,
      subagentCount: 0,
      note: `Connection error: ${message}`,
    });
  }
}

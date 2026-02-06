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
  // Subagent sessions have "subagent" in the key
  return session.key.includes("subagent");
}

function extractLabel(key: string): string {
  // Format: agent:coder:subagent:uuid or agent:main:subagent:uuid
  // Try to extract a label from the key
  const parts = key.split(":");
  
  // Check if there's a label suffix (e.g., agent:coder:subagent:uuid:my-label)
  if (parts.length > 4) {
    return parts.slice(4).join(":");
  }
  
  // Otherwise use the agent name + short uuid
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
  if (!OPENCLAW_GATEWAY_PASSWORD) {
    return NextResponse.json(
      { ok: false, sessions: [], subagents: [], error: "Gateway password not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/sessions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${OPENCLAW_GATEWAY_PASSWORD}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          ok: false,
          sessions: [],
          subagents: [],
          error: `Gateway returned ${response.status}: ${errorText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, sessions: [], subagents: [], error: message },
      { status: 500 }
    );
  }
}

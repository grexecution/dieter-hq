import { NextRequest } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

type SessionInfo = {
  agentId: string;
  key: string;
  kind: string;
  sessionId: string;
  updatedAt: number;
  age: number;
  systemSent?: boolean;
  abortedLastRun?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  remainingTokens?: number;
  percentUsed?: number;
  model?: string;
  contextTokens?: number;
  flags?: string[];
};

type OpenClawStatus = {
  heartbeat?: {
    defaultAgentId: string;
    agents: Array<{
      agentId: string;
      enabled: boolean;
      every: string;
      everyMs: number;
    }>;
  };
  channelSummary?: string[];
  queuedSystemEvents?: unknown[];
  sessions?: {
    paths: string[];
    count: number;
    defaults: {
      model: string;
      contextTokens: number;
    };
    recent: SessionInfo[];
  };
};

type StatusResponse = {
  ok: boolean;
  timestamp: number;
  gateway: {
    reachable: boolean;
    error?: string;
  };
  agent: {
    id: string;
    model: string;
    contextTokens: number;
  };
  sessions: {
    total: number;
    active: SessionInfo[];
    subagentCount: number;
  };
  currentTask: string | null;
  load: {
    activeSessions: number;
    recentActivity: boolean;
  };
  stuckDetection: {
    stuck: boolean;
    reason: string | null;
    staleSessions: string[];
  };
};

async function getOpenClawStatus(): Promise<OpenClawStatus | null> {
  try {
    const { stdout } = await execAsync("openclaw status --json", {
      timeout: 5000,
      env: { ...process.env, NO_COLOR: "1" },
    });
    return JSON.parse(stdout) as OpenClawStatus;
  } catch (err) {
    console.error("Failed to get OpenClaw status:", err);
    return null;
  }
}

function analyzeStatus(status: OpenClawStatus | null): StatusResponse {
  const now = Date.now();

  if (!status) {
    return {
      ok: false,
      timestamp: now,
      gateway: {
        reachable: false,
        error: "Cannot reach OpenClaw gateway",
      },
      agent: {
        id: "main",
        model: "unknown",
        contextTokens: 0,
      },
      sessions: {
        total: 0,
        active: [],
        subagentCount: 0,
      },
      currentTask: null,
      load: {
        activeSessions: 0,
        recentActivity: false,
      },
      stuckDetection: {
        stuck: false,
        reason: null,
        staleSessions: [],
      },
    };
  }

  const sessions = status.sessions?.recent || [];
  const defaults = status.sessions?.defaults || { model: "unknown", contextTokens: 200000 };

  // Filter active sessions (active in last 5 minutes)
  const activeSessions = sessions.filter((s) => s.age < 5 * 60 * 1000);

  // Count subagents
  const subagentCount = sessions.filter((s) => s.key.includes(":subagent:")).length;

  // Detect current task from most recent active session
  const mostRecent = sessions[0];
  let currentTask: string | null = null;
  if (mostRecent && mostRecent.age < 60000) {
    // Extract context from session key
    const keyParts = mostRecent.key.split(":");
    if (keyParts.includes("dieter-hq")) {
      const threadIdx = keyParts.indexOf("dieter-hq") + 1;
      currentTask = `DieterHQ: ${keyParts[threadIdx] || "main"} thread`;
    } else if (keyParts.includes("subagent")) {
      currentTask = "Running subagent task";
    } else if (mostRecent.key.includes("telegram")) {
      currentTask = "Telegram conversation";
    } else if (mostRecent.key === "agent:main:main") {
      currentTask = "Main session active";
    } else {
      currentTask = `Session: ${mostRecent.key}`;
    }
  }

  // Stuck detection: session active but no output in >30s, or aborted
  const staleSessions: string[] = [];
  let stuckReason: string | null = null;

  for (const s of activeSessions) {
    if (s.abortedLastRun) {
      staleSessions.push(s.key);
      stuckReason = stuckReason || "Session was aborted";
    }
    // If session was updated but produced no output tokens recently
    if (s.age < 30000 && s.outputTokens === 0 && s.inputTokens && s.inputTokens > 0) {
      staleSessions.push(s.key);
      stuckReason = stuckReason || "Session processing without output";
    }
  }

  return {
    ok: true,
    timestamp: now,
    gateway: {
      reachable: true,
    },
    agent: {
      id: status.heartbeat?.defaultAgentId || "main",
      model: defaults.model,
      contextTokens: defaults.contextTokens,
    },
    sessions: {
      total: status.sessions?.count || 0,
      active: activeSessions.slice(0, 5), // Top 5 active
      subagentCount,
    },
    currentTask,
    load: {
      activeSessions: activeSessions.length,
      recentActivity: activeSessions.length > 0,
    },
    stuckDetection: {
      stuck: staleSessions.length > 0,
      reason: stuckReason,
      staleSessions,
    },
  };
}

// GET: Single status snapshot
export async function GET(req: NextRequest) {
  const sse = req.nextUrl.searchParams.get("sse") === "1";

  if (!sse) {
    // Simple JSON response
    const status = await getOpenClawStatus();
    const response = analyzeStatus(status);
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // SSE streaming - poll every 500ms (not 50ms to avoid overload)
  const encoder = new TextEncoder();
  let stopped = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        if (stopped) return;
        try {
          const status = await getOpenClawStatus();
          const response = analyzeStatus(status);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
        } catch (err) {
          console.error("SSE status error:", err);
        }
      };

      // Initial send
      await sendUpdate();

      // Poll interval
      const interval = setInterval(sendUpdate, 500);

      // Cleanup after 5 minutes max to prevent resource leaks
      const timeout = setTimeout(() => {
        stopped = true;
        clearInterval(interval);
        controller.close();
      }, 5 * 60 * 1000);

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        stopped = true;
        clearInterval(interval);
        clearTimeout(timeout);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

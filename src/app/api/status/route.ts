import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || "http://127.0.0.1:18789";
const GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD;

type StatusResponse = {
  ok: boolean;
  timestamp: number;
  gateway: {
    reachable: boolean;
    url: string;
    error?: string;
    latencyMs?: number;
  };
  agent: {
    id: string;
    status: "online" | "offline" | "unknown";
  };
  lastCheck: number;
};

async function checkGateway(): Promise<{ reachable: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    // Simple ping via chat completions with minimal tokens
    const response = await fetch(`${GATEWAY_HTTP_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(GATEWAY_PASSWORD && { Authorization: `Bearer ${GATEWAY_PASSWORD}` }),
      },
      body: JSON.stringify({
        model: "openclaw:main",
        messages: [{ role: "user", content: "/status" }],
        max_tokens: 50,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return { reachable: true, latencyMs };
    } else {
      return { reachable: false, error: `HTTP ${response.status}`, latencyMs };
    }
  } catch (err) {
    const latencyMs = Date.now() - start;
    const error = err instanceof Error ? err.message : "Unknown error";
    return { reachable: false, error, latencyMs };
  }
}

function analyzeStatus(gatewayCheck: Awaited<ReturnType<typeof checkGateway>>): StatusResponse {
  const now = Date.now();

  return {
    ok: gatewayCheck.reachable,
    timestamp: now,
    gateway: {
      reachable: gatewayCheck.reachable,
      url: GATEWAY_HTTP_URL,
      latencyMs: gatewayCheck.latencyMs,
      error: gatewayCheck.error,
    },
    agent: {
      id: "main",
      status: gatewayCheck.reachable ? "online" : "offline",
    },
    lastCheck: now,
  };
}

// GET: Single status snapshot or SSE stream
export async function GET(req: NextRequest) {
  const sse = req.nextUrl.searchParams.get("sse") === "1";

  if (!sse) {
    // Simple JSON response
    const gatewayCheck = await checkGateway();
    const response = analyzeStatus(gatewayCheck);
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // SSE streaming - poll every 2s (not too aggressive)
  const encoder = new TextEncoder();
  let stopped = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        if (stopped) return;
        try {
          const gatewayCheck = await checkGateway();
          const response = analyzeStatus(gatewayCheck);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
        } catch (err) {
          console.error("SSE status error:", err);
        }
      };

      // Initial send
      await sendUpdate();

      // Poll interval (2 seconds)
      const interval = setInterval(sendUpdate, 2000);

      // Cleanup after 5 minutes max
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
      Connection: "keep-alive",
    },
  });
}

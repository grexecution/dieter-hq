import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENCLAW_GATEWAY_URL =
  process.env.OPENCLAW_GATEWAY_HTTP_URL ||
  process.env.OPENCLAW_GATEWAY_URL ||
  "https://mac-mini-von-dieter.tail954ecb.ts.net";
const OPENCLAW_GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD || "";

type RouteParams = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { sessionId } = await params;

  if (!OPENCLAW_GATEWAY_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "Gateway password not configured" },
      { status: 500 }
    );
  }

  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "Session ID required" },
      { status: 400 }
    );
  }

  // Decode the session ID (it may be URL-encoded due to colons)
  const decodedSessionId = decodeURIComponent(sessionId);

  try {
    // Try the DELETE /sessions/:id endpoint first
    const deleteResponse = await fetch(
      `${OPENCLAW_GATEWAY_URL}/sessions/${encodeURIComponent(decodedSessionId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${OPENCLAW_GATEWAY_PASSWORD}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (deleteResponse.ok) {
      return NextResponse.json({
        ok: true,
        message: `Session ${decodedSessionId} terminated`,
        sessionId: decodedSessionId,
      });
    }

    // If DELETE didn't work, try POST /sessions/:id/kill
    const killResponse = await fetch(
      `${OPENCLAW_GATEWAY_URL}/sessions/${encodeURIComponent(decodedSessionId)}/kill`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENCLAW_GATEWAY_PASSWORD}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (killResponse.ok) {
      return NextResponse.json({
        ok: true,
        message: `Session ${decodedSessionId} killed`,
        sessionId: decodedSessionId,
      });
    }

    // Both methods failed
    const errorText = await killResponse.text();
    return NextResponse.json(
      {
        ok: false,
        error: `Failed to terminate session: ${killResponse.status} - ${errorText}`,
        sessionId: decodedSessionId,
      },
      { status: killResponse.status }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message, sessionId: decodedSessionId },
      { status: 500 }
    );
  }
}

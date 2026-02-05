import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/chat/voice
 *
 * Receives audio blob, transcribes via OpenClaw whisper.
 * Returns: { transcript: string }
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!(audioFile instanceof File)) {
      return NextResponse.json(
        { error: "missing_audio", transcript: null },
        { status: 400 }
      );
    }

    // Get OpenClaw gateway URL from environment
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:3033";

    // Read audio as buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    // Call OpenClaw whisper transcription
    const response = await fetch(`${gatewayUrl}/api/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.OPENCLAW_API_KEY && {
          Authorization: `Bearer ${process.env.OPENCLAW_API_KEY}`,
        }),
      },
      body: JSON.stringify({
        audio: base64Audio,
        mimeType: audioFile.type || "audio/webm",
        language: "auto", // Auto-detect language
      }),
    });

    if (!response.ok) {
      // Fallback: Try direct whisper API if OpenClaw gateway fails
      console.error(
        "OpenClaw transcription failed:",
        response.status,
        await response.text()
      );
      return NextResponse.json(
        { error: "transcription_failed", transcript: null },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      transcript: data.text || data.transcript || "",
    });
  } catch (error) {
    console.error("Voice transcription error:", error);
    return NextResponse.json(
      { error: "server_error", transcript: null },
      { status: 500 }
    );
  }
}

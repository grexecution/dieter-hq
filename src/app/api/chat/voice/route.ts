import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/chat/voice
 *
 * Receives audio blob, transcribes via OpenClaw Gateway's local whisper-cpp.
 * Works on Vercel serverless - calls the Mac Mini's whisper HTTP server.
 *
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

    // Read audio as buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const mimeType = audioFile.type || "audio/webm";

    // Use Gateway transcription
    const { transcribeViaGateway } = await import("@/server/whisper/transcribe-gateway");
    const text = await transcribeViaGateway(audioBuffer, mimeType, { language: "de" });

    if (!text) {
      return NextResponse.json(
        { error: "transcription_failed", transcript: null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transcript: text,
    });
  } catch (error) {
    console.error("Voice transcription error:", error);
    return NextResponse.json(
      { error: "server_error", transcript: null },
      { status: 500 }
    );
  }
}

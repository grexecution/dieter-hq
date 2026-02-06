import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/chat/voice
 *
 * Receives audio blob, transcribes via OpenAI Whisper API.
 * Works on Vercel serverless - no local services needed.
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

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("OPENAI_API_KEY not set - cannot transcribe");
      return NextResponse.json(
        { error: "openai_key_missing", transcript: null },
        { status: 500 }
      );
    }

    // Read audio as buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const mimeType = audioFile.type || "audio/webm";

    // Determine file extension from mime type
    const extMap: Record<string, string> = {
      "audio/webm": "webm",
      "audio/mp3": "mp3",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "audio/ogg": "ogg",
      "audio/m4a": "m4a",
      "audio/mp4": "m4a",
    };
    const ext = extMap[mimeType] ?? "webm";
    const filename = `audio.${ext}`;

    // Build multipart form data for OpenAI
    const openaiForm = new FormData();
    const uint8Array = new Uint8Array(audioBuffer);
    openaiForm.append("file", new Blob([uint8Array], { type: mimeType }), filename);
    openaiForm.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: openaiForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Whisper API error:", response.status, errorText);
      return NextResponse.json(
        { error: "transcription_failed", transcript: null },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      transcript: data.text || "",
    });
  } catch (error) {
    console.error("Voice transcription error:", error);
    return NextResponse.json(
      { error: "server_error", transcript: null },
      { status: 500 }
    );
  }
}

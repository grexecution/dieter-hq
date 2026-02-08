import { NextResponse } from "next/server";

import { db } from "@/server/db";
import { messages } from "@/server/db/schema";
import { logEvent } from "@/server/events/log";

export const runtime = "nodejs";

/**
 * Background transcription - fire and forget
 * Transcribes audio and updates the message in DB when complete.
 */
async function transcribeInBackground(
  messageId: string,
  threadId: string,
  audioBuffer: Buffer,
  mimeType: string,
): Promise<void> {
  console.log(`[Voice] 🎙️ Starting background transcription for ${messageId}, size: ${audioBuffer.length} bytes`);
  try {
    const { transcribeViaGateway } = await import("@/server/whisper/transcribe-gateway");
    console.log(`[Voice] 🎙️ Calling transcribeViaGateway...`);
    const text = await transcribeViaGateway(audioBuffer, mimeType, { language: "de" });
    console.log(`[Voice] 🎙️ Transcription result: ${text ? text.slice(0, 50) : 'null'}`);
    
    if (text) {
      // Update the message with transcription
      const { eq } = await import("drizzle-orm");
      await db
        .update(messages)
        .set({ transcription: text, content: text })
        .where(eq(messages.id, messageId));

      await logEvent({
        threadId,
        type: "voice.transcribed",
        payload: { messageId, ok: true, text: text.slice(0, 100) },
      });
      
      console.log(`[Voice] Background transcription complete for ${messageId}: "${text.slice(0, 50)}..."`);
    }
  } catch (err) {
    console.error("[Voice] Background transcription failed:", err);
    await logEvent({
      threadId,
      type: "voice.transcribed",
      payload: { messageId, ok: false },
    });
  }
}

/**
 * POST /api/chat/voice-message
 *
 * Receives audio blob, stores it as base64 data URL, creates voice message in DB.
 * Returns IMMEDIATELY with audioUrl for instant playback.
 * Triggers transcription in background (non-blocking).
 *
 * Works on Vercel serverless - calls Gateway's whisper HTTP server.
 *
 * Body: FormData with:
 * - audio: File (audio blob)
 * - threadId: string
 * - durationMs: string (duration in milliseconds)
 *
 * Returns: { ok: boolean, message: MessageRow }
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const threadId = String(formData.get("threadId") ?? "").trim();
    const durationMs = parseInt(String(formData.get("durationMs") ?? "0"), 10);

    if (!threadId) {
      return NextResponse.json({ error: "missing_threadId" }, { status: 400 });
    }

    if (!(audioFile instanceof File)) {
      return NextResponse.json(
        { error: "missing_audio" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date();

    // Store audio as base64 data URL (works on Vercel serverless)
    const buf = Buffer.from(await audioFile.arrayBuffer());
    const base64 = buf.toString("base64");
    const mimeType = audioFile.type || "audio/webm";
    const audioUrl = `data:${mimeType};base64,${base64}`;

    // Insert message immediately (no transcription yet)
    await db.insert(messages).values({
      id,
      threadId,
      role: "user",
      content: "🎤 Voice message",
      audioUrl,
      audioDurationMs: durationMs || null,
      transcription: null,
      createdAt: now,
    });

    await logEvent({
      threadId,
      type: "voice.message",
      payload: { id, durationMs },
    });

    // Build response message object IMMEDIATELY (without transcription)
    const message = {
      id,
      threadId,
      role: "user" as const,
      content: "🎤 Voice message",
      audioUrl,
      audioDurationMs: durationMs || 0,
      transcription: null,
      createdAt: now.getTime(),
      createdAtLabel: now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Fire-and-forget: Start background transcription
    // This runs after the response is sent
    transcribeInBackground(id, threadId, buf, mimeType).catch((err) => {
      console.error("[Voice] Background transcription error:", err);
    });

    // Return immediately - user sees playable audio right away!
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error("Voice message error:", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}

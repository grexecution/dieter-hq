import { NextResponse } from "next/server";

import { db } from "@/server/db";
import { messages } from "@/server/db/schema";
import { logEvent } from "@/server/events/log";

export const runtime = "nodejs";

/**
 * POST /api/chat/voice-message
 *
 * Receives audio blob, stores it as base64 data URL, creates voice message in DB.
 * Triggers transcription via OpenClaw Gateway's local whisper-cpp.
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

    // Synchronous transcription via OpenClaw Gateway's local whisper-cpp
    let transcription: string | null = null;
    try {
      const { transcribeViaGateway } = await import("@/server/whisper/transcribe-gateway");
      const text = await transcribeViaGateway(buf, mimeType, { language: "de" });
      if (text) {
        transcription = text;
        
        // Update the message with transcription
        const { eq } = await import("drizzle-orm");
        await db
          .update(messages)
          .set({ transcription: text, content: text })
          .where(eq(messages.id, id));

        await logEvent({
          threadId,
          type: "voice.transcribed",
          payload: { messageId: id, ok: true },
        });
      }
    } catch (err) {
      console.error("Voice transcription failed:", err);
      await logEvent({
        threadId,
        type: "voice.transcribed",
        payload: { messageId: id, ok: false },
      });
    }

    // Build response message object
    const message = {
      id,
      threadId,
      role: "user" as const,
      content: transcription || "🎤 Voice message",
      audioUrl,
      audioDurationMs: durationMs || 0,
      transcription,
      createdAt: now.getTime(),
      createdAtLabel: now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error("Voice message error:", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}

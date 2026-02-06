import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

import { db } from "@/server/db";
import { messages } from "@/server/db/schema";
import { logEvent } from "@/server/events/log";
import { artefactRelPath, artefactsBaseDir, ensureDirForFile } from "@/server/artefacts/storage";

export const runtime = "nodejs";

/**
 * POST /api/chat/voice-message
 *
 * Receives audio blob, stores it, creates voice message in DB.
 * Triggers async transcription.
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

    // Store audio file
    const ext = "webm";
    const rel = artefactRelPath({ date: now, id, ext });
    const abs = path.join(artefactsBaseDir(), rel);
    await ensureDirForFile(abs);

    const buf = Buffer.from(await audioFile.arrayBuffer());
    await fs.writeFile(abs, buf);

    // Create message with audio URL
    const audioUrl = `/api/artefacts/audio/${encodeURIComponent(id)}.${ext}`;

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
      payload: { id, durationMs, audioUrl },
    });

    // Fire-and-forget transcription
    void (async () => {
      try {
        const { transcribeLocalWhisper } = await import("@/server/whisper/transcribe");
        const text = await transcribeLocalWhisper(abs, { language: "auto" });
        if (!text) return;

        // Update the message with transcription
        const { eq } = await import("drizzle-orm");
        await db
          .update(messages)
          .set({ transcription: text })
          .where(eq(messages.id, id));

        await logEvent({
          threadId,
          type: "voice.transcribed",
          payload: { messageId: id, ok: true },
        });
      } catch (err) {
        console.error("Voice transcription failed:", err);
        await logEvent({
          threadId,
          type: "voice.transcribed",
          payload: { messageId: id, ok: false },
        });
      }
    })();

    // Build response message object
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

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error("Voice message error:", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}

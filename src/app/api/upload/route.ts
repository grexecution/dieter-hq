import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

import { db } from "@/server/db";
import { artefacts, messages } from "@/server/db/schema";
import { logEvent } from "@/server/events/log";
import { artefactRelPath, artefactsBaseDir, ensureDirForFile } from "@/server/artefacts/storage";

export const runtime = "nodejs";

function guessExt(mime: string, fallbackName?: string): string {
  const byMime: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/webm": "webm",
    "video/webm": "webm",
    "application/pdf": "pdf",
  };
  if (byMime[mime]) return byMime[mime];
  const ext = fallbackName?.split(".").pop();
  if (ext && ext.length <= 6) return ext.toLowerCase();
  return "bin";
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  const threadId = String(form.get("threadId") ?? "").trim();

  if (!threadId) {
    return NextResponse.json({ error: "missing_threadId" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const originalName = file.name || "upload";
  const mimeType = file.type || "application/octet-stream";
  const sizeBytes = file.size;

  const ext = guessExt(mimeType, originalName);
  const rel = artefactRelPath({ date: now, id, ext });
  const abs = path.join(artefactsBaseDir(), rel);
  await ensureDirForFile(abs);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(abs, buf);

  await db.insert(artefacts).values({
    id,
    threadId,
    originalName,
    mimeType,
    sizeBytes,
    storagePath: rel,
    createdAt: now,
  });

  // Create a message referencing the artefact
  const url = `/api/artefacts/${encodeURIComponent(id)}`;
  const messageId = crypto.randomUUID();
  await db.insert(messages).values({
    id: messageId,
    threadId,
    role: "user",
    content: `📎 ${originalName}\n${url}`,
    createdAt: now,
  });

  await logEvent({
    threadId,
    type: "artefact.upload",
    payload: { id, originalName, mimeType, sizeBytes },
  });

  const isAudio = mimeType.startsWith("audio/") || mimeType === "video/webm";
  if (isAudio) {
    // Fire-and-forget transcription. In production, consider moving this to
    // a durable background job.
    void (async () => {
      try {
        const { transcribeLocalWhisper } = await import("@/server/whisper/transcribe");
        const text = await transcribeLocalWhisper(abs, { language: "de" });
        if (!text) return;

        await db.insert(messages).values({
          id: crypto.randomUUID(),
          threadId,
          role: "system",
          content: `🎙 Transcription (${originalName})\n${text}`,
          createdAt: new Date(),
        });

        await logEvent({
          threadId,
          type: "audio.transcribe",
          payload: { artefactId: id, ok: true },
        });
      } catch {
        await logEvent({
          threadId,
          type: "audio.transcribe",
          payload: { artefactId: id, ok: false },
        });
      }
    })();
  }

  return NextResponse.json({ ok: true, artefactId: id, messageId, url });
}

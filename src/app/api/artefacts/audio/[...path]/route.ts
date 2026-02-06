import path from "node:path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";

import { artefactsBaseDir } from "@/server/artefacts/storage";

export const runtime = "nodejs";

/**
 * GET /api/artefacts/audio/[...path]
 *
 * Serves audio files for voice messages.
 * Path format: {id}.{ext} (e.g., abc123.webm)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;
  const filename = pathParts.join("/");

  // Extract ID from filename (e.g., "abc123.webm" -> "abc123")
  const match = filename.match(/^([a-f0-9-]+)\.(\w+)$/i);
  if (!match) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  const [, id, ext] = match;

  // Find the file in artefacts directory
  // Files are stored in YYYY-MM/id.ext format
  const baseDir = artefactsBaseDir();

  // Scan for the file (we don't know the exact date folder)
  try {
    const folders = await fs.readdir(baseDir);

    for (const folder of folders) {
      const filePath = path.join(baseDir, folder, `${id}.${ext}`);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          const buf = await fs.readFile(filePath);

          const mimeTypes: Record<string, string> = {
            webm: "audio/webm",
            mp3: "audio/mpeg",
            wav: "audio/wav",
            ogg: "audio/ogg",
            m4a: "audio/mp4",
          };

          return new NextResponse(buf, {
            headers: {
              "Content-Type": mimeTypes[ext] || "audio/webm",
              "Content-Length": String(buf.byteLength),
              "Accept-Ranges": "bytes",
              "Cache-Control": "private, max-age=31536000, immutable",
            },
          });
        }
      } catch {
        // File not in this folder, continue
      }
    }

    return NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

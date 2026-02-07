import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

// Security: Only allow access to certain directories
const ALLOWED_PREFIXES = [
  "/tmp/",
  "/var/folders/",
  process.env.HOME ? `${process.env.HOME}/.openclaw/` : null,
].filter(Boolean) as string[];

function isPathAllowed(filePath: string): boolean {
  const normalized = path.resolve(filePath);
  return ALLOWED_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let filePath = searchParams.get("path");
  
  if (!filePath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }
  
  // Expand ~ to home directory
  if (filePath.startsWith("~/")) {
    filePath = path.join(process.env.HOME || "", filePath.slice(2));
  }
  
  // Normalize path
  filePath = path.resolve(filePath);
  
  // Security check
  if (!isPathAllowed(filePath)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }
    
    const data = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);
    
    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    console.error("Media route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

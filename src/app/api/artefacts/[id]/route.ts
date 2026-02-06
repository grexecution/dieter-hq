import path from "node:path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";

import { db } from "@/server/db";
import { artefacts } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { artefactsBaseDir } from "@/server/artefacts/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const row = await db
    .select()
    .from(artefacts)
    .where(eq(artefacts.id, id))
    .limit(1);

  const a = row[0];
  if (!a) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let buf: Buffer;

  // Try dataBase64 first (Vercel-compatible)
  if (a.dataBase64) {
    buf = Buffer.from(a.dataBase64, "base64");
  } 
  // Fallback to file storage (local dev)
  else if (a.storagePath) {
    const abs = path.join(artefactsBaseDir(), a.storagePath);
    buf = await fs.readFile(abs);
  } 
  else {
    return NextResponse.json({ error: "no_data" }, { status: 404 });
  }

  return new NextResponse(buf, {
    headers: {
      "Content-Type": a.mimeType,
      "Content-Length": String(buf.byteLength),
      "Content-Disposition": `inline; filename="${encodeURIComponent(a.originalName)}"`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

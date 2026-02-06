import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { artefacts } from "@/server/db/schema";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

// Accept base64 encoded images
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, name, type, threadId } = body;
    
    if (!data) {
      return NextResponse.json({ error: "Missing data field" }, { status: 400 });
    }
    
    // Handle data: URL format or raw base64
    const base64Data = data.startsWith("data:") 
      ? data.split(",")[1] 
      : data;
    
    const buffer = Buffer.from(base64Data, "base64");
    const filename = name || `screenshot-${Date.now()}.png`;
    const mimeType = type || "image/png";
    
    // Generate unique ID
    const id = uuidv4();
    
    // Save to database with base64 data (Vercel-compatible)
    await db.insert(artefacts).values({
      id,
      threadId: threadId || null,
      originalName: filename,
      mimeType,
      sizeBytes: buffer.length,
      storagePath: null,
      dataBase64: base64Data,
      createdAt: new Date(),
    });
    
    const artefactUrl = `/api/artefacts/${id}`;
    
    return NextResponse.json({
      success: true,
      id,
      url: artefactUrl,
      name: filename,
      size: buffer.length,
    });
    
  } catch (error) {
    console.error("Error uploading artefact:", error);
    return NextResponse.json(
      { error: "Failed to upload artefact", details: String(error) },
      { status: 500 }
    );
  }
}

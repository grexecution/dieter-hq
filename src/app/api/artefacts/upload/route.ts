import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { artefacts } from "@/server/db/schema";
import { v4 as uuidv4 } from "uuid";
import { artefactsBaseDir } from "@/server/artefacts/storage";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

// Accept base64 encoded images or form data uploads
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    let buffer: Buffer;
    let filename: string;
    let mimeType: string;
    
    if (contentType.includes("application/json")) {
      // JSON body with base64 data
      const body = await request.json();
      const { data, name, type } = body;
      
      if (!data) {
        return NextResponse.json({ error: "Missing data field" }, { status: 400 });
      }
      
      // Handle data: URL format or raw base64
      const base64Data = data.startsWith("data:") 
        ? data.split(",")[1] 
        : data;
      
      buffer = Buffer.from(base64Data, "base64");
      filename = name || `screenshot-${Date.now()}.png`;
      mimeType = type || "image/png";
      
    } else if (contentType.includes("multipart/form-data")) {
      // Form data upload
      const formData = await request.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }
      
      buffer = Buffer.from(await file.arrayBuffer());
      filename = file.name;
      mimeType = file.type;
      
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }
    
    // Generate unique ID and storage path
    const id = uuidv4();
    const ext = path.extname(filename) || ".png";
    const storagePath = `screenshots/${id}${ext}`;
    const fullPath = path.join(artefactsBaseDir(), storagePath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, buffer);
    
    // Save to database
    await db.insert(artefacts).values({
      id,
      originalName: filename,
      storagePath,
      mimeType,
      size: buffer.length,
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
      { error: "Failed to upload artefact" },
      { status: 500 }
    );
  }
}

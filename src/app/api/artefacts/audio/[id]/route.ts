import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { artefactsBaseDir } from '@/server/artefacts/storage';

export const runtime = 'nodejs';

/**
 * GET /api/artefacts/audio/:id.webm
 * 
 * Serves voice message audio files from the artefacts directory.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Parse ID and extension (format: {uuid}.webm)
  const match = id.match(/^([a-f0-9-]+)\.(\w+)$/i);
  if (!match) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }
  
  const [, uuid, ext] = match;
  
  // Search for the file in the artefacts directory
  const baseDir = artefactsBaseDir();
  
  // Voice messages are stored with date-based paths like: 2026/02/06/{uuid}.webm
  // We need to search for the file
  const today = new Date();
  const possiblePaths = [];
  
  // Try last 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    possiblePaths.push(path.join(baseDir, String(year), month, day, `${uuid}.${ext}`));
  }
  
  let foundPath: string | null = null;
  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      foundPath = p;
      break;
    } catch {
      // File not found at this path, continue
    }
  }
  
  if (!foundPath) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  
  try {
    const data = await fs.readFile(foundPath);
    
    const mimeTypes: Record<string, string> = {
      webm: 'audio/webm',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
    };
    
    const contentType = mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
    
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Error serving audio:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

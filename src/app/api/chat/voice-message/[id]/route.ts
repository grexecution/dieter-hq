import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { messages } from "@/server/db/schema";

export const runtime = "nodejs";

/**
 * GET /api/chat/voice-message/[id]
 *
 * Returns transcription status for a voice message.
 * Used by client to poll for background transcription completion.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    const [msg] = await db
      .select({
        id: messages.id,
        transcription: messages.transcription,
      })
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);

    if (!msg) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      id: msg.id,
      transcription: msg.transcription,
      pending: msg.transcription === null,
    });
  } catch (error) {
    console.error("Voice message status error:", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}

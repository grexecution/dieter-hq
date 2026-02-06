import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/chat/reset
 * 
 * Deletes all messages for a given threadId.
 */
export async function POST(request: NextRequest) {
  try {
    const { threadId } = await request.json();

    if (!threadId || typeof threadId !== 'string') {
      return NextResponse.json({ error: 'threadId required' }, { status: 400 });
    }

    // Delete all messages for this thread
    await db.delete(messages).where(eq(messages.threadId, threadId));

    return NextResponse.json({ ok: true, threadId });
  } catch (error) {
    console.error('Error resetting chat:', error);
    return NextResponse.json({ error: 'Failed to reset chat' }, { status: 500 });
  }
}

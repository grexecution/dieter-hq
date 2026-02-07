import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { chatQueue } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

// GET: Fetch pending chat queue items for processing
export async function GET(request: NextRequest) {
  // Simple auth check - same as inbox pending-replies
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET || process.env.OPENCLAW_GATEWAY_PASSWORD;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const pending = await db
      .select()
      .from(chatQueue)
      .where(eq(chatQueue.status, 'pending'))
      .limit(10);

    return NextResponse.json({
      items: pending.map(item => ({
        id: item.id,
        threadId: item.threadId,
        userMessage: item.userMessage,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Queue Pending] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending items' }, { status: 500 });
  }
}

// POST: Mark item as processing/done/error
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET || process.env.OPENCLAW_GATEWAY_PASSWORD;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, assistantMessage } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    if (!['processing', 'done', 'error'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    
    if (status === 'done' || status === 'error') {
      updateData.processedAt = new Date();
      if (assistantMessage) {
        updateData.assistantMessage = assistantMessage;
      }
    }

    await db
      .update(chatQueue)
      .set(updateData)
      .where(eq(chatQueue.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Queue Pending] Update error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

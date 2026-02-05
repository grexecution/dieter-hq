import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages, chatQueue } from '@/server/db/schema';
import { eq, asc, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { message, threadId = 'main' } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const now = new Date();
    const userMessageId = crypto.randomUUID();
    const queueId = crypto.randomUUID();

    // Save user message to DB
    await db.insert(messages).values({
      id: userMessageId,
      threadId,
      role: 'user',
      content: message,
      createdAt: now,
    });

    // Add to chat queue for OpenClaw to process
    await db.insert(chatQueue).values({
      id: queueId,
      threadId,
      userMessage: message,
      status: 'pending',
      createdAt: now,
    });

    return NextResponse.json({
      ok: true,
      queueId,
      userMessage: {
        id: userMessageId,
        role: 'user',
        content: message,
      },
      status: 'queued',
      message: 'Message queued for processing',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch messages + check queue status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId') || 'main';
  const queueId = searchParams.get('queueId');

  try {
    // If queueId provided, check specific queue item status
    if (queueId) {
      const queueItem = await db
        .select()
        .from(chatQueue)
        .where(eq(chatQueue.id, queueId))
        .limit(1);

      if (queueItem.length > 0) {
        const item = queueItem[0];
        return NextResponse.json({
          queueId: item.id,
          status: item.status,
          assistantMessage: item.assistantMessage,
          processedAt: item.processedAt,
        });
      }
    }

    // Get all messages for thread
    const threadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(asc(messages.createdAt));

    // Get pending queue items
    const pendingQueue = await db
      .select()
      .from(chatQueue)
      .where(and(
        eq(chatQueue.threadId, threadId),
        eq(chatQueue.status, 'pending')
      ));

    return NextResponse.json({ 
      messages: threadMessages,
      pendingCount: pendingQueue.length,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

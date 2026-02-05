import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { chatQueue, messages } from '@/server/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

// Poll for completed responses
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId') || 'main';
  const lastQueueId = searchParams.get('lastQueueId');

  try {
    // Get recently completed queue items
    const completed = await db
      .select()
      .from(chatQueue)
      .where(and(
        eq(chatQueue.threadId, threadId),
        or(
          eq(chatQueue.status, 'done'),
          eq(chatQueue.status, 'error')
        )
      ))
      .orderBy(desc(chatQueue.processedAt))
      .limit(10);

    // Get pending count
    const pending = await db
      .select()
      .from(chatQueue)
      .where(and(
        eq(chatQueue.threadId, threadId),
        eq(chatQueue.status, 'pending')
      ));

    // If there are completed items, also add them to messages table if not already
    for (const item of completed) {
      if (item.assistantMessage && item.status === 'done') {
        // Check if message already exists
        const existing = await db
          .select()
          .from(messages)
          .where(eq(messages.id, `response-${item.id}`))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(messages).values({
            id: `response-${item.id}`,
            threadId: item.threadId,
            role: 'assistant',
            content: item.assistantMessage,
            createdAt: item.processedAt || new Date(),
          });
        }
      }
    }

    return NextResponse.json({
      completed: completed.map(item => ({
        queueId: item.id,
        status: item.status,
        userMessage: item.userMessage,
        assistantMessage: item.assistantMessage,
        processedAt: item.processedAt,
      })),
      pendingCount: pending.length,
    });
  } catch (error) {
    console.error('Poll error:', error);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}

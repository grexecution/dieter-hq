import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notifyAgentResponse } from '@/lib/push';

const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || 'http://127.0.0.1:18789';
const GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { message, threadId = 'main' } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Save user message to DB
    const userMessageId = crypto.randomUUID();
    await db.insert(messages).values({
      id: userMessageId,
      threadId,
      role: 'user',
      content: message,
      createdAt: new Date(),
    });

    // Call OpenClaw gateway via OpenAI-compatible endpoint (instant!)
    let assistantContent = '';
    
    try {
      const response = await fetch(`${GATEWAY_HTTP_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use Bearer auth, not Basic!
          ...(GATEWAY_PASSWORD && { 'Authorization': `Bearer ${GATEWAY_PASSWORD}` }),
          'x-openclaw-agent-id': 'main',
          'x-openclaw-session-key': `agent:main:dieter-hq:${threadId}`,
          'x-openclaw-source': 'dieter-hq',
        },
        body: JSON.stringify({
          model: 'openclaw:main',
          messages: [
            { role: 'user', content: message }
          ],
          user: `dieter-hq:${threadId}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        assistantContent = data.choices?.[0]?.message?.content || 'No response from agent';
      } else {
        const errorText = await response.text();
        console.error('Gateway error:', response.status, errorText);
        assistantContent = `⚠️ Gateway error (${response.status}). Check Tailscale Funnel.`;
      }
    } catch (gatewayError) {
      console.error('Gateway connection error:', gatewayError);
      assistantContent = '⚠️ Cannot reach OpenClaw gateway.';
    }

    // Save assistant response to DB
    const assistantMessageId = crypto.randomUUID();
    await db.insert(messages).values({
      id: assistantMessageId,
      threadId,
      role: 'assistant',
      content: assistantContent,
      createdAt: new Date(),
    });

    // Send push notification (fire and forget)
    notifyAgentResponse(assistantContent).catch((err) => {
      console.error('[Chat] Push notification failed:', err);
    });

    return NextResponse.json({
      ok: true,
      userMessage: {
        id: userMessageId,
        role: 'user',
        content: message,
      },
      assistantMessage: {
        id: assistantMessageId,
        role: 'assistant',
        content: assistantContent,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId') || 'main';

  try {
    const threadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({ messages: threadMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/server/db/schema';
import { eq, asc } from 'drizzle-orm';

const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

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

    // Call OpenClaw gateway
    let assistantContent = '';
    
    try {
      // Try the openclaw CLI agent command via HTTP
      const response = await fetch(`${GATEWAY_HTTP_URL}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(GATEWAY_TOKEN && { 'Authorization': `Bearer ${GATEWAY_TOKEN}` }),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: crypto.randomUUID(),
          method: 'agent.chat',
          params: {
            message,
            sessionKey: `agent:main:dieter-hq:${threadId}`,
            options: {
              channel: 'dieter-hq',
            },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        assistantContent = data.result?.content || data.result?.reply || 'No response from agent';
      } else {
        // Gateway might not be reachable - fall back to error message
        assistantContent = `⚠️ OpenClaw gateway not reachable (${response.status}). Make sure the tunnel is running.`;
      }
    } catch (gatewayError) {
      console.error('Gateway connection error:', gatewayError);
      assistantContent = '⚠️ Cannot connect to OpenClaw gateway. Please ensure:\n1. Gateway is running (`openclaw gateway status`)\n2. Tunnel is active (Cloudflare/Tailscale)\n3. OPENCLAW_GATEWAY_HTTP_URL is set correctly';
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

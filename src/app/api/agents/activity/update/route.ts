import { NextRequest, NextResponse } from 'next/server';
import { agentActivityCache, AgentSession } from '@/lib/agent-activity-cache';

/**
 * POST /api/agents/activity/update
 * Receives activity data from OpenClaw cron job and stores in cache
 * 
 * Expected payload from cron:
 * {
 *   sessions: [
 *     { key, updatedAt, model, totalTokens, contextTokens, abortedLastRun, label?, lastMessage? }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different payload formats from OpenClaw
    let sessions: AgentSession[] = [];
    
    if (Array.isArray(body)) {
      sessions = body;
    } else if (body.sessions && Array.isArray(body.sessions)) {
      sessions = body.sessions;
    } else if (body.data && Array.isArray(body.data)) {
      sessions = body.data;
    }

    // Normalize sessions - handle any input format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedSessions: AgentSession[] = sessions.map((s: any) => ({
      key: s.key || s.sessionKey || '',
      label: s.label,
      channel: s.channel,
      updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : new Date(s.updatedAt).getTime(),
      model: s.model,
      totalTokens: s.totalTokens,
      contextTokens: s.contextTokens,
      abortedLastRun: s.abortedLastRun,
      lastMessage: s.lastMessage || extractLastMessage(s),
    }));

    // Store in cache
    agentActivityCache.set({
      sessions: normalizedSessions,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      cached: true,
      sessionCount: normalizedSessions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[agents/activity/update] Error:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: 'Failed to update activity cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Extract last message from session data if available
 */
function extractLastMessage(session: Record<string, unknown>): string | undefined {
  if (session.messages && Array.isArray(session.messages) && session.messages.length > 0) {
    const lastMsg = session.messages[0];
    if (typeof lastMsg === 'object' && lastMsg !== null) {
      const msg = lastMsg as Record<string, unknown>;
      if (msg.content) {
        if (typeof msg.content === 'string') {
          return msg.content.slice(0, 100);
        }
        if (Array.isArray(msg.content)) {
          const textPart = msg.content.find((p: unknown) => 
            typeof p === 'object' && p !== null && (p as Record<string, unknown>).type === 'text'
          ) as Record<string, unknown> | undefined;
          if (textPart?.text && typeof textPart.text === 'string') {
            return textPart.text.slice(0, 100);
          }
        }
      }
    }
  }
  return undefined;
}

// Health check / cache stats
export async function GET() {
  const stats = agentActivityCache.getStats();
  
  return NextResponse.json({
    ok: true,
    cache: stats,
  });
}

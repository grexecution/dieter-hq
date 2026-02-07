import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAll, getLastPushError } from '@/lib/push';

// Simple API key auth for external requests (OpenClaw)
// Internal requests (same origin) don't need auth
const API_KEY = process.env.PUSH_API_KEY || process.env.OPENCLAW_GATEWAY_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    // Check auth - skip for same-origin requests (from frontend)
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const isSameOrigin = origin?.includes('dieter-hq') || referer?.includes('dieter-hq');
    
    if (!isSameOrigin) {
      const authHeader = request.headers.get('authorization');
      const providedKey = authHeader?.replace('Bearer ', '');
      
      if (API_KEY && providedKey !== API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { title, body: messageBody, tag, url } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'title and body are required' },
        { status: 400 }
      );
    }

    const result = await sendPushToAll({
      title,
      body: messageBody,
      tag: tag || 'dieter-hq',
      data: url ? { url } : undefined,
    });

    const lastError = result.failed > 0 ? getLastPushError() : null;
    
    return NextResponse.json({
      ok: true,
      sent: result.sent,
      failed: result.failed,
      lastError: lastError ? {
        statusCode: lastError.statusCode,
        message: lastError.message,
      } : undefined,
    });
  } catch (error) {
    console.error('[Push Send] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}

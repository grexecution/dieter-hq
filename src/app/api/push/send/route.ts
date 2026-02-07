import { NextRequest, NextResponse } from 'next/server';
import { sendPushToAll } from '@/lib/push';

// Simple API key auth for OpenClaw
const API_KEY = process.env.PUSH_API_KEY || process.env.OPENCLAW_GATEWAY_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const authHeader = request.headers.get('authorization');
    const providedKey = authHeader?.replace('Bearer ', '');
    
    if (API_KEY && providedKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error('[Push Send] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}

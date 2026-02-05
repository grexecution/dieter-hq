import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics endpoint for Long Tasks
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Log long task
    console.warn('[Analytics] Long Task Detected:', {
      duration: data.duration,
      startTime: data.startTime,
      timestamp: new Date(data.timestamp).toISOString(),
    });

    // TODO: Send to analytics service or alerting system

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Failed to process long task:', error);
    return NextResponse.json(
      { error: 'Failed to process task' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

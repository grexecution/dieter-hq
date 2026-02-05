import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics endpoint for Navigation Timing
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Log navigation timing
    console.log('[Analytics] Navigation Timing:', {
      metrics: data.metrics,
      timestamp: new Date(data.timestamp).toISOString(),
    });

    // TODO: Send to analytics service

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Failed to process navigation timing:', error);
    return NextResponse.json(
      { error: 'Failed to process timing' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

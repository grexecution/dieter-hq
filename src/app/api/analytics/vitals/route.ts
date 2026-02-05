import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics endpoint for Web Vitals
 * Receives and logs performance metrics from the client
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Log to console (in production, send to analytics service)
    console.log('[Analytics] Web Vital:', {
      metric: data.metric,
      value: data.value,
      rating: data.rating,
      url: data.url,
      timestamp: new Date(data.timestamp).toISOString(),
    });

    // TODO: Send to analytics service (e.g., Google Analytics, Plausible, etc.)
    // Example:
    // await sendToAnalytics({
    //   event: 'web_vital',
    //   metric_name: data.metric,
    //   value: data.value,
    //   rating: data.rating,
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Failed to process web vital:', error);
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

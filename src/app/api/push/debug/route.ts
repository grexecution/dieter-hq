import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { pushSubscriptions } from '@/server/db/schema';

export async function GET() {
  try {
    const subscriptions = await db.select().from(pushSubscriptions);
    
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
    const VAPID_SUBJECT = process.env.VAPID_SUBJECT;
    
    return NextResponse.json({
      ok: true,
      config: {
        vapidPublicConfigured: !!VAPID_PUBLIC_KEY,
        vapidPrivateConfigured: !!VAPID_PRIVATE_KEY,
        vapidSubject: VAPID_SUBJECT || 'NOT SET',
        vapidPublicPreview: VAPID_PUBLIC_KEY?.slice(0, 20) + '...',
      },
      subscriptions: {
        count: subscriptions.length,
        items: subscriptions.map(s => ({
          id: s.id,
          endpointPreview: s.endpoint.slice(0, 60) + '...',
          createdAt: s.createdAt,
          userId: s.userId,
        })),
      },
    });
  } catch (error) {
    console.error('[Push Debug] Error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

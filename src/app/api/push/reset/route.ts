import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { pushSubscriptions } from '@/server/db/schema';

export async function POST(request: NextRequest) {
  try {
    // Delete all push subscriptions (they may have been created with wrong VAPID keys)
    const deleted = await db.delete(pushSubscriptions).returning();
    
    return NextResponse.json({
      ok: true,
      deleted: deleted.length,
      message: 'All push subscriptions cleared. Please re-subscribe.',
    });
  } catch (error) {
    console.error('[Push Reset] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset push subscriptions' },
      { status: 500 }
    );
  }
}

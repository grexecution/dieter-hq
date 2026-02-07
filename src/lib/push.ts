import webpush from 'web-push';
import { db } from '@/server/db';
import { pushSubscriptions } from '@/server/db/schema';

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@dieter-hq.local';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Store last error for debugging
let lastPushError: { statusCode?: number; message: string; subscriptionId: string } | null = null;

export function getLastPushError() {
  return lastPushError;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

/**
 * Send push notification to all subscribed clients
 */
export async function sendPushToAll(payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured, skipping push notification');
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await db.select().from(pushSubscriptions);
  
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (error: unknown) {
      const err = error as { statusCode?: number; body?: string; message?: string };
      const statusCode = err?.statusCode;
      const errorMessage = err?.body || err?.message || String(error);
      console.error('[Push] Failed to send to subscription:', sub.id, 'Status:', statusCode, 'Error:', errorMessage);
      
      // Store last error for debugging
      lastPushError = { statusCode, message: errorMessage, subscriptionId: sub.id };
      
      // Remove invalid subscriptions (410 Gone, 404 Not Found, or 401/403 JWT errors)
      if (statusCode === 410 || statusCode === 404 || statusCode === 401 || statusCode === 403) {
        try {
          const { eq } = await import('drizzle-orm');
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          console.log('[Push] Removed invalid subscription:', sub.id);
        } catch (deleteError) {
          console.error('[Push] Failed to remove subscription:', deleteError);
        }
      }
      failed++;
    }
  }

  console.log(`[Push] Sent ${sent}, failed ${failed}`);
  return { sent, failed };
}

/**
 * Send notification for new agent message
 */
export async function notifyAgentResponse(messagePreview: string): Promise<void> {
  const preview = messagePreview.length > 100 
    ? messagePreview.substring(0, 100) + '...' 
    : messagePreview;

  await sendPushToAll({
    title: 'Dieter HQ',
    body: preview,
    tag: 'agent-response',
    data: { url: '/chat' },
  });
}

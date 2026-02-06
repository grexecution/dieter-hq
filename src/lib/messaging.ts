/**
 * Messaging utilities for sending WhatsApp messages
 * 
 * On Vercel: Uses WhatsApp Relay service running on Mac Mini
 * Locally: Uses wacli directly (if available)
 */

export type MessageChannel = 'whatsapp' | 'telegram' | 'email' | 'slack';

interface SendMessageResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

// Relay configuration
const WHATSAPP_RELAY_URL = process.env.WHATSAPP_RELAY_URL; // e.g., https://your-tunnel.ngrok.io
const WHATSAPP_RELAY_SECRET = process.env.WHATSAPP_RELAY_SECRET;

/**
 * Send WhatsApp message via relay service (for Vercel deployment)
 */
async function sendViaRelay(to: string, message: string): Promise<SendMessageResult> {
  if (!WHATSAPP_RELAY_URL || !WHATSAPP_RELAY_SECRET) {
    return {
      ok: false,
      error: "WHATSAPP_RELAY_URL and WHATSAPP_RELAY_SECRET must be configured",
    };
  }

  try {
    console.log(`[messaging] Sending via relay to ${to}: ${message.slice(0, 50)}...`);
    
    const response = await fetch(`${WHATSAPP_RELAY_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        message,
        secret: WHATSAPP_RELAY_SECRET,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("[messaging] Relay error:", result);
      return {
        ok: false,
        error: result.error || `Relay returned ${response.status}`,
      };
    }

    console.log("[messaging] Relay success:", result);
    return {
      ok: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("[messaging] Relay request failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Relay request failed",
    };
  }
}

/**
 * Send a WhatsApp message
 * Uses relay service when WHATSAPP_RELAY_URL is configured (Vercel)
 */
export async function sendWhatsAppMessage(
  to: string, 
  message: string,
  _replyTo?: string // Note: reply-to not yet supported
): Promise<SendMessageResult> {
  // Ensure proper WhatsApp JID format
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  
  // Always use relay (Vercel doesn't have wacli)
  return sendViaRelay(jid, message);
}

/**
 * Extract phone number from WhatsApp JID
 */
export function extractPhoneFromJid(jid: string): string {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');
}

/**
 * Format phone number as WhatsApp JID
 */
export function formatAsWhatsAppJid(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return `${cleaned}@s.whatsapp.net`;
}

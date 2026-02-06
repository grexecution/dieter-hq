/**
 * Messaging utilities - sends via OpenClaw Gateway /tools/invoke
 * 
 * This uses the Gateway's HTTP API to invoke the message tool directly.
 * Works from anywhere (Vercel, local, etc.) as long as Gateway is reachable.
 */

export type MessageChannel = 'whatsapp' | 'telegram' | 'email' | 'slack';

interface SendMessageResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

// Gateway configuration
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const OPENCLAW_GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

/**
 * Send a message via OpenClaw Gateway's /tools/invoke endpoint
 */
async function sendViaGateway(
  channel: MessageChannel,
  to: string,
  message: string
): Promise<SendMessageResult> {
  const url = `${OPENCLAW_GATEWAY_URL}/tools/invoke`;
  
  console.log(`[messaging] Sending ${channel} to ${to} via Gateway: ${message.slice(0, 50)}...`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OPENCLAW_GATEWAY_TOKEN && { "Authorization": `Bearer ${OPENCLAW_GATEWAY_TOKEN}` }),
      },
      body: JSON.stringify({
        tool: "message",
        args: {
          action: "send",
          channel,
          to,
          message,
        },
      }),
    });

    const result = await response.json();
    
    if (!response.ok || result.ok === false) {
      console.error("[messaging] Gateway error:", result);
      return {
        ok: false,
        error: result.error?.message || result.error || `Gateway returned ${response.status}`,
      };
    }

    console.log("[messaging] Gateway success:", result);
    return {
      ok: true,
      messageId: result.result?.messageId,
    };
  } catch (error) {
    console.error("[messaging] Gateway request failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gateway request failed",
    };
  }
}

/**
 * Send a WhatsApp message via OpenClaw Gateway
 */
export async function sendWhatsAppMessage(
  to: string, 
  message: string,
  _replyTo?: string // Note: reply-to not yet supported
): Promise<SendMessageResult> {
  // Ensure proper WhatsApp JID format
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  
  return sendViaGateway('whatsapp', jid, message);
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

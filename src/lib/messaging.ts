/**
 * Messaging utilities - spawns OpenClaw sub-agent to send messages
 * 
 * Uses sessions_spawn to create a task that executes wacli.
 * The agent has access to exec tool and can run wacli directly.
 */

export type MessageChannel = 'whatsapp' | 'telegram' | 'email' | 'slack';

interface SendMessageResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

// Gateway configuration
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL;
const OPENCLAW_GATEWAY_PASSWORD = process.env.OPENCLAW_GATEWAY_PASSWORD;

/**
 * Spawn a sub-agent task to send a WhatsApp message via wacli
 */
async function spawnMessageTask(to: string, message: string): Promise<SendMessageResult> {
  // Validate config
  if (!OPENCLAW_GATEWAY_URL) {
    console.error("[messaging] OPENCLAW_GATEWAY_URL not configured!");
    return {
      ok: false,
      error: "OPENCLAW_GATEWAY_URL not configured",
    };
  }
  
  if (!OPENCLAW_GATEWAY_PASSWORD) {
    console.error("[messaging] OPENCLAW_GATEWAY_PASSWORD not configured!");
    return {
      ok: false,
      error: "OPENCLAW_GATEWAY_PASSWORD not configured",
    };
  }

  const url = `${OPENCLAW_GATEWAY_URL}/tools/invoke`;
  console.log(`[messaging] Using gateway: ${OPENCLAW_GATEWAY_URL}`);
  
  // Escape the message for the task prompt
  const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const escapedTo = to.replace(/"/g, '\\"');
  
  const task = `Send this WhatsApp message immediately using wacli:

To: ${escapedTo}
Message: "${escapedMessage}"

Use this exact command:
wacli send text --to "${escapedTo}" --message "${escapedMessage}"

Do NOT ask for confirmation. Just execute the command and report success or failure.`;

  console.log(`[messaging] Spawning agent task to send WhatsApp to ${to}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OPENCLAW_GATEWAY_PASSWORD && { "Authorization": `Bearer ${OPENCLAW_GATEWAY_PASSWORD}` }),
      },
      body: JSON.stringify({
        tool: "sessions_spawn",
        args: {
          task,
          label: `whatsapp-send-${Date.now()}`,
          runTimeoutSeconds: 30,
        },
      }),
    });

    const result = await response.json();
    
    if (!response.ok || result.ok === false) {
      console.error("[messaging] Spawn error:", result);
      return {
        ok: false,
        error: result.error?.message || result.error || `Gateway returned ${response.status}`,
      };
    }

    console.log("[messaging] Spawn success:", result);
    return {
      ok: true,
      messageId: result.result?.sessionId,
    };
  } catch (error) {
    console.error("[messaging] Spawn request failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Spawn request failed",
    };
  }
}

/**
 * Send a WhatsApp message by spawning an agent task
 */
export async function sendWhatsAppMessage(
  to: string, 
  message: string,
  _replyTo?: string
): Promise<SendMessageResult> {
  // Ensure proper WhatsApp JID format
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  
  return spawnMessageTask(jid, message);
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

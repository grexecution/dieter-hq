/**
 * Messaging utilities for sending messages via wacli (WhatsApp CLI)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type MessageChannel = 'whatsapp' | 'telegram' | 'email' | 'slack';

interface SendMessageResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a WhatsApp message via wacli
 */
async function sendViaWacli(to: string, message: string): Promise<SendMessageResult> {
  try {
    // Escape message for shell
    const escapedMessage = message.replace(/'/g, "'\\''");
    const escapedTo = to.replace(/'/g, "'\\''");
    
    const cmd = `wacli send '${escapedTo}' '${escapedMessage}'`;
    
    console.log('[messaging] Executing:', cmd.slice(0, 100) + '...');
    
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 30000, // 30 second timeout
      env: { ...process.env, PATH: process.env.PATH + ':/opt/homebrew/bin:/usr/local/bin' }
    });
    
    if (stderr && !stderr.includes('warning')) {
      console.error('[messaging] wacli stderr:', stderr);
    }
    
    console.log('[messaging] wacli stdout:', stdout);
    
    // Parse message ID from output if available
    const messageIdMatch = stdout.match(/message[_-]?id[:\s]+([A-Za-z0-9]+)/i);
    
    return {
      ok: true,
      messageId: messageIdMatch?.[1],
    };
  } catch (error) {
    console.error('[messaging] wacli error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'wacli execution failed',
    };
  }
}

/**
 * Send a WhatsApp message via wacli
 */
export async function sendWhatsAppMessage(
  to: string, 
  message: string,
  _replyTo?: string // Note: wacli doesn't support reply-to yet
): Promise<SendMessageResult> {
  // Ensure proper WhatsApp JID format
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  
  return sendViaWacli(jid, message);
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

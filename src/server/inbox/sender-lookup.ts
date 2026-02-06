/**
 * Sender lookup utilities
 * Resolves sender identifiers to human-readable names
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Cache contact lookups to avoid repeated CLI calls
const contactCache = new Map<string, string | null>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Parse email "From" field into email and name
 * Handles formats like:
 * - "Name <email@example.com>"
 * - "email@example.com"
 * - "<email@example.com>"
 */
export function parseEmailFrom(from: string): { email: string; name: string | null } {
  if (!from) {
    return { email: "", name: null };
  }

  // Match "Name <email>" format
  const match = from.match(/^([^<]*)<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^["']|["']$/g, ""); // Remove quotes
    const email = match[2].trim();
    return { email, name: name || null };
  }

  // Just an email address
  const email = from.trim().replace(/^<|>$/g, "");
  return { email, name: null };
}

/**
 * Parse WhatsApp JID to phone number
 * JID format: "phonenumber@s.whatsapp.net" or "phonenumber:device@s.whatsapp.net"
 */
export function parseWhatsAppJid(jid: string): string {
  if (!jid) return "";
  
  // Remove @s.whatsapp.net suffix
  const withoutSuffix = jid.replace(/@s\.whatsapp\.net$/, "");
  
  // Remove device identifier (e.g., :45)
  const phone = withoutSuffix.replace(/:\d+$/, "");
  
  // Format with + prefix if it looks like a phone number
  if (/^\d+$/.test(phone) && phone.length >= 8) {
    return `+${phone}`;
  }
  
  return phone;
}

/**
 * Look up WhatsApp contact name using wacli
 * Returns cached result if available
 */
export async function lookupWhatsAppContact(jid: string): Promise<string | null> {
  if (!jid) return null;
  
  // Check cache
  const cached = contactCache.get(jid);
  const timestamp = cacheTimestamps.get(jid);
  if (cached !== undefined && timestamp && Date.now() - timestamp < CACHE_TTL_MS) {
    return cached;
  }

  try {
    // Extract phone number for search
    const phone = parseWhatsAppJid(jid).replace(/^\+/, "");
    
    const { stdout } = await execAsync(`wacli contacts search "${phone}" --json --limit=1`, {
      timeout: 10000,
    });
    
    const result = JSON.parse(stdout);
    if (result.success && result.data?.contacts?.length > 0) {
      const contact = result.data.contacts[0];
      const name = contact.PushName || contact.BusinessName || contact.Alias || null;
      
      contactCache.set(jid, name);
      cacheTimestamps.set(jid, Date.now());
      return name;
    }
  } catch (err) {
    console.warn(`[SenderLookup] Failed to lookup WhatsApp contact ${jid}:`, err);
  }
  
  contactCache.set(jid, null);
  cacheTimestamps.set(jid, Date.now());
  return null;
}

/**
 * Get display name for a sender
 * Tries various sources: explicit name, contact lookup, fallback to identifier
 */
export async function getSenderDisplayName(options: {
  source: "email" | "whatsapp";
  sender: string;
  senderName?: string | null;
  jid?: string;
}): Promise<string> {
  const { source, sender, senderName, jid } = options;
  
  // If we have a name, use it
  if (senderName) {
    return senderName;
  }
  
  // For WhatsApp, try to look up the contact
  if (source === "whatsapp" && jid) {
    const contactName = await lookupWhatsAppContact(jid);
    if (contactName) {
      return contactName;
    }
  }
  
  // Fallback: clean up the identifier
  if (source === "email") {
    // Use the part before @ for emails
    const parts = sender.split("@");
    if (parts.length > 0) {
      return parts[0].replace(/[._-]/g, " ").trim() || sender;
    }
  }
  
  return sender;
}

/**
 * Clear the contact cache
 */
export function clearContactCache(): void {
  contactCache.clear();
  cacheTimestamps.clear();
}

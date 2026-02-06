/**
 * WhatsApp sync implementation using wacli CLI
 */

import { exec } from "child_process";
import { promisify } from "util";
import { db } from "@/server/db";
import { inboxItems, inboxSyncState } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { detectPriority, type PriorityInput } from "./priority-detector";
import { parseWhatsAppJid, getSenderDisplayName } from "./sender-lookup";
import type { SyncResult, WacliResponse } from "./types";

const execAsync = promisify(exec);

const WACLI = "wacli";
const DEFAULT_LIMIT = 100;

/**
 * Create preview from content - first N chars, cleaned up
 */
function createPreview(content: string | null | undefined, maxLength = 200): string {
  if (!content) return "";
  
  // Remove excessive whitespace and newlines
  const cleaned = content
    .replace(/\r\n/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Try to cut at a word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + "…";
  }
  
  return truncated + "…";
}

/**
 * Fetch WhatsApp messages using wacli CLI
 */
async function fetchMessages(
  afterDate?: Date,
  limit: number = DEFAULT_LIMIT
): Promise<WacliResponse> {
  let cmd = `${WACLI} messages list --json --limit=${limit}`;
  
  if (afterDate) {
    // wacli uses RFC3339 format
    cmd += ` --after="${afterDate.toISOString()}"`;
  }
  
  console.log(`[WhatsAppSync] Running: ${cmd}`);
  
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    if (stderr) {
      console.warn(`[WhatsAppSync] stderr: ${stderr}`);
    }
    
    const result = JSON.parse(stdout) as WacliResponse;
    return result;
  } catch (err) {
    const error = err as Error & { stderr?: string };
    console.error(`[WhatsAppSync] CLI error:`, error.message);
    if (error.stderr) {
      console.error(`[WhatsAppSync] stderr:`, error.stderr);
    }
    throw new Error(`Failed to fetch WhatsApp messages: ${error.message}`);
  }
}

/**
 * Get the last sync state for WhatsApp
 */
async function getLastSyncState(): Promise<{ lastSyncAt: Date | null; lastMessageId: string | null }> {
  const syncId = "whatsapp";
  
  const state = await db
    .select()
    .from(inboxSyncState)
    .where(eq(inboxSyncState.id, syncId))
    .limit(1);
  
  if (state.length > 0) {
    return {
      lastSyncAt: state[0].lastSyncAt,
      lastMessageId: state[0].lastMessageId,
    };
  }
  
  return { lastSyncAt: null, lastMessageId: null };
}

/**
 * Check if a WhatsApp message already exists in the inbox
 */
async function messageExists(messageId: string): Promise<boolean> {
  const existing = await db
    .select({ id: inboxItems.id })
    .from(inboxItems)
    .where(
      and(
        eq(inboxItems.source, "whatsapp"),
        eq(inboxItems.sourceId, messageId)
      )
    )
    .limit(1);
  
  return existing.length > 0;
}

/**
 * Sync WhatsApp messages
 */
export async function syncWhatsAppInbox(): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    skipped: 0,
    errors: [],
    source: "whatsapp",
  };

  console.log("[WhatsAppSync] Starting sync");

  try {
    // Get last sync state
    const { lastSyncAt } = await getLastSyncState();
    console.log(`[WhatsAppSync] Last sync: ${lastSyncAt?.toISOString() ?? "never"}`);

    // If no previous sync, only get last 7 days to avoid overwhelming
    let afterDate = lastSyncAt;
    if (!afterDate) {
      afterDate = new Date();
      afterDate.setDate(afterDate.getDate() - 7);
    }

    // Fetch messages
    const response = await fetchMessages(afterDate);

    if (!response.success || !response.data?.messages) {
      const errorMsg = response.error || "Unknown error from wacli";
      console.error(`[WhatsAppSync] API error: ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }

    const messages = response.data.messages;
    
    if (messages.length === 0) {
      console.log("[WhatsAppSync] No new messages found");
      return result;
    }

    console.log(`[WhatsAppSync] Fetched ${messages.length} messages`);

    // Filter out messages from me (we only want incoming messages in inbox)
    const incomingMessages = messages.filter(msg => !msg.FromMe);
    console.log(`[WhatsAppSync] ${incomingMessages.length} incoming messages to process`);

    // Process each message
    let newestMessageId: string | null = null;
    let newestDate: Date | null = null;

    for (const msg of incomingMessages) {
      try {
        // Check for duplicate
        if (await messageExists(msg.MsgID)) {
          result.skipped++;
          continue;
        }

        // Parse sender
        const senderPhone = parseWhatsAppJid(msg.SenderJID);
        
        // Get display name - try ChatName first, then lookup
        const displayName = await getSenderDisplayName({
          source: "whatsapp",
          sender: senderPhone,
          senderName: msg.ChatName || null,
          jid: msg.SenderJID,
        });

        // Get message text
        const messageText = msg.DisplayText || msg.Text || "";
        
        // Skip empty messages (might be media-only)
        if (!messageText && !msg.MediaType) {
          result.skipped++;
          continue;
        }

        // Create content description for media
        let content = messageText;
        if (msg.MediaType && !messageText) {
          content = `[${msg.MediaType}]`;
        }

        // Parse timestamp
        const receivedAt = new Date(msg.Timestamp);
        const now = new Date();

        // Create preview
        const preview = createPreview(content) || "(Media message)";

        // Detect priority using PriorityInput
        const priorityInput: PriorityInput = {
          subject: null,
          content,
          preview,
          sender: senderPhone,
          senderName: displayName,
        };
        const { priority } = detectPriority(priorityInput);

        // Track newest message for sync state
        if (!newestDate || receivedAt > newestDate) {
          newestDate = receivedAt;
          newestMessageId = msg.MsgID;
        }

        // Insert into inbox
        await db.insert(inboxItems).values({
          id: `whatsapp:${msg.MsgID}`,
          source: "whatsapp",
          sourceId: msg.MsgID,
          sourceAccount: null,
          threadId: msg.ChatJID,
          sender: senderPhone,
          senderName: displayName,
          subject: null,
          preview,
          content,
          priority,
          status: "pending",
          isRead: false,
          receivedAt,
          createdAt: now,
          updatedAt: now,
        });

        result.synced++;
        console.log(`[WhatsAppSync] Added: ${displayName}: ${preview.substring(0, 40)}...`);
      } catch (err) {
        const error = err as Error;
        console.error(`[WhatsAppSync] Error processing message ${msg.MsgID}:`, error.message);
        result.errors.push(`Message ${msg.MsgID}: ${error.message}`);
      }
    }

    // Update sync state
    const syncNow = new Date();
    await db
      .insert(inboxSyncState)
      .values({
        id: "whatsapp",
        source: "whatsapp",
        account: null,
        lastSyncAt: syncNow,
        lastMessageId: newestMessageId,
        metadata: JSON.stringify({
          messagesFetched: messages.length,
          incomingCount: incomingMessages.length,
          synced: result.synced,
          skipped: result.skipped,
        }),
        updatedAt: syncNow,
      })
      .onConflictDoUpdate({
        target: inboxSyncState.id,
        set: {
          lastSyncAt: syncNow,
          lastMessageId: newestMessageId,
          metadata: JSON.stringify({
            messagesFetched: messages.length,
            incomingCount: incomingMessages.length,
            synced: result.synced,
            skipped: result.skipped,
          }),
          updatedAt: syncNow,
        },
      });

    console.log(`[WhatsAppSync] Completed: ${result.synced} synced, ${result.skipped} skipped`);
  } catch (err) {
    const error = err as Error;
    console.error("[WhatsAppSync] Sync failed:", error.message);
    result.errors.push(error.message);
  }

  return result;
}

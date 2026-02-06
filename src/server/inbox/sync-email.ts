/**
 * Email sync implementation using gog CLI
 */

import { exec } from "child_process";
import { promisify } from "util";
import { db } from "@/server/db";
import { inboxItems, inboxSyncState } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { detectPriority, type PriorityInput } from "./priority-detector";
import { parseEmailFrom, getSenderDisplayName } from "./sender-lookup";
import type { SyncResult, GogEmailResponse } from "./types";

const execAsync = promisify(exec);

const GOG_CLI = "gog";
const DEFAULT_MAX_RESULTS = 50;

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
 * Build the Gmail query for fetching new messages
 */
function buildGmailQuery(afterDate?: Date): string {
  const parts: string[] = ["in:inbox"];
  
  if (afterDate) {
    // Gmail uses YYYY/MM/DD format for date queries
    const dateStr = afterDate.toISOString().split("T")[0].replace(/-/g, "/");
    parts.push(`after:${dateStr}`);
  } else {
    // Default: last 7 days if no sync state
    parts.push("newer_than:7d");
  }
  
  return parts.join(" ");
}

/**
 * Fetch emails using gog CLI
 */
async function fetchEmails(
  account: string,
  query: string,
  maxResults: number = DEFAULT_MAX_RESULTS
): Promise<GogEmailResponse> {
  const cmd = `${GOG_CLI} gmail messages search '${query}' --account="${account}" --json --max=${maxResults} --include-body`;
  
  console.log(`[EmailSync] Running: ${cmd}`);
  
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large email bodies
    });
    
    if (stderr) {
      console.warn(`[EmailSync] stderr: ${stderr}`);
    }
    
    const result = JSON.parse(stdout) as GogEmailResponse;
    return result;
  } catch (err) {
    const error = err as Error & { stderr?: string };
    console.error(`[EmailSync] CLI error:`, error.message);
    if (error.stderr) {
      console.error(`[EmailSync] stderr:`, error.stderr);
    }
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
}

/**
 * Get the last sync state for an email account
 */
async function getLastSyncState(account: string): Promise<{ lastSyncAt: Date | null; lastMessageId: string | null }> {
  const syncId = `email:${account}`;
  
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
 * Check if an email already exists in the inbox
 */
async function emailExists(messageId: string, account: string): Promise<boolean> {
  const existing = await db
    .select({ id: inboxItems.id })
    .from(inboxItems)
    .where(
      and(
        eq(inboxItems.source, "email"),
        eq(inboxItems.sourceId, messageId),
        eq(inboxItems.sourceAccount, account)
      )
    )
    .limit(1);
  
  return existing.length > 0;
}

/**
 * Sync emails for a specific account
 */
export async function syncEmailInbox(account: string): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    skipped: 0,
    errors: [],
    source: "email",
    account,
  };

  console.log(`[EmailSync] Starting sync for account: ${account}`);

  try {
    // Get last sync state
    const { lastSyncAt } = await getLastSyncState(account);
    console.log(`[EmailSync] Last sync: ${lastSyncAt?.toISOString() ?? "never"}`);

    // Build query and fetch emails
    const query = buildGmailQuery(lastSyncAt ?? undefined);
    const response = await fetchEmails(account, query);

    if (!response.messages || response.messages.length === 0) {
      console.log(`[EmailSync] No new emails found for ${account}`);
      return result;
    }

    console.log(`[EmailSync] Fetched ${response.messages.length} emails for ${account}`);

    // Process each email
    let newestMessageId: string | null = null;
    let newestDate: Date | null = null;

    for (const email of response.messages) {
      try {
        // Check for duplicate
        if (await emailExists(email.id, account)) {
          result.skipped++;
          continue;
        }

        // Parse sender
        const { email: senderEmail, name: senderName } = parseEmailFrom(email.from);
        
        // Get display name
        const displayName = await getSenderDisplayName({
          source: "email",
          sender: senderEmail,
          senderName,
        });

        // Parse received date
        const receivedAt = new Date(email.date);
        const now = new Date();

        // Create preview from body
        const preview = createPreview(email.body) || email.subject || "(No content)";

        // Detect priority using PriorityInput
        const priorityInput: PriorityInput = {
          subject: email.subject,
          content: email.body,
          preview,
          sender: senderEmail,
          senderName: displayName,
        };
        const { priority } = detectPriority(priorityInput);

        // Track newest message for sync state
        if (!newestDate || receivedAt > newestDate) {
          newestDate = receivedAt;
          newestMessageId = email.id;
        }

        // Insert into inbox
        await db.insert(inboxItems).values({
          id: `email:${account}:${email.id}`,
          source: "email",
          sourceId: email.id,
          sourceAccount: account,
          threadId: email.threadId,
          sender: senderEmail,
          senderName: displayName,
          subject: email.subject,
          preview,
          content: email.body || null,
          priority,
          status: "pending",
          isRead: false,
          receivedAt,
          createdAt: now,
          updatedAt: now,
        });

        result.synced++;
        console.log(`[EmailSync] Added: ${email.subject?.substring(0, 50)}...`);
      } catch (err) {
        const error = err as Error;
        console.error(`[EmailSync] Error processing email ${email.id}:`, error.message);
        result.errors.push(`Email ${email.id}: ${error.message}`);
      }
    }

    // Update sync state
    const syncId = `email:${account}`;
    const syncNow = new Date();
    await db
      .insert(inboxSyncState)
      .values({
        id: syncId,
        source: "email",
        account,
        lastSyncAt: syncNow,
        lastMessageId: newestMessageId,
        metadata: JSON.stringify({
          lastQuery: query,
          messagesFetched: response.messages.length,
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
            lastQuery: query,
            messagesFetched: response.messages.length,
            synced: result.synced,
            skipped: result.skipped,
          }),
          updatedAt: syncNow,
        },
      });

    console.log(`[EmailSync] Completed for ${account}: ${result.synced} synced, ${result.skipped} skipped`);
  } catch (err) {
    const error = err as Error;
    console.error(`[EmailSync] Sync failed for ${account}:`, error.message);
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Sync all configured email accounts
 */
export async function syncAllEmailInboxes(): Promise<SyncResult[]> {
  const { EMAIL_ACCOUNTS } = await import("./types");
  const results: SyncResult[] = [];

  for (const account of EMAIL_ACCOUNTS) {
    const result = await syncEmailInbox(account);
    results.push(result);
  }

  return results;
}

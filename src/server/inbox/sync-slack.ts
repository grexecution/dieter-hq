/**
 * Slack sync implementation using Slack Web API
 * 
 * Required env vars:
 * - SLACK_BOT_TOKEN: Bot User OAuth Token (xoxb-...)
 * - SLACK_CHANNELS: Comma-separated list of channel IDs to sync (optional, defaults to all DMs)
 */

import { db } from "@/server/db";
import { inboxItems, inboxSyncState } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { detectPriority, type PriorityInput } from "./priority-detector";
import type { 
  SyncResult, 
  SlackMessage, 
  SlackUser,
  SlackChannel,
  SlackConversationsHistoryResponse,
  SlackConversationsListResponse,
  SlackUsersInfoResponse,
} from "./types";

const SLACK_API_BASE = "https://slack.com/api";
const DEFAULT_LIMIT = 100;

// Cache for user lookups
const userCache = new Map<string, SlackUser>();

/**
 * Get Slack bot token from environment
 */
function getSlackToken(): string | null {
  return process.env.SLACK_BOT_TOKEN || null;
}

/**
 * Make a Slack API request
 */
async function slackApi<T>(method: string, params: Record<string, string> = {}): Promise<T> {
  const token = getSlackToken();
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN not configured");
  }

  const url = new URL(`${SLACK_API_BASE}/${method}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Get user info from Slack
 */
async function getUser(userId: string): Promise<SlackUser | null> {
  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  try {
    const response = await slackApi<SlackUsersInfoResponse>("users.info", { user: userId });
    if (response.ok && response.user) {
      userCache.set(userId, response.user);
      return response.user;
    }
    return null;
  } catch (err) {
    console.warn(`[SlackSync] Failed to get user ${userId}:`, err);
    return null;
  }
}

/**
 * Get user display name
 */
async function getUserDisplayName(userId: string): Promise<string> {
  const user = await getUser(userId);
  if (!user) return userId;
  
  return user.profile?.display_name 
    || user.profile?.real_name 
    || user.real_name 
    || user.name 
    || userId;
}

/**
 * List conversations (channels, DMs) the bot has access to
 */
async function listConversations(): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const response = await slackApi<SlackConversationsListResponse>("conversations.list", {
      types: "public_channel,private_channel,mpim,im",
      exclude_archived: "true",
      limit: "200",
      ...(cursor && { cursor }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list conversations: ${response.error}`);
    }

    if (response.channels) {
      channels.push(...response.channels);
    }

    cursor = response.response_metadata?.next_cursor;
  } while (cursor);

  return channels;
}

/**
 * Get conversation history
 */
async function getConversationHistory(
  channelId: string,
  oldest?: string,
  limit: number = DEFAULT_LIMIT
): Promise<SlackMessage[]> {
  const response = await slackApi<SlackConversationsHistoryResponse>("conversations.history", {
    channel: channelId,
    limit: String(limit),
    ...(oldest && { oldest }),
  });

  if (!response.ok) {
    console.warn(`[SlackSync] Failed to get history for ${channelId}: ${response.error}`);
    return [];
  }

  return response.messages || [];
}

/**
 * Create preview from message text
 */
function createPreview(text: string, maxLength = 200): string {
  if (!text) return "";
  
  // Remove Slack formatting
  const cleaned = text
    .replace(/<@[A-Z0-9]+>/g, "@user") // Replace user mentions
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, "#$1") // Replace channel mentions
    .replace(/<([^|>]+)\|([^>]+)>/g, "$2") // Replace links with label
    .replace(/<([^>]+)>/g, "$1") // Replace plain links
    .replace(/\s+/g, " ")
    .trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + "…";
  }
  
  return truncated + "…";
}

/**
 * Get the last sync state for Slack
 */
async function getLastSyncState(): Promise<{ lastSyncAt: Date | null; lastMessageTs: string | null }> {
  const syncId = "slack";
  
  const state = await db
    .select()
    .from(inboxSyncState)
    .where(eq(inboxSyncState.id, syncId))
    .limit(1);
  
  if (state.length > 0) {
    return {
      lastSyncAt: state[0].lastSyncAt,
      lastMessageTs: state[0].lastMessageId,
    };
  }
  
  return { lastSyncAt: null, lastMessageTs: null };
}

/**
 * Check if a Slack message already exists in the inbox
 */
async function messageExists(channelId: string, ts: string): Promise<boolean> {
  const sourceId = `${channelId}:${ts}`;
  const existing = await db
    .select({ id: inboxItems.id })
    .from(inboxItems)
    .where(
      and(
        eq(inboxItems.source, "slack"),
        eq(inboxItems.sourceId, sourceId)
      )
    )
    .limit(1);
  
  return existing.length > 0;
}

/**
 * Sync Slack messages
 */
export async function syncSlackInbox(): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    skipped: 0,
    errors: [],
    source: "slack",
  };

  const token = getSlackToken();
  if (!token) {
    result.errors.push("SLACK_BOT_TOKEN not configured - skipping Slack sync");
    console.warn("[SlackSync] No token configured, skipping");
    return result;
  }

  console.log("[SlackSync] Starting sync");

  try {
    // Get last sync state
    const { lastSyncAt, lastMessageTs } = await getLastSyncState();
    console.log(`[SlackSync] Last sync: ${lastSyncAt?.toISOString() ?? "never"}`);

    // Calculate oldest timestamp (Slack uses Unix epoch seconds)
    let oldest: string | undefined;
    if (lastMessageTs) {
      oldest = lastMessageTs;
    } else if (!lastSyncAt) {
      // First sync: only get last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      oldest = String(sevenDaysAgo.getTime() / 1000);
    }

    // Get configured channels or fetch all DMs
    const configuredChannels = process.env.SLACK_CHANNELS?.split(",").map(s => s.trim()).filter(Boolean);
    
    let channelsToSync: SlackChannel[];
    if (configuredChannels && configuredChannels.length > 0) {
      // Use configured channels
      channelsToSync = configuredChannels.map(id => ({
        id,
        name: id,
        is_channel: true,
        is_im: false,
        is_mpim: false,
        is_private: false,
      }));
      console.log(`[SlackSync] Syncing ${channelsToSync.length} configured channels`);
    } else {
      // Fetch all conversations
      channelsToSync = await listConversations();
      // Filter to DMs and channels with recent activity
      channelsToSync = channelsToSync.filter(c => c.is_im || c.is_mpim);
      console.log(`[SlackSync] Found ${channelsToSync.length} DM conversations`);
    }

    let newestTs: string | null = null;
    const now = new Date();

    // Process each channel
    for (const channel of channelsToSync) {
      try {
        const messages = await getConversationHistory(channel.id, oldest);
        
        // Filter out bot messages and messages from me
        const relevantMessages = messages.filter(msg => 
          msg.type === "message" && 
          !msg.subtype && // No subtypes (join, leave, etc.)
          msg.user && // Has a user (not a bot message without user)
          !msg.bot_id // Not from a bot
        );

        for (const msg of relevantMessages) {
          try {
            const sourceId = `${channel.id}:${msg.ts}`;
            
            // Check for duplicate
            if (await messageExists(channel.id, msg.ts)) {
              result.skipped++;
              continue;
            }

            // Get sender info
            const senderName = await getUserDisplayName(msg.user!);
            
            // Skip empty messages
            if (!msg.text) {
              result.skipped++;
              continue;
            }

            // Parse timestamp (Slack ts is Unix epoch seconds with decimal)
            const receivedAt = new Date(parseFloat(msg.ts) * 1000);
            
            // Create preview
            const preview = createPreview(msg.text);

            // Detect priority
            const priorityInput: PriorityInput = {
              subject: null,
              content: msg.text,
              preview,
              sender: msg.user!,
              senderName,
            };
            const { priority } = detectPriority(priorityInput);

            // Track newest message
            if (!newestTs || msg.ts > newestTs) {
              newestTs = msg.ts;
            }

            // Determine channel name for display
            let channelName = channel.name;
            if (channel.is_im) {
              channelName = `DM with ${senderName}`;
            }

            // Insert into inbox
            await db.insert(inboxItems).values({
              id: `slack:${sourceId}`,
              source: "slack",
              sourceId,
              sourceAccount: channelName,
              threadId: msg.thread_ts || msg.ts,
              sender: msg.user!,
              senderName,
              subject: null,
              preview,
              content: msg.text,
              priority,
              status: "pending",
              isRead: false,
              receivedAt,
              createdAt: now,
              updatedAt: now,
            });

            result.synced++;
            console.log(`[SlackSync] Added: ${senderName} in ${channelName}: ${preview.substring(0, 40)}...`);
          } catch (err) {
            const error = err as Error;
            console.error(`[SlackSync] Error processing message ${msg.ts}:`, error.message);
            result.errors.push(`Message ${msg.ts}: ${error.message}`);
          }
        }
      } catch (err) {
        const error = err as Error;
        console.error(`[SlackSync] Error processing channel ${channel.id}:`, error.message);
        result.errors.push(`Channel ${channel.id}: ${error.message}`);
      }
    }

    // Update sync state
    const syncNow = new Date();
    await db
      .insert(inboxSyncState)
      .values({
        id: "slack",
        source: "slack",
        account: null,
        lastSyncAt: syncNow,
        lastMessageId: newestTs,
        metadata: JSON.stringify({
          channelsSynced: channelsToSync.length,
          synced: result.synced,
          skipped: result.skipped,
        }),
        updatedAt: syncNow,
      })
      .onConflictDoUpdate({
        target: inboxSyncState.id,
        set: {
          lastSyncAt: syncNow,
          lastMessageId: newestTs,
          metadata: JSON.stringify({
            channelsSynced: channelsToSync.length,
            synced: result.synced,
            skipped: result.skipped,
          }),
          updatedAt: syncNow,
        },
      });

    console.log(`[SlackSync] Completed: ${result.synced} synced, ${result.skipped} skipped`);
  } catch (err) {
    const error = err as Error;
    console.error("[SlackSync] Sync failed:", error.message);
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Clear the user cache (useful for testing)
 */
export function clearSlackUserCache(): void {
  userCache.clear();
}

import { pgTable, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";

// --- Chat ---
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  // Voice message fields (Telegram-style)
  audioUrl: text("audio_url"),
  audioDurationMs: integer("audio_duration_ms"),
  transcription: text("transcription"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  type: text("type").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// --- Calendar MVP ---
export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startAt: timestamp("start_at", { mode: "date", withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { mode: "date", withTimezone: true }).notNull(),
  allDay: boolean("all_day").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

// --- Artefacts ---
export const artefacts = pgTable("artefacts", {
  id: text("id").primaryKey(),
  threadId: text("thread_id"),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path"),  // For local storage (optional)
  dataBase64: text("data_base64"),     // For DB storage (Vercel-compatible)
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// --- Outbox ---
export const outbox = pgTable("outbox", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  channel: text("channel").notNull(),
  target: text("target").notNull(),
  text: text("text").notNull(),
  status: text("status", { enum: ["pending", "sent"] }).notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { mode: "date", withTimezone: true }),
});

// --- Chat Queue (DieterHQ <-> OpenClaw async) ---
export const chatQueue = pgTable("chat_queue", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  userMessage: text("user_message").notNull(),
  assistantMessage: text("assistant_message"),
  status: text("status", { enum: ["pending", "processing", "done", "error"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  processedAt: timestamp("processed_at", { mode: "date", withTimezone: true }),
});

// --- Push Subscriptions (Web Push Notifications) ---
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userId: text("user_id"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// --- Memory Snapshots (Infinite Context System) ---
export const memorySnapshots = pgTable("memory_snapshots", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  
  // Summary content
  summary: text("summary").notNull(),
  keyPointsJson: text("key_points_json").notNull(), // JSON array of strings
  entitiesJson: text("entities_json").notNull(),    // JSON array of entities
  
  // Metadata
  messageCount: integer("message_count").notNull(),
  tokenCount: integer("token_count").notNull(),       // Original tokens
  compressedTokens: integer("compressed_tokens").notNull(), // Summary tokens
  
  // Range tracking
  firstMessageId: text("first_message_id").notNull(),
  lastMessageId: text("last_message_id").notNull(),
  firstMessageAt: timestamp("first_message_at", { mode: "date", withTimezone: true }).notNull(),
  lastMessageAt: timestamp("last_message_at", { mode: "date", withTimezone: true }).notNull(),
  
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// --- Context State (Track context utilization per thread) ---
export const contextState = pgTable("context_state", {
  threadId: text("thread_id").primaryKey(),
  totalTokens: integer("total_tokens").notNull().default(0),
  activeMessageCount: integer("active_message_count").notNull().default(0),
  snapshotCount: integer("snapshot_count").notNull().default(0),
  lastSnapshotAt: timestamp("last_snapshot_at", { mode: "date", withTimezone: true }),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

// --- Workspace Projects (Dev tab persistent projects) ---
export const workspaceProjects = pgTable("workspace_projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  threadId: text("thread_id").notNull().unique(),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  lastActiveAt: timestamp("last_active_at", { mode: "date", withTimezone: true }).notNull(),
});

// --- Unified Inbox ---
// Inbox items from all sources (email, whatsapp, clickup, slack, etc.)
export const inboxItems = pgTable("inbox_items", {
  id: text("id").primaryKey(),
  source: text("source").notNull(), // "email" | "whatsapp" | "clickup" | "slack"
  sourceId: text("source_id").notNull(), // original ID from source
  sourceAccount: text("source_account"), // which account (email address, phone, etc)
  threadId: text("thread_id"), // for grouping conversations
  sender: text("sender").notNull(),
  senderName: text("sender_name"),
  subject: text("subject"),
  preview: text("preview").notNull(),
  content: text("content"),
  priority: text("priority").notNull().default("normal"), // "urgent" | "high" | "normal" | "low"
  status: text("status").notNull().default("pending"), // "pending" | "actioned" | "archived" | "snoozed"
  isRead: boolean("is_read").notNull().default(false),
  receivedAt: timestamp("received_at", { mode: "date", withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
  archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
  snoozedUntil: timestamp("snoozed_until", { mode: "date", withTimezone: true }),
}, (table) => [
  index("idx_inbox_items_source").on(table.source),
  index("idx_inbox_items_status").on(table.status),
  index("idx_inbox_items_received_at").on(table.receivedAt),
  index("idx_inbox_items_priority").on(table.priority),
  index("idx_inbox_items_source_status").on(table.source, table.status),
  index("idx_inbox_items_snoozed_until").on(table.snoozedUntil),
]);

// AI recommendations for inbox items
export const inboxRecommendations = pgTable("inbox_recommendations", {
  id: text("id").primaryKey(),
  inboxItemId: text("inbox_item_id").notNull().references(() => inboxItems.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(), // "reply" | "archive" | "delegate" | "task" | "schedule" | "custom"
  actionLabel: text("action_label").notNull(), // Human readable: "Antwort mit Verfügbarkeit"
  actionDescription: text("action_description"), // Detailed description
  actionPayload: text("action_payload"), // JSON with action details (draft text, etc)
  confidence: integer("confidence"), // 0-100 confidence score (integer for Drizzle)
  reasoning: text("reasoning"), // Why this recommendation
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "executed"
  executedAt: timestamp("executed_at", { mode: "date", withTimezone: true }),
  executionResult: text("execution_result"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
}, (table) => [
  index("idx_inbox_recommendations_item").on(table.inboxItemId),
  index("idx_inbox_recommendations_status").on(table.status),
  index("idx_inbox_recommendations_confidence").on(table.confidence),
]);

// Action history / audit log for inbox
export const inboxActionLog = pgTable("inbox_action_log", {
  id: text("id").primaryKey(),
  recommendationId: text("recommendation_id").references(() => inboxRecommendations.id, { onDelete: "set null" }),
  inboxItemId: text("inbox_item_id").references(() => inboxItems.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  executedBy: text("executed_by").notNull().default("user"), // "user" | "auto" | "dieter"
  result: text("result"),
  metadata: text("metadata"), // JSON
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
}, (table) => [
  index("idx_inbox_action_log_item").on(table.inboxItemId),
  index("idx_inbox_action_log_created").on(table.createdAt),
]);

// Sync state for each source
export const inboxSyncState = pgTable("inbox_sync_state", {
  id: text("id").primaryKey(), // "email:greg@gmail.com" or "whatsapp"
  source: text("source").notNull(),
  account: text("account"),
  lastSyncAt: timestamp("last_sync_at", { mode: "date", withTimezone: true }),
  lastMessageId: text("last_message_id"),
  cursor: text("cursor"), // For pagination
  metadata: text("metadata"), // JSON
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
}, (table) => [
  index("idx_inbox_sync_state_source").on(table.source),
]);

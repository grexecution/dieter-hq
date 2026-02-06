import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

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
  threadId: text("thread_id").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull(),
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

import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

// --- Chat ---
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
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

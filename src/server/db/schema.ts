import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- Chat ---
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  type: text("type").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// --- Calendar MVP ---
export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startAt: integer("start_at", { mode: "timestamp_ms" }).notNull(),
  endAt: integer("end_at", { mode: "timestamp_ms" }).notNull(),
  allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// --- Artefacts ---
export const artefacts = sqliteTable("artefacts", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// --- Outbox ---
export const outbox = sqliteTable("outbox", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  channel: text("channel").notNull(),
  target: text("target").notNull(),
  text: text("text").notNull(),
  status: text("status", { enum: ["pending", "sent"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
});

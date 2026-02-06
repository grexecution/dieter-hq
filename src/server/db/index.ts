import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

// Note: fetchConnectionCache is now always true by default in @neondatabase/serverless

const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: {
    cache: "no-store",
  },
});
export const db = drizzle(sql, { schema });

// Create tables if they don't exist (simple migration for MVP)
// Initialize tables on first use
let initialized = false;
export async function initDb() {
  if (initialized) return;
  initialized = true;
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_at TIMESTAMPTZ NOT NULL,
      end_at TIMESTAMPTZ NOT NULL,
      all_day BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS artefacts (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      target TEXT NOT NULL,
      text TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      sent_at TIMESTAMPTZ
    )
  `;

  // --- Infinite Context System tables ---
  await sql`
    CREATE TABLE IF NOT EXISTS memory_snapshots (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      key_points_json TEXT NOT NULL,
      entities_json TEXT NOT NULL,
      message_count INTEGER NOT NULL,
      token_count INTEGER NOT NULL,
      compressed_tokens INTEGER NOT NULL,
      first_message_id TEXT NOT NULL,
      last_message_id TEXT NOT NULL,
      first_message_at TIMESTAMPTZ NOT NULL,
      last_message_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS context_state (
      thread_id TEXT PRIMARY KEY,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      active_message_count INTEGER NOT NULL DEFAULT 0,
      snapshot_count INTEGER NOT NULL DEFAULT 0,
      last_snapshot_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `;

  // Add indexes for efficient querying
  await sql`
    CREATE INDEX IF NOT EXISTS idx_memory_snapshots_thread 
    ON memory_snapshots(thread_id, created_at DESC)
  `;

  // --- Unified Inbox tables ---
  await sql`
    CREATE TABLE IF NOT EXISTS inbox_items (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      source_id TEXT NOT NULL,
      source_account TEXT,
      thread_id TEXT,
      sender TEXT NOT NULL,
      sender_name TEXT,
      subject TEXT,
      preview TEXT NOT NULL,
      content TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending',
      is_read BOOLEAN NOT NULL DEFAULT false,
      received_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      archived_at TIMESTAMPTZ,
      snoozed_until TIMESTAMPTZ
    )
  `;

  // Inbox item indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_items_source ON inbox_items(source)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_items_status ON inbox_items(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_items_received_at ON inbox_items(received_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_items_priority ON inbox_items(priority)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_items_source_status ON inbox_items(source, status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_items_snoozed_until ON inbox_items(snoozed_until)`;

  await sql`
    CREATE TABLE IF NOT EXISTS inbox_recommendations (
      id TEXT PRIMARY KEY,
      inbox_item_id TEXT NOT NULL REFERENCES inbox_items(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL,
      action_label TEXT NOT NULL,
      action_description TEXT,
      action_payload TEXT,
      confidence INTEGER,
      reasoning TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      executed_at TIMESTAMPTZ,
      execution_result TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `;

  // Recommendation indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_recommendations_item ON inbox_recommendations(inbox_item_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_recommendations_status ON inbox_recommendations(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_recommendations_confidence ON inbox_recommendations(confidence)`;

  await sql`
    CREATE TABLE IF NOT EXISTS inbox_action_log (
      id TEXT PRIMARY KEY,
      recommendation_id TEXT REFERENCES inbox_recommendations(id) ON DELETE SET NULL,
      inbox_item_id TEXT REFERENCES inbox_items(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      executed_by TEXT NOT NULL DEFAULT 'user',
      result TEXT,
      metadata TEXT,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;

  // Action log indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_action_log_item ON inbox_action_log(inbox_item_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_action_log_created ON inbox_action_log(created_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS inbox_sync_state (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      account TEXT,
      last_sync_at TIMESTAMPTZ,
      last_message_id TEXT,
      cursor TEXT,
      metadata TEXT,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_inbox_sync_state_source ON inbox_sync_state(source)`;

  // --- Workspace Projects ---
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      thread_id TEXT NOT NULL UNIQUE,
      archived BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL,
      last_active_at TIMESTAMPTZ NOT NULL
    )
  `;

  // --- Push Subscriptions ---
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_id TEXT,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;

  // --- Chat Queue ---
  await sql`
    CREATE TABLE IF NOT EXISTS chat_queue (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      user_message TEXT NOT NULL,
      assistant_message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL,
      processed_at TIMESTAMPTZ
    )
  `;
}

// Auto-initialize on module load (runs once per cold start)
initDb().catch(console.error);

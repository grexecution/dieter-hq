import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
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
}

// Auto-initialize on module load (runs once per cold start)
initDb().catch(console.error);

import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const url = process.env.DATABASE_URL ?? "file:./data/app.db";
// Supports: file:./path/to.db
const filePath = url.startsWith("file:") ? url.slice("file:".length) : url;

// Ensure data dir exists.
fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });

const sqlite = new Database(filePath);
export const db = drizzle(sqlite);

// Run migrations once per process (dev HMR can re-import modules).
const g = globalThis as unknown as { __hqMigrated?: boolean };
if (!g.__hqMigrated) {
  g.__hqMigrated = true;
  migrate(db, { migrationsFolder: path.resolve(process.cwd(), "src/server/db/migrations") });
}

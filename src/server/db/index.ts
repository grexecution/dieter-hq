import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./data/app.db";
// Supports: file:./path/to.db
const filePath = url.startsWith("file:") ? url.slice("file:".length) : url;

const sqlite = new Database(filePath);
export const db = drizzle(sqlite);

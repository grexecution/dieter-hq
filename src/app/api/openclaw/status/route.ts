import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";

const OPENCLAW_ROOT = "/Users/dieter/.openclaw";
const WORKSPACE_ROOT = "/Users/dieter/.openclaw/workspace";
const HQ_STATUS_PATH = path.join(WORKSPACE_ROOT, "memory", "hq-status.json");

type TimelineKind = "event";

type TimelineItem = {
  ts: number;
  iso: string;
  kind: TimelineKind;
  summary: string;
};

type HqStatusFile = {
  current?: string;
  why?: string;
  next?: string;
  sinceMs?: number;
  updatedAtMs?: number;
  lastError?: string;
  tunnel?: { url?: string; ok?: boolean; checkedAtMs?: number };
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

async function safeReadJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function safeStatMtimeMs(filePath: string): Promise<number | null> {
  try {
    const st = await fs.stat(filePath);
    return Math.floor(st.mtimeMs);
  } catch {
    return null;
  }
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, Math.max(0, n - 1)).trimEnd()}…`;
}

function summarizeEvent(type: string, payloadJson: string): string {
  let payload: unknown = null;
  try {
    payload = JSON.parse(payloadJson) as unknown;
  } catch {
    // ignore
  }

  switch (type) {
    case "message.create": {
      const role = isRecord(payload) ? String(payload.role ?? "") : "";
      return role ? `Message sent (${role})` : "Message sent";
    }
    case "outbox.enqueue": {
      const channel = isRecord(payload) ? String(payload.channel ?? "") : "";
      return channel ? `Queued for ${channel}` : "Queued";
    }
    case "tool.image": {
      const prompt = isRecord(payload) ? String(payload.prompt ?? "") : "";
      return prompt ? `Generated image: ${truncate(prompt, 80)}` : "Generated image";
    }
    case "artefact.upload": {
      const name = isRecord(payload) ? String(payload.originalName ?? "") : "";
      return name ? `Uploaded: ${truncate(name, 60)}` : "Uploaded file";
    }
    case "audio.transcribe": {
      const ok = isRecord(payload) ? Boolean(payload.ok) : false;
      return ok ? "Transcribed audio" : "Audio transcription failed";
    }
    case "chat.view": {
      return "Opened chat";
    }
    default: {
      return type;
    }
  }
}

type CronJob = {
  id: string;
  enabled: boolean;
  state?: { nextRunAtMs?: number | null };
};

async function listCronJobsSummary(): Promise<{ enabled: number; nextRunAtMs: number | null }> {
  const jobsPath = path.join(OPENCLAW_ROOT, "cron", "jobs.json");
  const data = await safeReadJson<{ jobs?: CronJob[] }>(jobsPath);
  const jobs = Array.isArray(data?.jobs) ? data!.jobs : [];

  const enabled = jobs.filter((j) => j.enabled !== false);
  const nextRunAtMs = enabled
    .map((j) => (typeof j.state?.nextRunAtMs === "number" ? j.state?.nextRunAtMs : null))
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x))
    .sort((a, b) => a - b)[0];

  return { enabled: enabled.length, nextRunAtMs: nextRunAtMs ?? null };
}

async function listSessionsSummary(): Promise<{ 
  totalRecent: number; 
  active: number; 
  isWorking: boolean;
  lastActivityMs: number | null;
  currentSessionId: string | null;
}> {
  const dir = path.join(OPENCLAW_ROOT, "agents", "main", "sessions");
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return { totalRecent: 0, active: 0, isWorking: false, lastActivityMs: null, currentSessionId: null };
  }

  const files = entries.filter((f) => f.endsWith(".jsonl"));
  const now = Date.now();

  const stats = await Promise.all(
    files.map(async (f) => {
      const fp = path.join(dir, f);
      try {
        const st = await fs.stat(fp);
        return { file: f, mtimeMs: st.mtimeMs };
      } catch {
        return null;
      }
    }),
  );

  const validStats = stats.filter((x): x is { file: string; mtimeMs: number } => x !== null);
  const mtimes = validStats.map(s => s.mtimeMs);
  
  // Find most recent session
  const sorted = validStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const mostRecent = sorted[0] ?? null;
  
  // "Working" = session modified in last 60 seconds (agent is actively responding)
  const isWorking = mostRecent ? (now - mostRecent.mtimeMs < 60 * 1000) : false;
  
  // "Active" = session modified in last 30 minutes
  const active = mtimes.filter((ms) => now - ms < 30 * 60 * 1000).length;

  // Keep this number bounded so it stays stable as the directory grows.
  const totalRecent = mtimes.filter((ms) => now - ms < 24 * 60 * 60 * 1000).length;

  return { 
    totalRecent, 
    active, 
    isWorking,
    lastActivityMs: mostRecent?.mtimeMs ?? null,
    currentSessionId: mostRecent?.file.replace('.jsonl', '') ?? null,
  };
}

export async function GET() {
  const [status, statusMtimeMs, recentEvents, cronSummary, sessionsSummary] =
    await Promise.all([
      safeReadJson<HqStatusFile>(HQ_STATUS_PATH),
      safeStatMtimeMs(HQ_STATUS_PATH),
      db
        .select({ type: events.type, payloadJson: events.payloadJson, createdAt: events.createdAt })
        .from(events)
        .orderBy(desc(events.createdAt))
        .limit(12),
      listCronJobsSummary(),
      listSessionsSummary(),
    ]);

  const updatedAtMs =
    (typeof status?.updatedAtMs === "number" ? status.updatedAtMs : null) ??
    statusMtimeMs ??
    null;

  const sinceMs =
    (typeof status?.sinceMs === "number" ? status.sinceMs : null) ??
    updatedAtMs ??
    null;

  const current = String(status?.current ?? "—");
  const why = String(status?.why ?? "—");
  const next = String(status?.next ?? "—");
  const lastError = String(status?.lastError ?? "");
  const tunnelUrl = isRecord(status?.tunnel) ? String(status?.tunnel.url ?? "") : "";
  const tunnelOk = isRecord(status?.tunnel) ? Boolean(status?.tunnel.ok) : false;
  const tunnelCheckedAtMs = isRecord(status?.tunnel)
    ? Number(status?.tunnel.checkedAtMs ?? 0) || null
    : null;

  const timeline: TimelineItem[] = (recentEvents ?? []).map((e) => {
    const ts = new Date(e.createdAt).getTime();
    return {
      ts,
      iso: new Date(ts).toISOString(),
      kind: "event",
      summary: summarizeEvent(String(e.type), String(e.payloadJson)),
    };
  });

  return NextResponse.json({
    ok: true,
    live: {
      current,
      why,
      next,
      sinceMs,
      updatedAtMs,
      lastError,
      tunnel: { url: tunnelUrl, ok: tunnelOk, checkedAtMs: tunnelCheckedAtMs },
      statusFile: HQ_STATUS_PATH,
    },
    recent: timeline.slice(0, 10),
    details: {
      sessions: sessionsSummary,
      cron: cronSummary,
    },
    source: {
      adapter: "hq-status-file+db-events",
    },
  });
}

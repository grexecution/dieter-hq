import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const OPENCLAW_ROOT = "/Users/dieter/.openclaw";

type CronJob = {
  id: string;
  name: string;
  enabled: boolean;
  agentId?: string;
  schedule?: unknown;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
  };
};

type SessionSummary = {
  id: string;
  file: string;
  lastAtMs: number;
  lastAtIso: string;
  lastUserText?: string;
  isActive: boolean;
};

type TimelineKind = "user" | "assistant" | "tool" | "event";

type TimelineItem = {
  ts: number;
  iso: string;
  kind: TimelineKind;
  summary: string;
};

type JsonlTextPart = { type: "text"; text: string };

type JsonlToolCallPart = {
  type: "toolCall";
  name?: string;
  arguments?: {
    command?: string;
  };
};

type JsonlMessage = {
  role?: string;
  content?: unknown;
};

type JsonlEvent = {
  type?: string;
  id?: string;
  timestamp?: string;
  message?: JsonlMessage;
  toolName?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function isTextPart(v: unknown): v is JsonlTextPart {
  return (
    isRecord(v) &&
    v.type === "text" &&
    typeof v.text === "string" &&
    v.text.trim().length > 0
  );
}

function isToolCallPart(v: unknown): v is JsonlToolCallPart {
  if (!isRecord(v)) return false;
  if (v.type !== "toolCall") return false;
  if (v.name != null && typeof v.name !== "string") return false;
  if (v.arguments != null && !isRecord(v.arguments)) return false;
  return true;
}

async function safeReadJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function listCronJobs(): Promise<CronJob[]> {
  const jobsPath = path.join(OPENCLAW_ROOT, "cron", "jobs.json");
  const data = await safeReadJson<{ jobs?: CronJob[] }>(jobsPath);
  return Array.isArray(data?.jobs) ? data!.jobs : [];
}

function parseIsoToMs(iso: string | undefined): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

async function readJsonlTail(filePath: string, maxLines = 200): Promise<JsonlEvent[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const tail = lines.slice(Math.max(0, lines.length - maxLines));

    const out: JsonlEvent[] = [];
    for (const line of tail) {
      try {
        const parsed = JSON.parse(line) as unknown;
        if (isRecord(parsed)) out.push(parsed as JsonlEvent);
      } catch {
        // ignore
      }
    }
    return out;
  } catch {
    return [];
  }
}

function extractLastUserText(events: JsonlEvent[]): string | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i];
    if (ev.type !== "message") continue;
    if (ev.message?.role !== "user") continue;

    const content = ev.message?.content;
    const parts = Array.isArray(content) ? (content as unknown[]) : [];

    const textParts = parts
      .filter(isTextPart)
      .map((p) => p.text.trim())
      .filter(Boolean);

    const text = textParts.join("\n").trim();
    if (text) return text.slice(0, 180);
  }
  return undefined;
}

async function listSessions(): Promise<SessionSummary[]> {
  const dir = path.join(OPENCLAW_ROOT, "agents", "main", "sessions");
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  const files = entries.filter((f) => f.endsWith(".jsonl"));
  const stats = await Promise.all(
    files.map(async (f) => {
      const fp = path.join(dir, f);
      try {
        const st = await fs.stat(fp);
        return { f, fp, mtimeMs: st.mtimeMs };
      } catch {
        return null;
      }
    }),
  );

  const sorted = stats
    .filter((x): x is { f: string; fp: string; mtimeMs: number } => x !== null)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, 12);

  const now = Date.now();

  const out: SessionSummary[] = [];
  for (const item of sorted) {
    const evs = await readJsonlTail(item.fp, 250);
    const lastEvent = evs[evs.length - 1];

    const lastAtMs = parseIsoToMs(lastEvent?.timestamp) || Math.floor(item.mtimeMs);

    const sessionHeader = evs.find((e) => e.type === "session");
    const id = String(sessionHeader?.id ?? path.basename(item.f, ".jsonl"));

    out.push({
      id,
      file: item.f,
      lastAtMs,
      lastAtIso: new Date(lastAtMs).toISOString(),
      lastUserText: extractLastUserText(evs),
      isActive: now - lastAtMs < 30 * 60 * 1000,
    });
  }

  return out;
}

function timelineFromEvents(events: JsonlEvent[]): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const ev of events) {
    const ts = parseIsoToMs(ev.timestamp);
    if (!ts) continue;

    if (ev.type === "message") {
      const role = ev.message?.role;
      const content = ev.message?.content;
      const parts = Array.isArray(content) ? (content as unknown[]) : [];

      for (const part of parts) {
        if (!isToolCallPart(part)) continue;
        const name = String(part.name ?? "tool");
        const cmd = isRecord(part.arguments) && typeof part.arguments.command === "string"
          ? String(part.arguments.command)
          : "";
        items.push({
          ts,
          iso: new Date(ts).toISOString(),
          kind: "tool",
          summary: `${name}${cmd ? `: ${cmd}` : ""}`.slice(0, 180),
        });
      }

      const text = parts
        .filter(isTextPart)
        .map((p) => p.text.trim())
        .filter(Boolean)
        .join("\n")
        .trim();

      if (text && role === "user") {
        items.push({
          ts,
          iso: new Date(ts).toISOString(),
          kind: "user",
          summary: text.slice(0, 180),
        });
      }

      if (text && role === "assistant") {
        items.push({
          ts,
          iso: new Date(ts).toISOString(),
          kind: "assistant",
          summary: text.slice(0, 180),
        });
      }

      continue;
    }

    if (ev.type === "tool_result" || ev.type === "toolResult") {
      const toolName = String(ev.toolName ?? "tool");
      items.push({
        ts,
        iso: new Date(ts).toISOString(),
        kind: "tool",
        summary: `${toolName} result`,
      });
      continue;
    }

    if (typeof ev.type === "string") {
      items.push({
        ts,
        iso: new Date(ts).toISOString(),
        kind: "event",
        summary: ev.type,
      });
    }
  }

  items.sort((a, b) => b.ts - a.ts);
  return items.slice(0, 25);
}

export async function GET() {
  const [jobs, sessions] = await Promise.all([listCronJobs(), listSessions()]);

  const enabledJobs = jobs.filter((j) => j.enabled !== false);
  enabledJobs.sort((a, b) => (a.state?.nextRunAtMs ?? 0) - (b.state?.nextRunAtMs ?? 0));

  const mostRecentSession = sessions[0];
  let timeline: TimelineItem[] = [];

  if (mostRecentSession) {
    const fp = path.join(
      OPENCLAW_ROOT,
      "agents",
      "main",
      "sessions",
      mostRecentSession.file,
    );
    const tail = await readJsonlTail(fp, 120);
    timeline = timelineFromEvents(tail);
  }

  const now = {
    project: "dieter-hq",
    task: mostRecentSession?.lastUserText ?? "—",
    updatedAtMs: Date.now(),
  };

  return NextResponse.json({
    ok: true,
    now,
    sessions,
    cron: enabledJobs.map((j) => ({
      id: j.id,
      name: j.name,
      enabled: j.enabled !== false,
      nextRunAtMs: j.state?.nextRunAtMs ?? null,
      lastRunAtMs: j.state?.lastRunAtMs ?? null,
      lastStatus: j.state?.lastStatus ?? null,
      lastDurationMs: j.state?.lastDurationMs ?? null,
      schedule: j.schedule ?? null,
    })),
    timeline,
    source: {
      adapter: "local-files",
      cronJobsPath: "/Users/dieter/.openclaw/cron/jobs.json",
      sessionsPath: "/Users/dieter/.openclaw/agents/main/sessions",
      todo: "Prefer OpenClaw Gateway HTTP API when available; keep this as fallback adapter.",
    },
  });
}

"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type StatusPayload = {
  ok: boolean;
  now: {
    project: string;
    task: string;
    updatedAtMs: number;
  };
  sessions: Array<{
    id: string;
    lastAtMs: number;
    lastAtIso: string;
    lastUserText?: string;
    isActive: boolean;
  }>;
  cron: Array<{
    id: string;
    name: string;
    enabled: boolean;
    nextRunAtMs: number | null;
    lastRunAtMs: number | null;
    lastStatus: string | null;
    lastDurationMs: number | null;
  }>;
  timeline: Array<{
    ts: number;
    iso: string;
    kind: "user" | "assistant" | "tool" | "event";
    summary: string;
  }>;
  source?: {
    adapter: string;
    todo?: string;
  };
};

function formatRelative(ms: number | null): string {
  if (!ms) return "—";
  const delta = Date.now() - ms;
  const s = Math.max(0, Math.round(delta / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

function formatIn(ms: number | null): string {
  if (!ms) return "—";
  const delta = ms - Date.now();
  const s = Math.round(delta / 1000);
  if (s <= 0) return "now";
  if (s < 60) return `in ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `in ${m}m`;
  const h = Math.round(m / 60);
  return `in ${h}h`;
}

function kindPill(kind: StatusPayload["timeline"][number]["kind"]) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1";
  if (kind === "user")
    return <span className={cn(base, "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300")}>user</span>;
  if (kind === "assistant")
    return <span className={cn(base, "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300")}>assistant</span>;
  if (kind === "tool")
    return <span className={cn(base, "bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-200")}>tool</span>;
  return <span className={cn(base, "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300")}>event</span>;
}

export function OpenClawStatusSidebar({
  logoutAction,
}: {
  logoutAction: (formData: FormData) => void;
}) {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const r = await fetch("/api/openclaw/status", { cache: "no-store" });
        if (!r.ok) throw new Error(`status_${r.status}`);
        const json = (await r.json()) as StatusPayload;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    };

    void tick();
    const id = setInterval(() => void tick(), 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const activeCount = useMemo(() => {
    if (!data?.sessions?.length) return 0;
    return data.sessions.filter((s) => s.isActive).length;
  }, [data?.sessions]);

  return (
    <aside className="h-[calc(100dvh-120px)] rounded-2xl border border-zinc-200/70 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">OpenClaw Status</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {activeCount ? `${activeCount} active session${activeCount === 1 ? "" : "s"}` : "idle"}
            {data?.source?.adapter ? ` • ${data.source.adapter}` : ""}
          </div>
        </div>
        <form action={logoutAction}>
          <Button size="sm" variant="secondary" type="submit">
            Logout
          </Button>
        </form>
      </div>

      <Separator className="my-4" />

      <ScrollArea className="h-[calc(100dvh-220px)] pr-3">
        <div className="space-y-6">
          {/* Now */}
          <section className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Now
            </div>
            <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{data?.now?.project ?? "—"}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {data?.now?.updatedAtMs ? formatRelative(data.now.updatedAtMs) : ""}
                </div>
              </div>
              <div className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                {error ? (
                  <span className="text-rose-600 dark:text-rose-400">Failed to load: {error}</span>
                ) : (
                  <span className="line-clamp-6 whitespace-pre-wrap">{data?.now?.task ?? "—"}</span>
                )}
              </div>
            </div>
          </section>

          {/* Sessions */}
          <section className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Sessions
            </div>
            <div className="grid gap-2">
              {(data?.sessions ?? []).slice(0, 6).map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{s.id.slice(0, 8)}</div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        s.isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {s.isActive ? "active" : "recent"}
                    </span>
                  </div>
                  <div className="mt-1 text-zinc-500 dark:text-zinc-400">
                    last: {formatRelative(s.lastAtMs)}
                  </div>
                  {s.lastUserText ? (
                    <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-zinc-700 dark:text-zinc-200">
                      {s.lastUserText}
                    </div>
                  ) : null}
                </div>
              ))}

              {!data?.sessions?.length ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-white/40 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
                  No sessions found.
                </div>
              ) : null}
            </div>
          </section>

          {/* Cron */}
          <section className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Cronjobs
            </div>
            <div className="grid gap-2">
              {(data?.cron ?? []).slice(0, 8).map((j) => (
                <div
                  key={j.id}
                  className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 truncate font-medium">{j.name}</div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        j.lastStatus === "ok"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : j.lastStatus
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {j.lastStatus ?? "—"}
                    </span>
                  </div>
                  <div className="mt-1 text-zinc-500 dark:text-zinc-400">
                    next: {formatIn(j.nextRunAtMs)}
                  </div>
                  <div className="mt-1 text-zinc-500 dark:text-zinc-400">
                    last: {formatRelative(j.lastRunAtMs)}
                    {j.lastDurationMs ? ` • ${Math.round(j.lastDurationMs / 1000)}s` : ""}
                  </div>
                </div>
              ))}
              {!data?.cron?.length ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-white/40 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
                  No enabled cronjobs.
                </div>
              ) : null}
            </div>
          </section>

          {/* Timeline */}
          <section className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Recent actions
            </div>
            <div className="grid gap-2">
              {(data?.timeline ?? []).slice(0, 12).map((t) => (
                <div
                  key={`${t.iso}-${t.summary}`}
                  className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    {kindPill(t.kind)}
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatRelative(t.ts)}
                    </div>
                  </div>
                  <div className="mt-2 line-clamp-4 whitespace-pre-wrap text-zinc-700 dark:text-zinc-200">
                    {t.summary}
                  </div>
                </div>
              ))}
              {!data?.timeline?.length ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-white/40 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
                  No recent actions.
                </div>
              ) : null}
            </div>
          </section>

          {data?.source?.todo ? (
            <div className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              TODO: {data.source.todo}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </aside>
  );
}

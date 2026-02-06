"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type StatusPayload = {
  ok: boolean;
  live: {
    current: string;
    next: string;
    sinceMs: number | null;
    updatedAtMs: number | null;
    statusFile: string;
  };
  recent: Array<{
    ts: number;
    iso: string;
    kind: "event";
    summary: string;
  }>;
  details?: {
    sessions?: { totalRecent: number; active: number };
    cron?: { enabled: number; nextRunAtMs: number | null };
  };
  source?: {
    adapter: string;
  };
};

function formatRelative(ms: number | null): string {
  if (!ms) return "—";
  const delta = Date.now() - ms;
  const s = Math.max(0, Math.round(delta / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return `${h}h`;
}

function formatIn(ms: number | null | undefined): string {
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

function fmtTime(ms: number | null): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Vienna",
  }).format(new Date(ms));
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

  const headerMeta = useMemo(() => {
    const active = data?.details?.sessions?.active ?? 0;
    const cronEnabled = data?.details?.cron?.enabled ?? 0;
    return {
      sessionsLabel: active ? `${active} active` : "idle",
      cronLabel: cronEnabled ? `${cronEnabled} cron` : "no cron",
      nextCronIn: formatIn(data?.details?.cron?.nextRunAtMs),
    };
  }, [data?.details]);

  const current = data?.live?.current ?? "—";
  const next = data?.live?.next ?? "—";
  const sinceMs = data?.live?.sinceMs ?? null;
  const updatedAtMs = data?.live?.updatedAtMs ?? null;

  return (
    <aside className="h-[calc(100dvh-120px)] rounded-2xl border border-zinc-200/70 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold leading-tight">OpenClaw Live</div>
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {headerMeta.sessionsLabel} • {headerMeta.cronLabel}
            {headerMeta.nextCronIn !== "—" ? ` • next ${headerMeta.nextCronIn}` : ""}
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
          {/* NOW */}
          <section className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              NOW
            </div>

            <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="relative overflow-hidden">
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent",
                    "bg-[length:200%_100%] opacity-60 dark:via-zinc-950/30",
                    "animate-shimmer",
                  )}
                />

                <div className="relative">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Working on</div>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div className="min-w-0 text-base font-semibold leading-snug">
                      <span className="text-zinc-900 dark:text-zinc-50">{current}</span>
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-zinc-500 dark:text-zinc-400">
                      <div>since {formatRelative(sinceMs)}</div>
                      <div>{fmtTime(sinceMs)}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">Next:</span> {next}
                  </div>

                  <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    updated {formatRelative(updatedAtMs)} ago • {fmtTime(updatedAtMs)}
                  </div>

                  {error ? (
                    <div className="mt-2 text-xs text-rose-600 dark:text-rose-400">
                      Failed to load: {error}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* RECENT */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Recent
              </div>
              <details className="group">
                <summary className="cursor-pointer select-none text-[11px] text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                  Details
                </summary>
                <div className="mt-2 rounded-lg border border-zinc-200/70 bg-white/70 p-2 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
                  <div className="flex items-center justify-between gap-2">
                    <div>Sessions: {data?.details?.sessions?.active ?? 0} active</div>
                    <div className="text-zinc-500 dark:text-zinc-400">
                      (full list coming soon)
                    </div>
                  </div>
                  <div className="mt-1">
                    Cron: {data?.details?.cron?.enabled ?? 0} enabled • next {formatIn(data?.details?.cron?.nextRunAtMs)}
                  </div>
                </div>
              </details>
            </div>

            <div className="grid gap-2">
              {(data?.recent ?? []).slice(0, 10).map((t, idx) => (
                <div
                  key={`${t.iso}-${idx}`}
                  className="relative rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400/70 dark:bg-zinc-500" />
                        <div className="font-medium text-zinc-800 dark:text-zinc-200">{t.summary}</div>
                      </div>
                    </div>
                    <div className="shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatRelative(t.ts)}
                    </div>
                  </div>
                </div>
              ))}

              {!data?.recent?.length ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-white/40 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
                  No recent actions.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}

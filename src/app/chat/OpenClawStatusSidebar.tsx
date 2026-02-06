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
    <aside className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-foreground">OpenClaw Live</div>
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
          </div>
          <div className="text-xs text-foreground-tertiary">
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

      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-2">
          {/* NOW */}
          <section className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
              NOW
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="relative overflow-hidden">
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent",
                    "bg-[length:200%_100%] opacity-60",
                    "animate-shimmer"
                  )}
                />

                <div className="relative">
                  <div className="text-xs text-foreground-tertiary">Working on</div>
                  <div className="mt-1.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 text-sm font-semibold text-foreground">
                      {current}
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-foreground-tertiary">
                      <div>since {formatRelative(sinceMs)}</div>
                      <div>{fmtTime(sinceMs)}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-foreground-secondary">
                    <span className="font-medium text-foreground">Next:</span> {next}
                  </div>

                  <div className="mt-2 text-[11px] text-foreground-tertiary">
                    updated {formatRelative(updatedAtMs)} ago • {fmtTime(updatedAtMs)}
                  </div>

                  {error ? (
                    <div className="mt-2 text-xs text-destructive">
                      Failed to load: {error}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* RECENT */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
                Recent
              </div>
              <details className="group">
                <summary className="cursor-pointer select-none text-[11px] text-foreground-tertiary hover:text-foreground-secondary">
                  Details
                </summary>
                <div className="mt-2 rounded-lg border border-border bg-background p-2 text-[11px] text-foreground-secondary">
                  <div className="flex items-center justify-between gap-2">
                    <div>Sessions: {data?.details?.sessions?.active ?? 0} active</div>
                    <div className="text-foreground-tertiary">(full list coming soon)</div>
                  </div>
                  <div className="mt-1">
                    Cron: {data?.details?.cron?.enabled ?? 0} enabled • next{" "}
                    {formatIn(data?.details?.cron?.nextRunAtMs)}
                  </div>
                </div>
              </details>
            </div>

            <div className="space-y-2">
              {(data?.recent ?? []).slice(0, 10).map((t, idx) => (
                <div
                  key={`${t.iso}-${idx}`}
                  className="rounded-lg border border-border bg-background p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground-tertiary" />
                        <div className="font-medium text-foreground">{t.summary}</div>
                      </div>
                    </div>
                    <div className="shrink-0 text-[11px] text-foreground-tertiary">
                      {formatRelative(t.ts)}
                    </div>
                  </div>
                </div>
              ))}

              {!data?.recent?.length ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 p-3 text-xs text-foreground-tertiary">
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

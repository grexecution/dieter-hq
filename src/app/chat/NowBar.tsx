"use client";

import { useEffect, useState } from "react";

type Status = {
  ok: boolean;
  live: {
    current: string;
    why?: string;
    next: string;
    updatedAtMs: number | null;
    lastError?: string;
    tunnel?: { url?: string; ok?: boolean; checkedAtMs?: number | null };
  };
};

function relTime(ms: number | null): string {
  if (!ms) return "";
  const diff = Date.now() - ms;
  const s = Math.round(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

export function NowBar() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let stopped = false;

    const tick = async () => {
      try {
        const r = await fetch("/api/openclaw/status", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Status;
        if (!stopped) setStatus(data);
      } catch {
        // ignore
      }
    };

    void tick();
    const t = setInterval(tick, 10000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, []);

  const current = status?.live?.current ?? "—";
  const why = status?.live?.why ?? "—";
  const next = status?.live?.next ?? "—";
  const updated = relTime(status?.live?.updatedAtMs ?? null);
  const tunnel = status?.live?.tunnel;
  const tunnelOk = tunnel?.ok === true;
  const tunnelLabel = tunnel?.url ? new URL(tunnel.url).hostname : "tunnel";
  const tunnelChecked = relTime(tunnel?.checkedAtMs ?? null);
  const lastError = (status?.live?.lastError ?? "").trim();

  return (
    <div className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="truncate text-zinc-700 dark:text-zinc-300">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">NOW:</span> {current}
          </div>
          <div className="truncate text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">WHY:</span> {why}
          </div>
          <div className="truncate text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">NEXT:</span> {next}
          </div>
          {lastError ? (
            <div className="truncate text-red-600 dark:text-red-400">
              <span className="font-medium">ERR:</span> {lastError}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 text-right text-zinc-400 dark:text-zinc-500">
          <div>{updated}</div>
          <div className="flex items-center justify-end gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${tunnelOk ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className={tunnelOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
              {tunnelOk ? "ok" : "?"}
            </span>
          </div>
          <div className="text-[10px]">{tunnelLabel}</div>
        </div>
      </div>
    </div>
  );
}

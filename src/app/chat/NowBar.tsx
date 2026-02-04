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
    const t = setInterval(tick, 2500);
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
    <div className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 px-4 py-2 text-xs backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/60 dark:supports-[backdrop-filter]:bg-zinc-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="truncate">
            <span className="font-medium">NOW:</span> <span>{current}</span>
          </div>
          <div className="truncate text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">WHY:</span> <span>{why}</span>
          </div>
          <div className="truncate text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">NEXT:</span> <span>{next}</span>
          </div>
          {lastError ? (
            <div className="truncate text-rose-600 dark:text-rose-400">
              <span className="font-medium">ERR:</span> <span>{lastError}</span>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 text-right text-zinc-400">
          <div>{updated}</div>
          <div className={tunnelOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
            {tunnelOk ? "tunnel ok" : "tunnel?"}
          </div>
          <div className="text-[10px] text-zinc-400">{tunnelLabel}{tunnelChecked ? ` · ${tunnelChecked}` : ""}</div>
        </div>
      </div>
    </div>
  );
}

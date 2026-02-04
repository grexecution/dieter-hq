"use client";

import { useEffect, useState } from "react";

type Status = {
  ok: boolean;
  live: {
    current: string;
    why?: string;
    next: string;
    updatedAtMs: number | null;
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

  return (
    <div className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/90 px-4 py-2 text-xs backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
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
        </div>
        <div className="shrink-0 text-zinc-400">{updated}</div>
      </div>
    </div>
  );
}

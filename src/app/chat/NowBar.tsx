"use client";

import { useEffect, useState } from "react";

type Status = {
  ok: boolean;
  live: {
    current: string;
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
  const next = status?.live?.next ?? "—";
  const updated = relTime(status?.live?.updatedAtMs ?? null);

  return (
    <div className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/90 px-4 py-2 text-xs backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="font-medium">NOW:</span> <span className="truncate">{current}</span>
          <span className="mx-2 text-zinc-400">•</span>
          <span className="text-zinc-500 dark:text-zinc-400">NEXT: {next}</span>
        </div>
        <div className="shrink-0 text-zinc-400">{updated}</div>
      </div>
    </div>
  );
}

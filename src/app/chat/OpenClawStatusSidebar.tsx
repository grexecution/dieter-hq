"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Response from /api/agents/activity
type ActivityPayload = {
  ok: boolean;
  error?: string;
  agents: Array<{
    sessionKey: string;
    agentId: string;
    label: string;
    model: string;
    status: 'active' | 'idle' | 'error';
    workspace?: string;
    task?: string;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    runtimeMs: number;
    createdAt: string;
    updatedAt: string;
    isSubagent: boolean;
  }>;
  summary: {
    total: number;
    active: number;
    idle: number;
    error: number;
    totalTokens: number;
  };
  updatedAt?: string;
  cache?: {
    hit: boolean;
    ageMs: number | null;
  };
};

function formatRelative(ms: number | null | undefined): string {
  if (!ms) return "—";
  const delta = Date.now() - ms;
  const s = Math.max(0, Math.round(delta / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return `${h}h`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function OpenClawStatusSidebar({
  logoutAction,
}: {
  logoutAction: (formData: FormData) => void;
}) {
  const [data, setData] = useState<ActivityPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const r = await fetch("/api/agents/activity", { cache: "no-store" });
        if (!r.ok) throw new Error(`status_${r.status}`);
        const json = (await r.json()) as ActivityPayload;
        if (!cancelled) {
          setData(json);
          setError(json.ok ? null : (json.error || "Unknown error"));
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
    const active = data?.summary?.active ?? 0;
    const total = data?.summary?.total ?? 0;
    const isWorking = active > 0;
    const cacheAgeMs = data?.cache?.ageMs ?? null;
    
    return {
      sessionsLabel: isWorking ? `${active} working` : (total > 0 ? `${total} idle` : "no sessions"),
      isWorking,
      lastUpdate: formatRelative(cacheAgeMs ? Date.now() - cacheAgeMs : null),
      totalTokens: data?.summary?.totalTokens ?? 0,
    };
  }, [data]);

  const isWorking = headerMeta.isWorking;

  // Get active agents for display
  const activeAgents = useMemo(() => {
    if (!data?.agents) return [];
    return data.agents
      .filter(a => a.status === 'active')
      .slice(0, 3);
  }, [data?.agents]);

  // Get recent agents (idle but recent)
  const recentAgents = useMemo(() => {
    if (!data?.agents) return [];
    return data.agents
      .filter(a => a.status === 'idle')
      .slice(0, 5);
  }, [data?.agents]);

  return (
    <aside className={cn(
      "h-[calc(100dvh-100px)] rounded-2xl border p-4 shadow-sm backdrop-blur transition-all duration-500",
      isWorking 
        ? "border-amber-400/70 bg-amber-50/60 dark:border-amber-500/50 dark:bg-amber-950/20 shadow-amber-200/50 dark:shadow-amber-900/30" 
        : "border-zinc-200/70 bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/40"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className={cn(
              "text-sm font-semibold leading-tight transition-colors",
              isWorking && "text-amber-700 dark:text-amber-400"
            )}>
              {isWorking ? "🔥 Working" : "OpenClaw"}
            </div>
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full",
                isWorking ? "animate-ping bg-amber-500/50" : "animate-ping bg-emerald-500/50"
              )} />
              <span className={cn(
                "relative inline-flex h-2.5 w-2.5 rounded-full",
                isWorking ? "bg-amber-500" : "bg-emerald-500"
              )} />
            </span>
          </div>
          <div className={cn(
            "mt-0.5 text-xs transition-colors",
            isWorking ? "text-amber-600 dark:text-amber-400/80" : "text-zinc-500 dark:text-zinc-400"
          )}>
            {headerMeta.sessionsLabel} • {formatTokens(headerMeta.totalTokens)} tokens
          </div>
        </div>
        <form action={logoutAction}>
          <Button size="sm" variant="secondary" type="submit">
            Logout
          </Button>
        </form>
      </div>

      <Separator className="my-4" />

      <ScrollArea className="h-[calc(100dvh-200px)] pr-3">
        <div className="space-y-6">
          {/* Active Agents */}
          {activeAgents.length > 0 && (
            <section className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Active Now
              </div>

              <div className="grid gap-2">
                {activeAgents.map((agent) => (
                  <div
                    key={agent.sessionKey}
                    className="relative rounded-xl border border-amber-300/70 bg-amber-50/70 p-3 text-xs dark:border-amber-700 dark:bg-amber-950/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          <div className="font-medium text-amber-800 dark:text-amber-200">
                            {agent.label}
                          </div>
                        </div>
                        {agent.task && (
                          <div className="mt-1 text-amber-700/80 dark:text-amber-300/80 line-clamp-2">
                            {agent.task}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-[11px] text-amber-600 dark:text-amber-400">
                        {formatTokens(agent.tokens.total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Sessions */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Recent
              </div>
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {data?.cache?.ageMs ? `${Math.round(data.cache.ageMs / 1000)}s ago` : "—"}
              </div>
            </div>

            <div className="grid gap-2">
              {recentAgents.map((agent) => (
                <div
                  key={agent.sessionKey}
                  className="relative rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          agent.status === 'error' ? "bg-red-500" : "bg-zinc-400/70 dark:bg-zinc-500"
                        )} />
                        <div className="font-medium text-zinc-800 dark:text-zinc-200">
                          {agent.label}
                        </div>
                      </div>
                      {agent.task && (
                        <div className="mt-1 text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {agent.task}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {formatRelative(new Date(agent.updatedAt).getTime())}
                    </div>
                  </div>
                </div>
              ))}

              {recentAgents.length === 0 && !isWorking && (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-white/40 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
                  {error ? `Error: ${error}` : "No recent activity."}
                </div>
              )}
            </div>
          </section>

          {/* Stats */}
          {data?.summary && (
            <section className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Stats
              </div>
              <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-400">Sessions</div>
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">{data.summary.total}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-400">Active</div>
                    <div className={cn(
                      "font-medium",
                      data.summary.active > 0 ? "text-amber-600 dark:text-amber-400" : "text-zinc-800 dark:text-zinc-200"
                    )}>{data.summary.active}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-400">Total Tokens</div>
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">{formatTokens(data.summary.totalTokens)}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-400">Errors</div>
                    <div className={cn(
                      "font-medium",
                      data.summary.error > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-800 dark:text-zinc-200"
                    )}>{data.summary.error}</div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

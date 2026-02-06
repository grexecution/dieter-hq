"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Clock, Cpu, Hash, Loader2, RefreshCw, Skull, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

type SubagentSession = {
  key: string;
  model: string;
  totalTokens: number;
  inputTokens?: number;
  outputTokens?: number;
  updatedAt: string;
  createdAt?: string;
  label?: string;
  channel?: string;
  status?: string;
  runtimeMs?: number;
  isSubagent?: boolean;
};

type SessionsResponse = {
  ok: boolean;
  subagents: SubagentSession[];
  subagentCount: number;
  error?: string;
};

// ============================================
// Utilities
// ============================================

function formatRuntime(ms: number): string {
  if (ms < 1000) return "<1s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatTokens(tokens: number): string {
  if (tokens < 1000) return String(tokens);
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

function formatRelativeTime(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function extractModelName(model: string): string {
  // Shorten model names like "anthropic/claude-sonnet-4-20250514" -> "sonnet-4"
  if (model.includes("claude")) {
    const parts = model.split("/").pop()?.split("-") || [];
    const claudeIndex = parts.findIndex((p) => p === "claude");
    if (claudeIndex >= 0 && parts.length > claudeIndex + 1) {
      return parts.slice(claudeIndex + 1, claudeIndex + 3).join("-");
    }
  }
  // Fallback: just the last part after /
  return model.split("/").pop() || model;
}

function getStatusColor(session: SubagentSession): string {
  const lastUpdated = new Date(session.updatedAt).getTime();
  const now = Date.now();
  const ageMs = now - lastUpdated;
  
  // Active: updated within last 30s
  if (ageMs < 30000) return "bg-emerald-500";
  // Recent: updated within last 2min
  if (ageMs < 120000) return "bg-yellow-500";
  // Stale: older than 2min
  return "bg-zinc-400";
}

function getStatusLabel(session: SubagentSession): string {
  const lastUpdated = new Date(session.updatedAt).getTime();
  const now = Date.now();
  const ageMs = now - lastUpdated;
  
  if (ageMs < 30000) return "active";
  if (ageMs < 120000) return "idle";
  return "stale";
}

// ============================================
// SubagentCard Component
// ============================================

interface SubagentCardProps {
  session: SubagentSession;
  onKill: (sessionKey: string) => void;
  isKilling: boolean;
}

function SubagentCard({ session, onKill, isKilling }: SubagentCardProps) {
  const statusColor = getStatusColor(session);
  const statusLabel = getStatusLabel(session);
  const modelName = extractModelName(session.model);
  const runtime = session.runtimeMs ? formatRuntime(session.runtimeMs) : "—";
  
  return (
    <div className="group relative rounded-xl border border-zinc-200/70 bg-white/70 p-3 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700">
      {/* Status indicator */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", statusColor)} />
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {statusLabel}
        </span>
      </div>

      {/* Header: Label & Model */}
      <div className="pr-16">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {session.label || "subagent"}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <Cpu className="h-3 w-3" />
          <span>{modelName}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300">
        <div className="flex items-center gap-1" title="Total tokens">
          <Zap className="h-3 w-3 text-amber-500" />
          <span>{formatTokens(session.totalTokens)}</span>
        </div>
        <div className="flex items-center gap-1" title="Runtime">
          <Clock className="h-3 w-3 text-blue-500" />
          <span>{runtime}</span>
        </div>
        <div className="flex items-center gap-1" title="Last update">
          <RefreshCw className="h-3 w-3 text-zinc-400" />
          <span>{formatRelativeTime(session.updatedAt)}</span>
        </div>
      </div>

      {/* Session key (collapsed) */}
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          Session ID
        </summary>
        <code className="mt-1 block truncate rounded bg-zinc-100 px-2 py-1 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {session.key}
        </code>
      </details>

      {/* Kill button */}
      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
          onClick={() => onKill(session.key)}
          disabled={isKilling}
        >
          {isKilling ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Skull className="h-3 w-3" />
          )}
          Kill
        </Button>
      </div>
    </div>
  );
}

// ============================================
// SubagentPanel Component
// ============================================

interface SubagentPanelProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SubagentPanel({ className, collapsed = false, onToggleCollapse }: SubagentPanelProps) {
  const [sessions, setSessions] = useState<SubagentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [killingIds, setKillingIds] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/openclaw/sessions", { cache: "no-store" });
      const data: SessionsResponse = await response.json();
      
      if (!data.ok) {
        setError(data.error || "Failed to fetch sessions");
        return;
      }
      
      setSessions(data.subagents || []);
      setError(null);
      setLastRefresh(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Kill a session
  const killSession = useCallback(async (sessionKey: string) => {
    setKillingIds((prev) => new Set(prev).add(sessionKey));
    
    try {
      const response = await fetch(
        `/api/openclaw/sessions/${encodeURIComponent(sessionKey)}/kill`,
        { method: "POST" }
      );
      const data = await response.json();
      
      if (data.ok) {
        // Remove from list immediately
        setSessions((prev) => prev.filter((s) => s.key !== sessionKey));
      } else {
        console.error("Failed to kill session:", data.error);
      }
    } catch (err) {
      console.error("Kill request failed:", err);
    } finally {
      setKillingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionKey);
        return next;
      });
    }
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    void fetchSessions();
    const interval = setInterval(() => void fetchSessions(), 5000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // Collapsed view
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/60 shadow-sm backdrop-blur transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900",
          className
        )}
        title={`${sessions.length} subagents`}
      >
        <div className="relative">
          <Bot className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          {sessions.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              {sessions.length}
            </span>
          )}
        </div>
      </button>
    );
  }

  const activeCount = sessions.filter((s) => getStatusLabel(s) === "active").length;

  return (
    <aside
      className={cn(
        "flex h-full flex-col rounded-2xl border border-zinc-200/70 bg-white/60 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Subagents
          </span>
          {sessions.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {activeCount}/{sessions.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => void fetchSessions()}
            title="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onToggleCollapse}
              title="Collapse"
            >
              <Hash className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-3 py-3">
        {loading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="mt-2 text-xs">Loading subagents...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
            <div className="font-medium">Connection Error</div>
            <div className="mt-1 opacity-80">{error}</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500 dark:text-zinc-400">
            <Bot className="h-8 w-8 opacity-50" />
            <div className="mt-2 text-xs font-medium">No active subagents</div>
            <div className="mt-1 text-[10px] opacity-70">
              Subagents will appear here when spawned
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <SubagentCard
                key={session.key}
                session={session}
                onKill={killSession}
                isKilling={killingIds.has(session.key)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-zinc-200/70 px-4 py-2 dark:border-zinc-800">
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
          Last refresh: {new Date(lastRefresh).toLocaleTimeString("de-AT")} • Auto-refresh: 5s
        </div>
      </div>
    </aside>
  );
}

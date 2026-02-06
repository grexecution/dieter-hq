"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Clock,
  Cpu,
  Hash,
  Loader2,
  RefreshCw,
  Skull,
  Zap,
} from "lucide-react";

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
  if (model.includes("claude")) {
    const parts = model.split("/").pop()?.split("-") || [];
    const claudeIndex = parts.findIndex((p) => p === "claude");
    if (claudeIndex >= 0 && parts.length > claudeIndex + 1) {
      return parts.slice(claudeIndex + 1, claudeIndex + 3).join("-");
    }
  }
  return model.split("/").pop() || model;
}

function getStatusColor(session: SubagentSession): string {
  const lastUpdated = new Date(session.updatedAt).getTime();
  const now = Date.now();
  const ageMs = now - lastUpdated;

  if (ageMs < 30000) return "bg-success";
  if (ageMs < 120000) return "bg-warning";
  return "bg-muted-foreground";
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
// SubagentCard
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
    <div className="group relative rounded-lg border border-border bg-background p-3 transition-all hover:border-primary/30 hover:shadow-sm">
      {/* Status */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", statusColor)} />
        <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-tertiary">
          {statusLabel}
        </span>
      </div>

      {/* Header */}
      <div className="pr-16">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-foreground-tertiary" />
          <span className="truncate text-sm font-semibold text-foreground">
            {session.label || "subagent"}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-foreground-tertiary">
          <Cpu className="h-3 w-3" />
          <span>{modelName}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-foreground-secondary">
        <div className="flex items-center gap-1" title="Total tokens">
          <Zap className="h-3 w-3 text-warning" />
          <span>{formatTokens(session.totalTokens)}</span>
        </div>
        <div className="flex items-center gap-1" title="Runtime">
          <Clock className="h-3 w-3 text-info" />
          <span>{runtime}</span>
        </div>
        <div className="flex items-center gap-1" title="Last update">
          <RefreshCw className="h-3 w-3 text-foreground-tertiary" />
          <span>{formatRelativeTime(session.updatedAt)}</span>
        </div>
      </div>

      {/* Session ID */}
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] text-foreground-tertiary hover:text-foreground-secondary">
          Session ID
        </summary>
        <code className="mt-1 block truncate rounded bg-muted px-2 py-1 text-[10px] text-foreground-secondary">
          {session.key}
        </code>
      </details>

      {/* Kill */}
      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
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
// SubagentPanel
// ============================================

interface SubagentPanelProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SubagentPanel({
  className,
  collapsed = false,
  onToggleCollapse,
}: SubagentPanelProps) {
  const [sessions, setSessions] = useState<SubagentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [killingIds, setKillingIds] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/openclaw/sessions", {
        cache: "no-store",
      });
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

  const killSession = useCallback(async (sessionKey: string) => {
    setKillingIds((prev) => new Set(prev).add(sessionKey));

    try {
      const response = await fetch(
        `/api/openclaw/sessions/${encodeURIComponent(sessionKey)}/kill`,
        { method: "POST" }
      );
      const data = await response.json();

      if (data.ok) {
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
          "flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-all hover:bg-muted",
          className
        )}
        title={`${sessions.length} subagents`}
      >
        <div className="relative">
          <Bot className="h-5 w-5 text-foreground-secondary" />
          {sessions.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-[10px] font-bold text-white">
              {sessions.length}
            </span>
          )}
        </div>
      </button>
    );
  }

  const activeCount = sessions.filter(
    (s) => getStatusLabel(s) === "active"
  ).length;

  return (
    <aside
      className={cn(
        "flex w-72 flex-col rounded-xl border border-border bg-card shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-foreground-secondary" />
          <span className="text-sm font-semibold text-foreground">
            Subagents
          </span>
          {sessions.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {activeCount}/{sessions.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => void fetchSessions()}
            title="Refresh"
          >
            <RefreshCw
              className={cn("h-4 w-4", loading && "animate-spin")}
            />
          </Button>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleCollapse}
              title="Collapse"
            >
              <Hash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-3 py-3">
        {loading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-foreground-tertiary">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="mt-2 text-xs">Loading subagents...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <div className="font-medium">Connection Error</div>
            <div className="mt-1 opacity-80">{error}</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-foreground-tertiary">
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
      <div className="border-t border-border px-4 py-2">
        <div className="text-[10px] text-foreground-tertiary">
          Last refresh: {new Date(lastRefresh).toLocaleTimeString("de-AT")} •
          Auto-refresh: 5s
        </div>
      </div>
    </aside>
  );
}

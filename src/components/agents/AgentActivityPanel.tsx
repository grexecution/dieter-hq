"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Zap,
  Clock,
  Cpu,
  Activity,
  XCircle
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentStatusBadge, AgentStatusDot, type AgentStatusType } from "./AgentStatusBadge";

// ============================================
// Types
// ============================================

export type AgentActivityItem = {
  sessionKey: string;
  agentId: string;
  label: string;
  model: string;
  status: AgentStatusType;
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
  parentSession?: string;
};

type ActivityResponse = {
  ok: boolean;
  agents: AgentActivityItem[];
  summary: {
    total: number;
    active: number;
    idle: number;
    error: number;
    totalTokens: number;
  };
  error?: string;
};

// ============================================
// Utilities
// ============================================

function formatTokens(tokens: number): string {
  if (tokens < 1000) return String(tokens);
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

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

function formatRelativeTime(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 5) return "jetzt";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
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

// ============================================
// Agent Card Component
// ============================================

interface AgentCardProps {
  agent: AgentActivityItem;
  expanded: boolean;
  onToggle: () => void;
}

function AgentCard({ agent, expanded, onToggle }: AgentCardProps) {
  const modelName = extractModelName(agent.model);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border transition-all duration-200",
        "bg-white/60 backdrop-blur-sm dark:bg-zinc-900/60",
        agent.status === "active"
          ? "border-emerald-200/70 dark:border-emerald-800/50"
          : agent.status === "error"
          ? "border-red-200/70 dark:border-red-800/50"
          : "border-zinc-200/70 dark:border-zinc-800"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <AgentStatusDot status={agent.status} size="md" />
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {agent.label}
              </span>
              {agent.isSubagent && (
                <span className="shrink-0 rounded bg-indigo-100 px-1 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  SUB
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Cpu className="h-3 w-3" />
              <span>{modelName}</span>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span>{formatRelativeTime(agent.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>{formatTokens(agent.tokens.total)}</span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-200/50 px-3 pb-3 pt-2 dark:border-zinc-800/50">
              {/* Task */}
              {agent.task && (
                <div className="mb-2 text-xs text-zinc-600 dark:text-zinc-300">
                  {agent.task}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-lg bg-zinc-100/80 px-2 py-1.5 dark:bg-zinc-800/50">
                  <div className="text-zinc-500 dark:text-zinc-400">Input</div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatTokens(agent.tokens.input)}
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-100/80 px-2 py-1.5 dark:bg-zinc-800/50">
                  <div className="text-zinc-500 dark:text-zinc-400">Output</div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatTokens(agent.tokens.output)}
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-100/80 px-2 py-1.5 dark:bg-zinc-800/50">
                  <div className="text-zinc-500 dark:text-zinc-400">Laufzeit</div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatRuntime(agent.runtimeMs)}
                  </div>
                </div>
              </div>

              {/* Workspace */}
              {agent.workspace && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <Activity className="h-3 w-3" />
                  <span>Workspace: {agent.workspace}</span>
                </div>
              )}

              {/* Session Key */}
              <details className="mt-2">
                <summary className="cursor-pointer text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  Session ID
                </summary>
                <code className="mt-1 block truncate rounded bg-zinc-100 px-2 py-1 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {agent.sessionKey}
                </code>
              </details>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Summary Bar
// ============================================

interface SummaryBarProps {
  summary: ActivityResponse["summary"];
}

function SummaryBar({ summary }: SummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <AgentStatusDot status="active" size="sm" />
        <span>{summary.active} active</span>
      </div>
      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
        <AgentStatusDot status="idle" size="sm" />
        <span>{summary.idle} idle</span>
      </div>
      {summary.error > 0 && (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <AgentStatusDot status="error" size="sm" />
          <span>{summary.error} error</span>
        </div>
      )}
      <div className="ml-auto flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <Zap className="h-3 w-3" />
        <span>{formatTokens(summary.totalTokens)} tokens</span>
      </div>
    </div>
  );
}

// ============================================
// Main Panel Component
// ============================================

export interface AgentActivityPanelProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  pollIntervalMs?: number;
}

export function AgentActivityPanel({
  className,
  collapsed = false,
  onToggleCollapse,
  pollIntervalMs = 15000,
}: AgentActivityPanelProps) {
  const [agents, setAgents] = useState<AgentActivityItem[]>([]);
  const [summary, setSummary] = useState<ActivityResponse["summary"]>({
    total: 0,
    active: 0,
    idle: 0,
    error: 0,
    totalTokens: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Fetch activity data
  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch("/api/agents/activity", { cache: "no-store" });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data: ActivityResponse = await response.json();

      if (!data.ok) {
        setError(data.error || "Failed to fetch activity");
        return;
      }

      setAgents(data.agents || []);
      setSummary(data.summary);
      setError(null);
      setLastRefresh(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle expanded state
  const toggleExpanded = useCallback((sessionKey: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionKey)) {
        next.delete(sessionKey);
      } else {
        next.add(sessionKey);
      }
      return next;
    });
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    void fetchActivity();
    const interval = setInterval(() => void fetchActivity(), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchActivity, pollIntervalMs]);

  // Collapsed mini view
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          "border border-zinc-200/70 bg-white/60 backdrop-blur-sm shadow-sm",
          "transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900",
          className
        )}
        title={`${summary.active} active agents`}
      >
        <div className="relative">
          <Bot className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          {summary.active > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
            >
              {summary.active}
            </motion.span>
          )}
        </div>
      </button>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col rounded-2xl",
        "border border-zinc-200/70 bg-white/60 backdrop-blur-sm shadow-sm",
        "dark:border-zinc-800 dark:bg-zinc-950/40",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Agent Activity
          </span>
          {summary.total > 0 && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {summary.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => void fetchActivity()}
            title="Aktualisieren"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onToggleCollapse}
              title="Minimieren"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      {!loading && !error && agents.length > 0 && (
        <div className="border-b border-zinc-200/50 px-4 py-2 dark:border-zinc-800/50">
          <SummaryBar summary={summary} />
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1 px-3 py-3">
        {loading && agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="mt-2 text-xs">Lade Agents...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950/50">
            <XCircle className="h-5 w-5 text-red-500" />
            <div className="text-xs text-red-700 dark:text-red-300">{error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchActivity()}
              className="mt-1 h-7 text-xs"
            >
              Erneut versuchen
            </Button>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 dark:text-zinc-400">
            <Bot className="h-8 w-8 opacity-50" />
            <div className="mt-3 text-sm font-medium">Keine Agents aktiv</div>
            <div className="mt-1 text-xs opacity-70">
              Agents erscheinen hier wenn sie arbeiten
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.sessionKey}
                  agent={agent}
                  expanded={expandedIds.has(agent.sessionKey)}
                  onToggle={() => toggleExpanded(agent.sessionKey)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-zinc-200/50 px-4 py-2 dark:border-zinc-800/50">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
          <span>
            Aktualisiert: {new Date(lastRefresh).toLocaleTimeString("de-AT")}
          </span>
          <span>Auto-refresh: {pollIntervalMs / 1000}s</span>
        </div>
      </div>
    </aside>
  );
}

export default AgentActivityPanel;

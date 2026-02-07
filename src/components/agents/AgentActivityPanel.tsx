"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  XCircle,
  Brain
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentStatusDot, type AgentStatusType } from "./AgentStatusBadge";

// ============================================
// Types (matching /api/agents/activity response)
// ============================================

type AgentSession = {
  key: string;
  workspace?: string;
  updatedAt: string;
};

type SubAgent = {
  label: string;
  status: string;
  lastMessage?: string;
};

type Agent = {
  id: string;
  name: string;
  status: AgentStatusType;
  lastActiveAt: string;
  lastMessage?: string;
  model: string;
  tokens: { used: number; total: number };
  sessions: AgentSession[];
  subAgents?: SubAgent[];
};

type ActivityResponse = {
  ok: boolean;
  agents: Agent[];
  updatedAt?: string;
  cache?: { hit: boolean; ageMs: number };
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
// Sub-Agent Card Component
// ============================================

interface SubAgentItemProps {
  subAgent: SubAgent;
}

function SubAgentItem({ subAgent }: SubAgentItemProps) {
  const status = (subAgent.status === "active" ? "active" : 
                  subAgent.status === "error" ? "error" : "idle") as AgentStatusType;
  
  return (
    <div className="flex items-center gap-2 rounded-lg bg-zinc-50/80 px-2 py-1.5 dark:bg-zinc-800/50">
      <AgentStatusDot status={status} size="sm" />
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {subAgent.label}
        </span>
        {subAgent.lastMessage && (
          <div className="truncate text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400">
            {subAgent.lastMessage.slice(0, 60)}...
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Agent Card Component
// ============================================

interface AgentCardProps {
  agent: Agent;
  expanded: boolean;
  onToggle: () => void;
}

function AgentCard({ agent, expanded, onToggle }: AgentCardProps) {
  const modelName = extractModelName(agent.model);
  const subAgentCount = agent.subAgents?.length || 0;
  const sessionCount = agent.sessions.length;

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
                {agent.name}
              </span>
              {subAgentCount > 0 && (
                <span className="shrink-0 rounded bg-indigo-100 px-1 py-0.5 text-[10px] md:text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  +{subAgentCount} sub
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400">
              <Cpu className="h-3 w-3" />
              <span>{modelName}</span>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span>{formatRelativeTime(agent.lastActiveAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>{formatTokens(agent.tokens.used)}</span>
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
            <div className="border-t border-zinc-200/50 px-3 pb-3 pt-2 dark:border-zinc-800/50 space-y-3">
              {/* Last Message */}
              {agent.lastMessage && (
                <div className="text-xs text-zinc-600 dark:text-zinc-300">
                  <span className="text-zinc-400 dark:text-zinc-500">Letzte Nachricht: </span>
                  {agent.lastMessage.slice(0, 100)}{agent.lastMessage.length > 100 && "..."}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-[11px] md:text-xs">
                <div className="rounded-lg bg-zinc-100/80 px-2 py-1.5 dark:bg-zinc-800/50">
                  <div className="text-zinc-500 dark:text-zinc-400">Tokens</div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatTokens(agent.tokens.used)} / {formatTokens(agent.tokens.total)}
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-100/80 px-2 py-1.5 dark:bg-zinc-800/50">
                  <div className="text-zinc-500 dark:text-zinc-400">Sessions</div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    {sessionCount}
                  </div>
                </div>
              </div>

              {/* Sub-Agents */}
              {agent.subAgents && agent.subAgents.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400">
                    <Brain className="h-3 w-3" />
                    <span>Sub-Agents ({agent.subAgents.length})</span>
                  </div>
                  <div className="space-y-1">
                    {agent.subAgents.map((sub, idx) => (
                      <SubAgentItem key={idx} subAgent={sub} />
                    ))}
                  </div>
                </div>
              )}

              {/* Sessions (collapsed) */}
              {sessionCount > 0 && (
                <details className="text-[11px] md:text-xs">
                  <summary className="cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    Sessions ({sessionCount})
                  </summary>
                  <div className="mt-1 space-y-1">
                    {agent.sessions.slice(0, 5).map((session) => (
                      <div 
                        key={session.key}
                        className="flex items-center justify-between rounded bg-zinc-100/80 px-2 py-1 dark:bg-zinc-800/50"
                      >
                        <code className="truncate text-[10px] md:text-xs text-zinc-600 dark:text-zinc-400 max-w-[150px] md:max-w-[200px]">
                          {session.key.split(":").pop()}
                        </code>
                        {session.workspace && (
                          <span className="shrink-0 text-[10px] md:text-xs text-indigo-600 dark:text-indigo-400">
                            {session.workspace}
                          </span>
                        )}
                      </div>
                    ))}
                    {sessionCount > 5 && (
                      <div className="text-center text-zinc-400">
                        +{sessionCount - 5} mehr
                      </div>
                    )}
                  </div>
                </details>
              )}
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
  agents: Agent[];
}

function SummaryBar({ agents }: SummaryBarProps) {
  const summary = useMemo(() => {
    return agents.reduce(
      (acc, agent) => ({
        active: acc.active + (agent.status === "active" ? 1 : 0),
        idle: acc.idle + (agent.status === "idle" ? 1 : 0),
        error: acc.error + (agent.status === "error" ? 1 : 0),
        totalTokens: acc.totalTokens + agent.tokens.used,
      }),
      { active: 0, idle: 0, error: 0, totalTokens: 0 }
    );
  }, [agents]);

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
        <span>{formatTokens(summary.totalTokens)}</span>
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Calculate summary
  const activeCount = useMemo(() => 
    agents.filter(a => a.status === "active").length
  , [agents]);

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
      setError(null);
      setLastRefresh(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle expanded state
  const toggleExpanded = useCallback((agentId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
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
        title={`${activeCount} active agents`}
      >
        <div className="relative">
          <Bot className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          {activeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] md:text-xs font-bold text-white"
            >
              {activeCount}
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
          {agents.length > 0 && (
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] md:text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {agents.length}
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
          <SummaryBar agents={agents} />
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
                  key={agent.id}
                  agent={agent}
                  expanded={expandedIds.has(agent.id)}
                  onToggle={() => toggleExpanded(agent.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-zinc-200/50 px-4 py-2 dark:border-zinc-800/50">
        <div className="flex items-center justify-between text-[10px] md:text-xs text-zinc-400 dark:text-zinc-500">
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

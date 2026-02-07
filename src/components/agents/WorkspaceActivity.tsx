"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderGit2, 
  ChevronDown, 
  ChevronRight,
  Bot,
  Zap,
  Clock,
  RefreshCw
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AgentStatusDot, type AgentStatusType } from "./AgentStatusBadge";

// ============================================
// Types
// ============================================

export type WorkspaceAgent = {
  sessionKey: string;
  label: string;
  model: string;
  status: AgentStatusType;
  task?: string;
  tokens: number;
  runtimeMs: number;
  updatedAt: string;
  isSubagent: boolean;
};

export type WorkspaceGroup = {
  workspaceId: string;
  workspaceName: string;
  projectPath?: string;
  agents: WorkspaceAgent[];
  totalTokens: number;
  activeCount: number;
};

type WorkspaceActivityResponse = {
  ok: boolean;
  workspaces: WorkspaceGroup[];
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
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

// ============================================
// Agent Row Component
// ============================================

interface AgentRowProps {
  agent: WorkspaceAgent;
}

function AgentRow({ agent }: AgentRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
        "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50"
      )}
    >
      <AgentStatusDot status={agent.status} size="sm" />
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {agent.label}
          </span>
          {agent.isSubagent && (
            <span className="shrink-0 rounded bg-indigo-100/80 px-1 py-0.5 text-[9px] font-medium text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
              SUB
            </span>
          )}
        </div>
        {agent.task && (
          <div className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
            {agent.task}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-0.5">
          <Zap className="h-2.5 w-2.5 text-amber-500" />
          {formatTokens(agent.tokens)}
        </span>
        <span className="flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {formatRuntime(agent.runtimeMs)}
        </span>
      </div>
    </motion.div>
  );
}

// ============================================
// Workspace Group Component
// ============================================

interface WorkspaceGroupCardProps {
  workspace: WorkspaceGroup;
  defaultExpanded?: boolean;
}

function WorkspaceGroupCard({ workspace, defaultExpanded = false }: WorkspaceGroupCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        "bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50",
        workspace.activeCount > 0
          ? "border-emerald-200/60 dark:border-emerald-800/40"
          : "border-zinc-200/60 dark:border-zinc-800/60"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 p-2.5 text-left"
      >
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          workspace.activeCount > 0
            ? "bg-emerald-100 dark:bg-emerald-900/50"
            : "bg-zinc-100 dark:bg-zinc-800"
        )}>
          <FolderGit2 className={cn(
            "h-4 w-4",
            workspace.activeCount > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-zinc-500 dark:text-zinc-400"
          )} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {workspace.workspaceName}
            </span>
            <span className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              workspace.activeCount > 0
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            )}>
              {workspace.agents.length} agent{workspace.agents.length !== 1 ? "s" : ""}
            </span>
          </div>
          {workspace.projectPath && (
            <div className="truncate text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              {workspace.projectPath}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Zap className="h-3 w-3 text-amber-500" />
            {formatTokens(workspace.totalTokens)}
          </span>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Agents List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-200/50 px-2 pb-2 pt-1 dark:border-zinc-800/50">
              {workspace.agents.length > 0 ? (
                <div className="space-y-0.5">
                  {workspace.agents.map((agent) => (
                    <AgentRow key={agent.sessionKey} agent={agent} />
                  ))}
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-zinc-500">
                  Keine Agents in diesem Workspace
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

interface WorkspaceActivityProps {
  className?: string;
  pollIntervalMs?: number;
  showHeader?: boolean;
}

export function WorkspaceActivity({
  className,
  pollIntervalMs = 15000,
  showHeader = true,
}: WorkspaceActivityProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workspace activity
  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch("/api/agents/activity?groupBy=workspace", { 
        cache: "no-store" 
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: WorkspaceActivityResponse = await response.json();

      if (!data.ok) {
        setError(data.error || "Failed to fetch workspaces");
        return;
      }

      setWorkspaces(data.workspaces || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling
  useEffect(() => {
    void fetchWorkspaces();
    const interval = setInterval(() => void fetchWorkspaces(), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchWorkspaces, pollIntervalMs]);

  // Summary
  const summary = useMemo(() => {
    return workspaces.reduce(
      (acc, ws) => ({
        totalAgents: acc.totalAgents + ws.agents.length,
        activeAgents: acc.activeAgents + ws.activeCount,
        totalTokens: acc.totalTokens + ws.totalTokens,
      }),
      { totalAgents: 0, activeAgents: 0, totalTokens: 0 }
    );
  }, [workspaces]);

  if (loading && workspaces.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-6", className)}>
        <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs text-red-700",
        "dark:border-red-800 dark:bg-red-950/50 dark:text-red-300",
        className
      )}>
        {error}
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-8 text-center",
        className
      )}>
        <FolderGit2 className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Keine Workspace-Aktivität
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showHeader && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Workspaces
            </span>
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {workspaces.length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              {summary.activeAgents}/{summary.totalAgents}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              {formatTokens(summary.totalTokens)}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {workspaces.map((workspace) => (
          <WorkspaceGroupCard
            key={workspace.workspaceId}
            workspace={workspace}
            defaultExpanded={workspace.activeCount > 0}
          />
        ))}
      </div>
    </div>
  );
}

export default WorkspaceActivity;

"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Brain, 
  Search, 
  PenLine, 
  AlertCircle, 
  CheckCircle2, 
  Moon,
  Users,
  Cpu,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveAgentStatus } from "@/app/api/agents/live-status/route";

// Agent activity states - what Dieter is currently doing
export type AgentActivityState = 
  | "idle"           // Bereit, wartet auf Input
  | "thinking"       // Verarbeitet die Anfrage
  | "searching"      // Sucht/Tool calls
  | "typing"         // Schreibt Antwort (streaming)
  | "stuck"          // Fehler/Timeout
  | "sent"           // Nachricht gerade abgesendet
  | "sleeping"       // Inaktiv/Offline
  | "subagents";     // Subagents arbeiten

interface StatusBarProps {
  agentActivity?: AgentActivityState;
  threadId?: string;
  className?: string;
}

// Activity display config
const ACTIVITY_CONFIG: Record<AgentActivityState, {
  icon: typeof Loader2;
  text: string;
  color: string;
  dotColor: string;
  animate?: boolean;
  hidden?: boolean;
}> = {
  idle: {
    icon: CheckCircle2,
    text: "Bereit",
    color: "text-emerald-500",
    dotColor: "bg-emerald-500",
  },
  thinking: {
    icon: Brain,
    text: "Dieter denkt...",
    color: "text-amber-500",
    dotColor: "bg-amber-500",
    animate: true,
  },
  searching: {
    icon: Search,
    text: "Dieter sucht...",
    color: "text-blue-500",
    dotColor: "bg-blue-500",
    animate: true,
  },
  typing: {
    icon: PenLine,
    text: "Dieter schreibt...",
    color: "text-indigo-500",
    dotColor: "bg-indigo-500",
    animate: true,
  },
  stuck: {
    icon: AlertCircle,
    text: "Stecken geblieben",
    color: "text-red-500",
    dotColor: "bg-red-500",
  },
  sent: {
    icon: CheckCircle2,
    text: "Gesendet",
    color: "text-emerald-500",
    dotColor: "bg-emerald-500",
    hidden: true,
  },
  sleeping: {
    icon: Moon,
    text: "Offline",
    color: "text-zinc-400",
    dotColor: "bg-zinc-400",
  },
  subagents: {
    icon: Users,
    text: "Subagents arbeiten...",
    color: "text-purple-500",
    dotColor: "bg-purple-500",
    animate: true,
  },
};

export function StatusBar({ 
  agentActivity = "idle", 
  threadId = "dieterhq",
  className 
}: StatusBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveAgentStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Poll live status from Gateway
  const fetchLiveStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/live-status?thread=${threadId}`);
      if (response.ok) {
        const data = await response.json() as LiveAgentStatus;
        setLiveStatus(data);
      }
    } catch (error) {
      console.error("[StatusBar] Failed to fetch live status:", error);
    }
  }, [threadId]);

  useEffect(() => {
    // Initial fetch
    fetchLiveStatus();

    // Poll every 3 seconds
    const interval = setInterval(() => {
      if (isPolling) {
        fetchLiveStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchLiveStatus, isPolling]);

  // Determine effective activity based on live status and passed prop
  const getEffectiveActivity = (): AgentActivityState => {
    // If we have explicit activity from props (like "typing" during stream), use it
    if (agentActivity !== "idle") {
      return agentActivity;
    }

    // Check live status
    if (liveStatus?.status === "stuck") return "stuck";
    if (liveStatus?.status === "working") return "thinking";
    if (liveStatus?.status === "subagents-working") return "subagents";
    
    return "idle";
  };

  const effectiveActivity = getEffectiveActivity();
  const config = ACTIVITY_CONFIG[effectiveActivity];
  const Icon = config.icon;

  // Don't render if hidden
  if (config.hidden) {
    return null;
  }

  // Format time ago
  const formatTimeAgo = (ms: number): string => {
    if (ms < 1000) return "jetzt";
    if (ms < 60000) return `vor ${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `vor ${Math.floor(ms / 60000)}m`;
    return `vor ${Math.floor(ms / 3600000)}h`;
  };

  // Format tokens
  const formatTokens = (tokens: number): string => {
    if (tokens < 1000) return String(tokens);
    return `${Math.floor(tokens / 1000)}k`;
  };

  return (
    <div className={cn(
      "border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm",
      className
    )}>
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-[36px] md:min-h-[40px] w-full items-center justify-between px-3 md:px-5 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {/* Left: Activity indicator */}
        <div className="flex items-center gap-2.5 text-xs md:text-sm leading-none">
          {/* Animated dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {config.animate && (
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                config.dotColor
              )} />
            )}
            <span className={cn(
              "relative inline-flex h-2.5 w-2.5 rounded-full",
              config.dotColor
            )} />
          </span>

          {/* Status text */}
          <span className={cn("font-medium", config.color)}>
            {config.text}
          </span>

          {/* Subagent count badge */}
          {liveStatus && liveStatus.subagents.length > 0 && effectiveActivity !== "subagents" && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-medium">
              <Users className="h-2.5 w-2.5" />
              {liveStatus.subagents.length}
            </span>
          )}

          {/* Subagent labels when expanded in title */}
          {effectiveActivity === "subagents" && liveStatus && liveStatus.subagents.length > 0 && (
            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] truncate max-w-[150px]">
              {liveStatus.subagents.slice(0, 2).map(s => s.label).join(", ")}
              {liveStatus.subagents.length > 2 && ` +${liveStatus.subagents.length - 2}`}
            </span>
          )}
        </div>

        {/* Right: Expand button */}
        <div className="flex items-center gap-2">
          {/* Token usage indicator (if available) */}
          {liveStatus?.mainSession && (
            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              {formatTokens(liveStatus.mainSession.tokens)}/{formatTokens(liveStatus.mainSession.maxTokens)}
            </span>
          )}
          
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 md:px-5 pb-3 space-y-3 text-xs border-t border-zinc-200/50 dark:border-zinc-700/50">
          {/* Main session info */}
          {liveStatus?.mainSession && (
            <div className="pt-3">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
                <Cpu className="h-3.5 w-3.5" />
                <span className="font-medium">Haupt-Session</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Model:</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-300">
                    {liveStatus.mainSession.model.replace("claude-", "")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Tokens:</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-300">
                    {formatTokens(liveStatus.mainSession.tokens)} / {formatTokens(liveStatus.mainSession.maxTokens)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Aktiv:</span>
                  <span className={cn(
                    "font-medium",
                    liveStatus.mainSession.isActive ? "text-emerald-500" : "text-zinc-400"
                  )}>
                    {liveStatus.mainSession.isActive ? "Ja" : formatTimeAgo(liveStatus.mainSession.lastActiveMs)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Context:</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-300">
                    {Math.round((liveStatus.mainSession.tokens / liveStatus.mainSession.maxTokens) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Subagents */}
          {liveStatus && liveStatus.subagents.length > 0 && (
            <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium">Aktive Subagents ({liveStatus.subagents.length})</span>
              </div>
              <div className="space-y-1.5">
                {liveStatus.subagents.map((agent) => (
                  <div 
                    key={agent.key}
                    className="flex items-center justify-between py-1 px-2 rounded bg-purple-50 dark:bg-purple-900/20"
                  >
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
                      </span>
                      <span className="font-medium text-purple-700 dark:text-purple-300">
                        {agent.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-500 dark:text-purple-400">
                      {agent.isActive ? "arbeitet..." : formatTimeAgo(agent.lastActiveMs)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No activity message */}
          {liveStatus && !liveStatus.mainSession?.isActive && liveStatus.subagents.length === 0 && (
            <div className="pt-3 text-center text-zinc-400">
              <Zap className="h-4 w-4 mx-auto mb-1 opacity-50" />
              <p>Keine aktiven Prozesse</p>
            </div>
          )}

          {/* Error state */}
          {liveStatus && !liveStatus.ok && (
            <div className="pt-3 text-center text-amber-500">
              <AlertCircle className="h-4 w-4 mx-auto mb-1" />
              <p>Gateway nicht erreichbar</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

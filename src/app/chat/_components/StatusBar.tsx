"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, Loader2, Brain, Search, PenLine, AlertCircle, CheckCircle2, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusData = {
  ok: boolean;
  timestamp: number;
  gateway: {
    reachable: boolean;
    url: string;
    error?: string;
    latencyMs?: number;
  };
  agent: {
    id: string;
    status: "online" | "offline" | "unknown";
  };
  lastCheck: number;
};

type ConnectionState = "connecting" | "connected" | "disconnected";

// Agent activity states - what Dieter is currently doing
export type AgentActivityState = 
  | "idle"           // Bereit, wartet auf Input
  | "thinking"       // Verarbeitet die Anfrage
  | "searching"      // Sucht/Tool calls
  | "typing"         // Schreibt Antwort (streaming)
  | "stuck"          // Fehler/Timeout
  | "sent"           // Nachricht gerade abgesendet
  | "sleeping";      // Inaktiv/Offline

interface StatusBarProps {
  agentActivity?: AgentActivityState;
  className?: string;
}

// Activity display config
const ACTIVITY_CONFIG: Record<AgentActivityState, {
  icon: typeof Loader2;
  text: string;
  color: string;
  animate?: boolean;
  hidden?: boolean;
}> = {
  idle: {
    icon: CheckCircle2,
    text: "Bereit",
    color: "text-emerald-500",
  },
  thinking: {
    icon: Brain,
    text: "Dieter denkt...",
    color: "text-amber-500",
    animate: true,
  },
  searching: {
    icon: Search,
    text: "Dieter sucht...",
    color: "text-blue-500",
    animate: true,
  },
  typing: {
    icon: PenLine,
    text: "Dieter schreibt...",
    color: "text-indigo-500",
    animate: true,
  },
  stuck: {
    icon: AlertCircle,
    text: "Stecken geblieben",
    color: "text-red-500",
  },
  sent: {
    icon: CheckCircle2,
    text: "Gesendet",
    color: "text-emerald-500",
    hidden: true, // Hide briefly after sending
  },
  sleeping: {
    icon: Moon,
    text: "Schläft",
    color: "text-zinc-400",
    hidden: true,
  },
};

export function StatusBar({ agentActivity = "idle", className }: StatusBarProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [expanded, setExpanded] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionState("connecting");

    const es = new EventSource("/api/status?sse=1");
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnectionState("connected");
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as StatusData;
        setStatus(data);
        setConnectionState("connected");
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setConnectionState("disconnected");
      es.close();
      eventSourceRef.current = null;

      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  // Determine display values
  const isOnline = status?.gateway.reachable && status?.agent.status === "online";
  const latencyMs = status?.gateway.latencyMs;
  const agentId = status?.agent.id ?? "main";
  const gatewayUrl = status?.gateway.url ?? "";

  // Get activity config
  const activityConfig = ACTIVITY_CONFIG[agentActivity];
  const ActivityIcon = activityConfig.icon;

  // Determine effective activity based on connection state
  const effectiveActivity: AgentActivityState = 
    connectionState === "disconnected" ? "sleeping" :
    connectionState === "connecting" ? "thinking" :
    !isOnline ? "sleeping" :
    agentActivity;

  const effectiveConfig = ACTIVITY_CONFIG[effectiveActivity];
  const EffectiveIcon = effectiveConfig.icon;

  // Don't render if hidden (sent/sleeping)
  if (effectiveConfig.hidden) {
    return null;
  }

  // Status dot color based on activity
  const dotColor = 
    effectiveActivity === "idle" ? "bg-emerald-500" :
    effectiveActivity === "thinking" || effectiveActivity === "searching" ? "bg-amber-500" :
    effectiveActivity === "typing" ? "bg-indigo-500" :
    effectiveActivity === "stuck" ? "bg-red-500" :
    "bg-zinc-400";

  return (
    <div className={cn(
      "border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80",
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
            {effectiveConfig.animate && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  dotColor
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-flex h-2.5 w-2.5 rounded-full",
                dotColor
              )}
            />
          </span>

          {/* Icon + Text */}
          <EffectiveIcon 
            className={cn(
              "h-4 w-4",
              effectiveConfig.color,
              effectiveConfig.animate && "animate-pulse"
            )} 
          />
          <span className={cn(
            "font-medium leading-none",
            effectiveConfig.color
          )}>
            {effectiveConfig.text}
          </span>

          {/* Latency (only when idle/online) */}
          {effectiveActivity === "idle" && connectionState === "connected" && latencyMs !== undefined && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600 leading-none">·</span>
              <span className="tabular-nums text-zinc-500 dark:text-zinc-400 text-xs leading-none">
                {latencyMs}ms
              </span>
            </>
          )}
        </div>

        {/* Right: Expand icon */}
        <div className="flex items-center shrink-0">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 md:px-5 py-2.5 text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5">
          <div className="flex justify-between">
            <span>Agent</span>
            <span className="font-mono">{agentId}</span>
          </div>
          <div className="flex justify-between">
            <span>Gateway</span>
            <span className="font-mono truncate max-w-[200px]">{gatewayUrl || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Latenz</span>
            <span className="font-mono">{latencyMs !== undefined ? `${latencyMs}ms` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Aktivität</span>
            <span className="font-mono">{effectiveConfig.text}</span>
          </div>
          <div className="flex justify-between">
            <span>Zuletzt geprüft</span>
            <span className="font-mono">
              {status?.lastCheck ? new Date(status.lastCheck).toLocaleTimeString("de-AT") : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

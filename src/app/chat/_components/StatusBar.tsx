"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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

export function StatusBar() {
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
  const isBusy = status?.agent.status === "unknown" && status?.gateway.reachable;
  const latencyMs = status?.gateway.latencyMs;
  const agentId = status?.agent.id ?? "main";
  const gatewayUrl = status?.gateway.url ?? "";

  // Status dot color
  const dotColor = isOnline
    ? "bg-emerald-500"
    : isBusy
    ? "bg-amber-500"
    : "bg-zinc-400";

  // Status text
  const statusText = connectionState === "connecting"
    ? "Verbinde..."
    : connectionState === "disconnected"
    ? "Offline"
    : isOnline
    ? "Online"
    : isBusy
    ? "Beschäftigt"
    : "Offline";

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-[32px] md:min-h-[36px] w-full items-center justify-between px-3 md:px-5 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {/* Left: Status indicator */}
        <div className="flex items-center gap-2 text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 leading-none">
          <span className="relative flex h-2 w-2 shrink-0">
            {isOnline && connectionState === "connected" && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  dotColor
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                dotColor
              )}
            />
          </span>
          <span className="leading-none">{statusText}</span>
          {connectionState === "connected" && latencyMs !== undefined && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600 leading-none">·</span>
              <span className="tabular-nums leading-none">{latencyMs}ms</span>
            </>
          )}
        </div>

        {/* Right: Expand icon */}
        <div className="flex items-center shrink-0">
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
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

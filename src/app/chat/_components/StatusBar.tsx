"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

  // Status dot color
  const dotColor = isOnline
    ? "bg-emerald-500"
    : isBusy
    ? "bg-amber-500"
    : "bg-zinc-400";

  // Status text
  const statusText = connectionState === "connecting"
    ? "Connecting..."
    : connectionState === "disconnected"
    ? "Offline"
    : isOnline
    ? "Online"
    : isBusy
    ? "Busy"
    : "Offline";

  return (
    <div className="flex h-8 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3">
      {/* Left: Status indicator */}
      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        {/* Status dot */}
        <span className="relative flex h-2 w-2">
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

        {/* Status text */}
        <span className="font-medium">{statusText}</span>

        {/* Agent ID */}
        {connectionState === "connected" && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span>{agentId}</span>
          </>
        )}

        {/* Latency */}
        {connectionState === "connected" && latencyMs !== undefined && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="tabular-nums">{latencyMs}ms</span>
          </>
        )}
      </div>

      {/* Right: Agent count placeholder */}
      {connectionState === "connected" && (
        <div className="text-xs text-zinc-500 dark:text-zinc-500">
          1 agent
        </div>
      )}
    </div>
  );
}

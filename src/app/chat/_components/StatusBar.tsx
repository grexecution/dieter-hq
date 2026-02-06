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
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [expanded, setExpanded] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
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

  const isOnline =
    status?.gateway.reachable && status?.agent.status === "online";
  const isBusy =
    status?.agent.status === "unknown" && status?.gateway.reachable;
  const latencyMs = status?.gateway.latencyMs;
  const agentId = status?.agent.id ?? "main";
  const gatewayUrl = status?.gateway.url ?? "";

  const dotColor = isOnline
    ? "bg-success"
    : isBusy
    ? "bg-warning"
    : "bg-foreground-tertiary";

  const statusText =
    connectionState === "connecting"
      ? "Connecting..."
      : connectionState === "disconnected"
      ? "Offline"
      : isOnline
      ? "Online"
      : isBusy
      ? "Busy"
      : "Offline";

  return (
    <div className="border-b border-border bg-background-secondary/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex h-6 w-full items-center justify-between px-4 transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-2 text-[10px] text-foreground-tertiary">
          <span className="relative flex h-1.5 w-1.5">
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
                "relative inline-flex h-1.5 w-1.5 rounded-full",
                dotColor
              )}
            />
          </span>
          <span>{statusText}</span>
          {connectionState === "connected" && latencyMs !== undefined && (
            <>
              <span className="text-border">·</span>
              <span className="tabular-nums">{latencyMs}ms</span>
            </>
          )}
        </div>

        {expanded ? (
          <ChevronUp className="h-3 w-3 text-foreground-tertiary" />
        ) : (
          <ChevronDown className="h-3 w-3 text-foreground-tertiary" />
        )}
      </button>

      {expanded && (
        <div className="space-y-1 border-t border-border px-4 py-2 text-[10px] text-foreground-tertiary">
          <div className="flex justify-between">
            <span>Agent</span>
            <span className="font-mono">{agentId}</span>
          </div>
          <div className="flex justify-between">
            <span>Gateway</span>
            <span className="max-w-[200px] truncate font-mono">
              {gatewayUrl || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Latency</span>
            <span className="font-mono">
              {latencyMs !== undefined ? `${latencyMs}ms` : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last check</span>
            <span className="font-mono">
              {status?.lastCheck
                ? new Date(status.lastCheck).toLocaleTimeString("de-AT")
                : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

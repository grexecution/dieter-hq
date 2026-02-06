"use client";

import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionLogEntry, ACTION_TYPE_CONFIG, SOURCE_CONFIG } from "./types";

interface InboxHistoryProps {
  className?: string;
}

export function InboxHistory({ className }: InboxHistoryProps) {
  const [history, setHistory] = useState<ActionLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/inbox/history?limit=20");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="mt-2 text-sm text-zinc-500">Lade Verlauf...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
          <History className="h-6 w-6 text-zinc-400" />
        </div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Noch keine Aktionen
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Deine Inbox-Aktionen erscheinen hier
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2 px-4 py-3", className)}>
      <h3 className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
        <History className="h-3.5 w-3.5" />
        Letzte Aktionen
      </h3>

      <div className="space-y-1">
        {history.map((entry) => {
          const createdAt = new Date(entry.createdAt);
          const timeLabel = createdAt.toLocaleString("de-AT", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });

          // Parse action string
          const isExecute = entry.action.startsWith("execute:");
          const actionType = isExecute ? entry.action.split(":")[1] : entry.action;
          const actionConfig = ACTION_TYPE_CONFIG[actionType as keyof typeof ACTION_TYPE_CONFIG];

          const sourceConfig = entry.inboxItem?.source 
            ? SOURCE_CONFIG[entry.inboxItem.source]
            : null;

          return (
            <div
              key={entry.id}
              className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              {/* Icon */}
              <span className="text-sm shrink-0">
                {actionConfig?.emoji || "⚡"}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-700 dark:text-zinc-300">
                  {entry.recommendation?.actionLabel || actionConfig?.label || entry.action}
                </p>
                {entry.inboxItem && (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    {sourceConfig?.emoji} {entry.inboxItem.sender}
                    {entry.inboxItem.subject && ` · ${entry.inboxItem.subject}`}
                  </p>
                )}
                {entry.result && (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                    → {entry.result}
                  </p>
                )}
              </div>

              {/* Time */}
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
                {timeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  History, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Filter,
  Check,
  X,
  Archive,
  Clock,
  Reply,
  Calendar,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ActionLogEntry, ACTION_TYPE_CONFIG, SOURCE_CONFIG } from "./types";
import { groupByDay } from "./utils/timeFormat";
import { HistoryListSkeleton } from "./InboxSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InboxHistoryProps {
  className?: string;
}

// Action type icons for timeline
const ACTION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  archive: Archive,
  reply: Reply,
  snooze: Clock,
  approve: Check,
  reject: X,
  schedule: Calendar,
  default: FileText,
};

export function InboxHistory({ className }: InboxHistoryProps) {
  const [history, setHistory] = useState<ActionLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(["Heute", "Gestern"]));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [actionFilter, setActionFilter] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/inbox/history?limit=50");
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

  // Group history by day
  const groupedHistory = useMemo(() => {
    let filtered = history;
    
    // Apply action filter
    if (actionFilter.size > 0) {
      filtered = history.filter(entry => {
        const actionType = entry.action.startsWith("execute:") 
          ? entry.action.split(":")[1] 
          : entry.action;
        return actionFilter.has(actionType);
      });
    }
    
    return groupByDay(filtered);
  }, [history, actionFilter]);

  // Get unique action types for filter
  const actionTypes = useMemo(() => {
    const types = new Set<string>();
    history.forEach(entry => {
      const actionType = entry.action.startsWith("execute:") 
        ? entry.action.split(":")[1] 
        : entry.action;
      types.add(actionType);
    });
    return Array.from(types);
  }, [history]);

  // Toggle day expansion
  const toggleDay = (day: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  // Toggle item expansion
  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle action filter
  const toggleActionFilter = (action: string) => {
    setActionFilter(prev => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  };

  // Export history as JSON
  const exportHistory = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inbox-history-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <HistoryListSkeleton count={10} />;
  }

  if (history.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex flex-col items-center justify-center py-12 text-center", className)}
      >
        <div className="mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
          <History className="h-6 w-6 text-zinc-400" />
        </div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Noch keine Aktionen
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Deine Inbox-Aktionen erscheinen hier
        </p>
      </motion.div>
    );
  }

  return (
    <div className={cn("px-4 py-3", className)}>
      {/* Header with filters and export */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          <History className="h-3.5 w-3.5" />
          Verlauf
          <Badge variant="secondary" className="h-4 text-[10px]">
            {history.length}
          </Badge>
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Action filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Filter
                {actionFilter.size > 0 && (
                  <Badge className="ml-1 h-4 min-w-[16px] px-1 text-[10px]">
                    {actionFilter.size}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {actionTypes.map(action => {
                const config = ACTION_TYPE_CONFIG[action as keyof typeof ACTION_TYPE_CONFIG];
                return (
                  <DropdownMenuCheckboxItem
                    key={action}
                    checked={actionFilter.has(action)}
                    onCheckedChange={() => toggleActionFilter(action)}
                  >
                    {config?.emoji || "⚡"} {config?.label || action}
                  </DropdownMenuCheckboxItem>
                );
              })}
              {actionFilter.size > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => setActionFilter(new Set())}
                  >
                    Alle anzeigen
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Export */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={exportHistory}
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {Array.from(groupedHistory.entries()).map(([day, entries]) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            {/* Day header */}
            <button
              onClick={() => toggleDay(day)}
              className="flex items-center gap-2 w-full text-left mb-2 group"
            >
              <motion.div
                animate={{ rotate: expandedDays.has(day) ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
              </motion.div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {day}
              </span>
              <Badge variant="secondary" className="h-4 text-[10px]">
                {entries.length}
              </Badge>
            </button>

            {/* Day entries */}
            <AnimatePresence>
              {expandedDays.has(day) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative ml-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-1">
                    {entries.map((entry, index) => {
                      const createdAt = new Date(entry.createdAt);
                      const timeLabel = createdAt.toLocaleTimeString("de-AT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      const isExecute = entry.action.startsWith("execute:");
                      const actionType = isExecute ? entry.action.split(":")[1] : entry.action;
                      const actionConfig = ACTION_TYPE_CONFIG[actionType as keyof typeof ACTION_TYPE_CONFIG];
                      // Icon for timeline (future enhancement)
                      const _ActionIcon = ACTION_ICONS[actionType] || ACTION_ICONS.default;

                      const sourceConfig = entry.inboxItem?.source 
                        ? SOURCE_CONFIG[entry.inboxItem.source]
                        : null;

                      const isExpanded = expandedItems.has(entry.id);

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="relative"
                        >
                          {/* Timeline dot */}
                          <div className="absolute -left-[22px] top-2 w-3 h-3 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-600 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                          </div>

                          {/* Entry card */}
                          <motion.div
                            className={cn(
                              "rounded-lg px-3 py-2 cursor-pointer transition-colors",
                              "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                            )}
                            onClick={() => toggleItem(entry.id)}
                            whileHover={{ x: 2 }}
                          >
                            <div className="flex items-start gap-2">
                              {/* Icon */}
                              <span className="text-sm shrink-0 mt-0.5">
                                {actionConfig?.emoji || "⚡"}
                              </span>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    {entry.recommendation?.actionLabel || actionConfig?.label || entry.action}
                                  </p>
                                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                    {timeLabel}
                                  </span>
                                </div>
                                
                                {entry.inboxItem && (
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                    {sourceConfig?.emoji} {entry.inboxItem.sender}
                                    {entry.inboxItem.subject && ` · ${entry.inboxItem.subject}`}
                                  </p>
                                )}

                                {/* Expanded details */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden mt-2"
                                    >
                                      <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-2 text-[10px] space-y-1">
                                        {entry.result && (
                                          <p className="text-zinc-600 dark:text-zinc-400">
                                            <span className="font-medium">Ergebnis:</span> {entry.result}
                                          </p>
                                        )}
                                        <p className="text-zinc-500 dark:text-zinc-500">
                                          <span className="font-medium">Ausgeführt von:</span> {entry.executedBy}
                                        </p>
                                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                                          <pre className="text-[9px] text-zinc-400 overflow-x-auto">
                                            {JSON.stringify(entry.metadata, null, 2)}
                                          </pre>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Expand indicator */}
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                className="text-zinc-400"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </motion.div>
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

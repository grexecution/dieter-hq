"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Inbox, History as HistoryIcon, Keyboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  InboxItem, 
  InboxFilters as FiltersType, 
  InboxStatus,
} from "./types";
import { InboxFilters } from "./InboxFilters";
import { InboxItemCard } from "./InboxItemCard";
import { InboxHistory } from "./InboxHistory";
import { InboxListSkeleton, PullToRefreshIndicator } from "./InboxSkeleton";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { usePullToRefresh } from "./hooks/usePullToRefresh";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ViewMode = "inbox" | "history";

// Undo stack for actions
interface UndoAction {
  itemId: string;
  previousStatus: InboxStatus;
  timestamp: number;
}

export function InboxView() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("inbox");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [, setUndoStack] = useState<UndoAction[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [filters, setFilters] = useState<FiltersType>({
    source: "all",
    status: "pending",  // Default: show open items only
    priority: "all",
  });

  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
    offset: 0,
  });

  // Load inbox items
  const loadItems = useCallback(async (reset = false) => {
    if (reset) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.source !== "all") params.set("source", filters.source);
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.priority !== "all") params.set("priority", filters.priority);
      params.set("limit", "50");
      if (!reset) params.set("offset", String(pagination.offset));

      const res = await fetch(`/api/inbox/items?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        // API returns { ok, data: { items, pagination } }
        const data = json.data || json;
        let items = data.items || [];
        const pag = data.pagination || { total: 0, hasMore: false, offset: 0 };
        
        // Sort by source priority (WhatsApp > ClickUp > Email), then by receivedAt
        const sourcePriority: Record<string, number> = {
          whatsapp: 0,
          clickup: 1,
          slack: 2,
          email: 3,
        };
        items = items.sort((a: InboxItem, b: InboxItem) => {
          const aPriority = sourcePriority[a.source] ?? 99;
          const bPriority = sourcePriority[b.source] ?? 99;
          if (aPriority !== bPriority) return aPriority - bPriority;
          // Within same source, sort by receivedAt (newest first)
          return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
        });
        
        setItems(reset ? items : (prev: InboxItem[]) => [...prev, ...items]);
        setPagination({
          total: pag.total ?? 0,
          hasMore: pag.hasMore ?? false,
          offset: (pag.offset ?? 0) + items.length,
        });
      } else {
        console.error("Inbox API error:", res.status);
        toast.error("Fehler beim Laden der Inbox");
      }
    } catch (err) {
      console.error("Error loading inbox:", err);
      toast.error("Fehler beim Laden der Inbox");
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.offset]);

  // Initial load
  useEffect(() => {
    loadItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Auto-refresh items from DB every 30 seconds when tab is visible
  // (Actual sync runs via cron job on Mac mini every 30 min)
  useEffect(() => {
    const REFRESH_INTERVAL = 30 * 1000; // 30 seconds
    let intervalId: NodeJS.Timeout | null = null;
    let lastRefreshTime = Date.now();

    const doAutoRefresh = async () => {
      // Skip if already syncing/loading or if we refreshed recently (debounce)
      if (isSyncing || isLoading || Date.now() - lastRefreshTime < 10000) return;
      
      // Only refresh if tab is visible
      if (document.visibilityState !== 'visible') return;
      
      console.log('[Inbox] Auto-refresh triggered');
      lastRefreshTime = Date.now();
      
      try {
        // Just reload items from DB (cron job fills the DB)
        await loadItems(true);
      } catch (err) {
        console.error('[Inbox] Auto-refresh failed:', err);
      }
    };

    // Start interval
    intervalId = setInterval(doAutoRefresh, REFRESH_INTERVAL);

    // Also refresh when tab becomes visible after being hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if it's been more than 1 minute since last refresh
        if (Date.now() - lastRefreshTime > 60000) {
          doAutoRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSyncing, isLoading, loadItems]);

  // Pull to refresh
  const { ref: pullRef, pullDistance, isRefreshing, isTriggered } = usePullToRefresh<HTMLDivElement>({
    onRefresh: async () => {
      await loadItems(true);
      toast.success("Inbox aktualisiert");
    },
    enabled: viewMode === "inbox",
  });

  // Handle filter change
  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setPagination({ total: 0, hasMore: false, offset: 0 });
    setSelectedIndex(0);
  };

  // Handle status change with optimistic update
  const handleStatusChange = async (id: string, status: InboxStatus) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Save for undo
    const undoAction: UndoAction = {
      itemId: id,
      previousStatus: item.status,
      timestamp: Date.now(),
    };

    // Optimistic update - remove from list if status doesn't match current filter
    setItems(prev => {
      // If filter is set and new status doesn't match, remove item
      if (filters.status !== "all" && status !== filters.status) {
        return prev.filter(i => i.id !== id);
      }
      // Otherwise just update the status
      return prev.map(i => i.id === id ? { ...i, status } : i);
    });

    try {
      const res = await fetch(`/api/inbox/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        setUndoStack(prev => [...prev.slice(-9), undoAction]);
        
        const statusLabels: Record<InboxStatus, string> = {
          archived: "Archiviert",
          snoozed: "Zurückgestellt",
          pending: "Als offen markiert",
          actioned: "Als erledigt markiert",
        };
        
        toast.success(statusLabels[status], {
          action: {
            label: "Rückgängig",
            onClick: () => handleUndo(undoAction),
          },
        });
      } else {
        // Revert on failure
        setItems(prev => prev.map(i => 
          i.id === id ? { ...i, status: undoAction.previousStatus } : i
        ));
        toast.error("Fehler beim Aktualisieren");
      }
    } catch {
      // Revert on error
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, status: undoAction.previousStatus } : i
      ));
      toast.error("Fehler beim Aktualisieren");
    }
  };

  // Undo action
  const handleUndo = async (action: UndoAction) => {
    setItems(prev => prev.map(i => 
      i.id === action.itemId ? { ...i, status: action.previousStatus } : i
    ));

    try {
      await fetch(`/api/inbox/items/${action.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.previousStatus }),
      });
      toast.success("Rückgängig gemacht");
    } catch {
      toast.error("Fehler beim Rückgängig machen");
    }
  };

  // Handle recommendation execution
  const handleExecuteRecommendation = async (
    id: string, 
    approve: boolean, 
    modifiedPayload?: string
  ) => {
    try {
      const res = await fetch(`/api/inbox/recommendations/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve, modifiedPayload }),
      });
      if (res.ok) {
        toast.success(approve ? "Aktion ausgeführt" : "Aktion abgelehnt");
        loadItems(true);
      } else {
        toast.error("Fehler bei der Ausführung");
      }
    } catch (err) {
      console.error("Error executing recommendation:", err);
      toast.error("Fehler bei der Ausführung");
    }
  };

  // Handle custom reply
  const handleSendCustomReply = async (id: string, message: string) => {
    try {
      const res = await fetch(`/api/inbox/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`📤 Nachricht wird über Dieter gesendet an ${data.recipient || "Empfänger"}`);
        // Mark as archived since reply is queued
        await handleStatusChange(id, "archived");
      } else {
        toast.error(data.error || "Fehler beim Senden");
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      toast.error("Fehler beim Senden");
    }
  };

  // Handle sync - triggers local sync via OpenClaw gateway webhook
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Refresh items from DB (real sync runs via cron every 30 min on Mac mini)
      await loadItems(true);
      toast.success("Inbox aktualisiert");
    } catch (err) {
      console.error("Error syncing:", err);
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setIsSyncing(false);
    }
  };

  // Keyboard navigation
  const handleKeyboardAction = useCallback((action: string, item: { id: string }) => {
    switch (action) {
      case "archive":
        handleStatusChange(item.id, "archived");
        break;
      case "snooze":
        handleStatusChange(item.id, "snoozed");
        break;
      case "open":
        setExpandedItemId(expandedItemId === item.id ? null : item.id);
        break;
      case "close":
        setExpandedItemId(null);
        break;
    }
  }, [expandedItemId]);

  useKeyboardNavigation({
    items,
    selectedIndex,
    onSelectIndex: (index) => {
      setSelectedIndex(index);
      // Scroll item into view
      const itemElement = document.getElementById(`inbox-item-${items[index]?.id}`);
      if (itemElement) {
        itemElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    },
    onAction: handleKeyboardAction,
    enabled: viewMode === "inbox" && !isLoading,
  });

  const pendingCount = items.filter(i => i.status === "pending").length;
  const unreadCount = items.filter(i => i.status === "pending" && i.priority !== "low").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 p-1">
            <button
              onClick={() => setViewMode("inbox")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-medium transition-all duration-150",
                viewMode === "inbox"
                  ? "bg-white dark:bg-zinc-700/80 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <Inbox className="h-3.5 w-3.5" />
              Inbox
              {unreadCount > 0 && (
                <Badge 
                  variant="default" 
                  className="ml-1 h-[18px] min-w-[18px] px-1.5 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-600 rounded-full"
                >
                  {unreadCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-medium transition-all duration-150",
                viewMode === "history"
                  ? "bg-white dark:bg-zinc-700/80 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <HistoryIcon className="h-3.5 w-3.5" />
              Verlauf
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Keyboard shortcuts hint */}
          <button
            onClick={() => setShowKeyboardHints(!showKeyboardHints)}
            className={cn(
              "hidden sm:flex items-center gap-1 h-9 w-9 justify-center rounded-xl transition-all duration-150",
              showKeyboardHints 
                ? "bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/80 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/60"
            )}
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-9 rounded-xl border-zinc-200/80 transition-all duration-150 hover:bg-zinc-50 dark:border-zinc-700/80 dark:hover:bg-zinc-800/60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isSyncing && "animate-spin")} />
            {isSyncing ? "Sync..." : "Sync"}
          </Button>
        </div>
      </div>

      {/* Keyboard shortcuts panel */}
      <AnimatePresence>
        {showKeyboardHints && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60"
          >
            <div className="px-4 py-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span><kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 font-mono text-[10px] shadow-sm">j</kbd> / <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 font-mono text-[10px] shadow-sm">k</kbd> Navigieren</span>
              <span><kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 font-mono text-[10px] shadow-sm">Enter</kbd> Öffnen</span>
              <span><kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 font-mono text-[10px] shadow-sm">e</kbd> Archivieren</span>
              <span><kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 font-mono text-[10px] shadow-sm">s</kbd> Zurückstellen</span>
              <span><kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 font-mono text-[10px] shadow-sm">Esc</kbd> Schließen</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content based on view mode */}
      {viewMode === "inbox" ? (
        <>
          {/* Filters */}
          <InboxFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            counts={{ pending: pendingCount, total: pagination.total }}
          />

          {/* Pull to refresh indicator */}
          <PullToRefreshIndicator
            pullDistance={pullDistance}
            isRefreshing={isRefreshing}
            isTriggered={isTriggered}
          />

          {/* Items list */}
          <div 
            ref={(node) => {
              // Combine refs
              (pullRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            className="flex-1 overflow-auto"
          >
            {isLoading && items.length === 0 ? (
              <InboxListSkeleton count={6} />
            ) : items.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center px-4"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60">
                  <Inbox className="h-7 w-7 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-200">
                  Inbox leer
                </h3>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xs leading-relaxed">
                  {filters.source === "all" && filters.status === "all" && filters.priority === "all"
                    ? "Keine Nachrichten vorhanden. Klicke auf Sync um neue Nachrichten abzurufen."
                    : "Keine Nachrichten mit diesen Filtern gefunden."
                  }
                </p>
                {(filters.source !== "all" || filters.status !== "all" || filters.priority !== "all") && (
                  <button
                    onClick={() => setFilters({ source: "all", status: "all", priority: "all" })}
                    className="mt-4 text-[13px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-2 p-3">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      id={`inbox-item-${item.id}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ 
                        duration: 0.2,
                        delay: index * 0.02,
                      }}
                    >
                      <InboxItemCard
                        item={item}
                        onStatusChange={handleStatusChange}
                        onExecuteRecommendation={handleExecuteRecommendation}
                        onSendCustomReply={handleSendCustomReply}
                        isExpanded={expandedItemId === item.id}
                        isSelected={selectedIndex === index}
                        onToggleExpand={() => setExpandedItemId(
                          expandedItemId === item.id ? null : item.id
                        )}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Load more */}
                {pagination.hasMore && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center py-4"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadItems(false)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Laden...
                        </>
                      ) : (
                        "Mehr laden"
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-auto">
          <InboxHistory />
        </div>
      )}
    </div>
  );
}

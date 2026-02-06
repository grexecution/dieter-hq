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
    status: "all",
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
        const items = data.items || [];
        const pag = data.pagination || { total: 0, hasMore: false, offset: 0 };
        
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

    // Optimistic update
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, status } : i
    ));

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

  // Handle sync
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const emailAccounts = ["greg@example.com"];
      for (const account of emailAccounts) {
        await fetch("/api/inbox/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "email", account }),
        });
      }
      
      await fetch("/api/inbox/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "whatsapp" }),
      });
      
      await loadItems(true);
      toast.success("Synchronisation abgeschlossen");
    } catch (err) {
      console.error("Error syncing:", err);
      toast.error("Synchronisation fehlgeschlagen");
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
            <button
              onClick={() => setViewMode("inbox")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                viewMode === "inbox"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <Inbox className="h-3.5 w-3.5" />
              Inbox
              {unreadCount > 0 && (
                <Badge 
                  variant="default" 
                  className="ml-1 h-4 min-w-[16px] px-1 text-[10px] bg-indigo-600 hover:bg-indigo-600"
                >
                  {unreadCount}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                viewMode === "history"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <HistoryIcon className="h-3.5 w-3.5" />
              Verlauf
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Keyboard shortcuts hint */}
          <button
            onClick={() => setShowKeyboardHints(!showKeyboardHints)}
            className={cn(
              "hidden sm:flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
              showKeyboardHints 
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="transition-all duration-200"
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
            className="overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
          >
            <div className="px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono">j</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono">k</kbd> Navigieren</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono">Enter</kbd> Öffnen</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono">e</kbd> Archivieren</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono">s</kbd> Zurückstellen</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono">Esc</kbd> Schließen</span>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center px-4"
              >
                <div className="mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4">
                  <Inbox className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Inbox leer
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                  {filters.source === "all" && filters.status === "all" && filters.priority === "all"
                    ? "Keine Nachrichten vorhanden. Klicke auf Sync um neue Nachrichten abzurufen."
                    : "Keine Nachrichten mit diesen Filtern gefunden."
                  }
                </p>
                {(filters.source !== "all" || filters.status !== "all" || filters.priority !== "all") && (
                  <button
                    onClick={() => setFilters({ source: "all", status: "all", priority: "all" })}
                    className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
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

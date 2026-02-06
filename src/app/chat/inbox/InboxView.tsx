"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Inbox, History as HistoryIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  InboxItem, 
  InboxFilters as FiltersType, 
  InboxStatus,
  InboxSource,
  InboxPriority
} from "./types";
import { InboxFilters } from "./InboxFilters";
import { InboxItemCard } from "./InboxItemCard";
import { InboxHistory } from "./InboxHistory";
import { Button } from "@/components/ui/button";

type ViewMode = "inbox" | "history";

export function InboxView() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("inbox");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
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
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.source !== "all") params.set("source", filters.source);
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.priority !== "all") params.set("priority", filters.priority);
      params.set("limit", "50");
      if (!reset) params.set("offset", String(pagination.offset));

      const res = await fetch(`/api/inbox/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(reset ? data.items : [...items, ...data.items]);
        setPagination({
          total: data.pagination.total,
          hasMore: data.pagination.hasMore,
          offset: data.pagination.offset + data.items.length,
        });
      }
    } catch (err) {
      console.error("Error loading inbox:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.offset, items]);

  // Initial load
  useEffect(() => {
    loadItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Handle filter change
  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setPagination({ total: 0, hasMore: false, offset: 0 });
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: InboxStatus) => {
    try {
      const res = await fetch(`/api/inbox/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setItems(prev => prev.map(item => 
          item.id === id ? { ...item, status } : item
        ));
      }
    } catch (err) {
      console.error("Error updating status:", err);
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
        // Refresh items to get updated recommendations
        loadItems(true);
      }
    } catch (err) {
      console.error("Error executing recommendation:", err);
    }
  };

  // Handle sync
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Sync all email accounts (will be populated later)
      const emailAccounts = ["greg@example.com"]; // TODO: Get from config
      for (const account of emailAccounts) {
        await fetch("/api/inbox/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "email", account }),
        });
      }
      
      // Sync WhatsApp
      await fetch("/api/inbox/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "whatsapp" }),
      });
      
      // Refresh items
      loadItems(true);
    } catch (err) {
      console.error("Error syncing:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = items.filter(i => i.status === "pending").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
            <button
              onClick={() => setViewMode("inbox")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "inbox"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <Inbox className="h-3.5 w-3.5" />
              Inbox
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
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

        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isSyncing && "animate-spin")} />
          {isSyncing ? "Sync..." : "Sync"}
        </Button>
      </div>

      {/* Content based on view mode */}
      {viewMode === "inbox" ? (
        <>
          {/* Filters */}
          <InboxFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            counts={{ pending: pendingCount, total: pagination.total }}
          />

          {/* Items list */}
          <div className="flex-1 overflow-auto">
            {isLoading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <p className="mt-2 text-sm text-zinc-500">Lade Inbox...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
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
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {items.map((item) => (
                  <InboxItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onExecuteRecommendation={handleExecuteRecommendation}
                    isExpanded={expandedItemId === item.id}
                    onToggleExpand={() => setExpandedItemId(
                      expandedItemId === item.id ? null : item.id
                    )}
                  />
                ))}

                {/* Load more */}
                {pagination.hasMore && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadItems(false)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Laden...
                        </>
                      ) : (
                        "Mehr laden"
                      )}
                    </Button>
                  </div>
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

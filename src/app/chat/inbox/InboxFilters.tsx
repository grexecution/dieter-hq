"use client";

import { cn } from "@/lib/utils";
import { 
  InboxFilters as FiltersType, 
  InboxSource, 
  InboxStatus, 
  InboxPriority,
  SOURCE_CONFIG, 
  STATUS_CONFIG, 
  PRIORITY_CONFIG 
} from "./types";

interface InboxFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  counts: {
    pending: number;
    total: number;
  };
}

export function InboxFilters({ filters, onFiltersChange, counts }: InboxFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
      {/* Source Filter */}
      <select
        value={filters.source}
        onChange={(e) => onFiltersChange({ ...filters, source: e.target.value as InboxSource | "all" })}
        className={cn(
          "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1",
          "text-xs font-medium text-zinc-700 dark:text-zinc-300",
          "focus:outline-none focus:ring-2 focus:ring-zinc-400"
        )}
      >
        <option value="all">📬 Alle Quellen</option>
        {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
          <option key={key} value={key}>
            {cfg.emoji} {cfg.label}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={filters.status}
        onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as InboxStatus | "all" })}
        className={cn(
          "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1",
          "text-xs font-medium text-zinc-700 dark:text-zinc-300",
          "focus:outline-none focus:ring-2 focus:ring-zinc-400"
        )}
      >
        <option value="all">📋 Alle Status</option>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <option key={key} value={key}>
            {cfg.emoji} {cfg.label}
          </option>
        ))}
      </select>

      {/* Priority Filter */}
      <select
        value={filters.priority}
        onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value as InboxPriority | "all" })}
        className={cn(
          "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1",
          "text-xs font-medium text-zinc-700 dark:text-zinc-300",
          "focus:outline-none focus:ring-2 focus:ring-zinc-400"
        )}
      >
        <option value="all">🎯 Alle Prioritäten</option>
        {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
          <option key={key} value={key}>
            {cfg.emoji} {cfg.label}
          </option>
        ))}
      </select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Counts */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-amber-700 dark:text-amber-400 font-medium">
          {counts.pending} offen
        </span>
        <span className="text-zinc-400 dark:text-zinc-600">|</span>
        <span>{counts.total} gesamt</span>
      </div>
    </div>
  );
}

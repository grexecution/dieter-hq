"use client";

import { useState, useCallback, useMemo } from "react";
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Bookmark,
  Plus,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InboxFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onSearchChange?: (query: string) => void;
  counts: {
    pending: number;
    total: number;
  };
}

// Predefined filter presets
interface FilterPreset {
  id: string;
  name: string;
  emoji: string;
  filters: FiltersType;
}

const DEFAULT_PRESETS: FilterPreset[] = [
  { 
    id: "urgent", 
    name: "Dringend", 
    emoji: "🔴",
    filters: { source: "all", status: "pending", priority: "urgent" }
  },
  { 
    id: "emails", 
    name: "Nur E-Mails", 
    emoji: "📧",
    filters: { source: "email", status: "all", priority: "all" }
  },
  { 
    id: "whatsapp", 
    name: "WhatsApp", 
    emoji: "💬",
    filters: { source: "whatsapp", status: "all", priority: "all" }
  },
  { 
    id: "open", 
    name: "Offene", 
    emoji: "⏳",
    filters: { source: "all", status: "pending", priority: "all" }
  },
];

export function InboxFilters({ 
  filters, 
  onFiltersChange, 
  onSearchChange,
  counts 
}: InboxFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>(DEFAULT_PRESETS);
  const [showDateFilter] = useState(false);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.source !== "all") count++;
    if (filters.status !== "all") count++;
    if (filters.priority !== "all") count++;
    return count;
  }, [filters]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  }, [onSearchChange]);

  // Apply preset
  const applyPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
  };

  // Save current filters as preset
  const saveCurrentAsPreset = () => {
    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: "Mein Filter",
      emoji: "⭐",
      filters: { ...filters },
    };
    setSavedPresets([...savedPresets, newPreset]);
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({ source: "all", status: "all", priority: "all" });
    setSearchQuery("");
    onSearchChange?.("");
  };

  // Check if current filters match a preset
  const matchingPreset = savedPresets.find(
    p => 
      p.filters.source === filters.source &&
      p.filters.status === filters.status &&
      p.filters.priority === filters.priority
  );

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
      {/* Main filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Suchen..."
            className="h-8 pl-8 pr-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Quick presets (desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {savedPresets.slice(0, 4).map((preset) => (
            <motion.button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                matchingPreset?.id === preset.id
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{preset.emoji}</span>
              <span>{preset.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Expand filters (mobile) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex md:hidden items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
            isExpanded || activeFilterCount > 0
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
          {activeFilterCount > 0 && (
            <Badge className="h-4 min-w-[16px] px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Filter dropdowns (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Source Filter */}
          <select
            value={filters.source}
            onChange={(e) => onFiltersChange({ ...filters, source: e.target.value as InboxSource | "all" })}
            className={cn(
              "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5",
              "text-xs font-medium text-zinc-700 dark:text-zinc-300",
              "focus:outline-none focus:ring-2 focus:ring-indigo-400",
              "transition-colors cursor-pointer",
              filters.source !== "all" && "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30"
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
              "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5",
              "text-xs font-medium text-zinc-700 dark:text-zinc-300",
              "focus:outline-none focus:ring-2 focus:ring-indigo-400",
              "transition-colors cursor-pointer",
              filters.status !== "all" && "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30"
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
              "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5",
              "text-xs font-medium text-zinc-700 dark:text-zinc-300",
              "focus:outline-none focus:ring-2 focus:ring-indigo-400",
              "transition-colors cursor-pointer",
              filters.priority !== "all" && "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30"
            )}
          >
            <option value="all">🎯 Alle Prioritäten</option>
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.emoji} {cfg.label}
              </option>
            ))}
          </select>

          {/* Date filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-7 text-xs",
                  showDateFilter && "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30"
                )}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Zeitraum
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem>Heute</DropdownMenuItem>
              <DropdownMenuItem>Diese Woche</DropdownMenuItem>
              <DropdownMenuItem>Dieser Monat</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Alle</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <X className="h-3 w-3" />
              Zurücksetzen
            </motion.button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1 hidden md:block" />

        {/* Counts */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {counts.pending > 0 && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-amber-700 dark:text-amber-400 font-medium">
              {counts.pending} offen
            </span>
          )}
          <span className="text-zinc-400 dark:text-zinc-600">|</span>
          <span>{counts.total} gesamt</span>
        </div>

        {/* Save preset */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hidden md:flex">
              <Bookmark className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={saveCurrentAsPreset}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              Filter speichern
            </DropdownMenuItem>
            {savedPresets.length > DEFAULT_PRESETS.length && (
              <>
                <DropdownMenuSeparator />
                {savedPresets.slice(DEFAULT_PRESETS.length).map((preset) => (
                  <DropdownMenuItem 
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.emoji} {preset.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded filters (mobile) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden md:hidden"
          >
            <div className="px-4 py-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800">
              {/* Quick presets for mobile */}
              <div className="flex flex-wrap gap-1">
                {savedPresets.slice(0, 4).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      applyPreset(preset);
                      setIsExpanded(false);
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      matchingPreset?.id === preset.id
                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              {/* Filter selects */}
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={filters.source}
                  onChange={(e) => onFiltersChange({ ...filters, source: e.target.value as InboxSource | "all" })}
                  className={cn(
                    "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5",
                    "text-xs text-zinc-700 dark:text-zinc-300",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  )}
                >
                  <option value="all">Quelle</option>
                  {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as InboxStatus | "all" })}
                  className={cn(
                    "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5",
                    "text-xs text-zinc-700 dark:text-zinc-300",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  )}
                >
                  <option value="all">Status</option>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value as InboxPriority | "all" })}
                  className={cn(
                    "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5",
                    "text-xs text-zinc-700 dark:text-zinc-300",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  )}
                >
                  <option value="all">Priorität</option>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>

              {/* Clear button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    clearFilters();
                    setIsExpanded(false);
                  }}
                  className="w-full py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

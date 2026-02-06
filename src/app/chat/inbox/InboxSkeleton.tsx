"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function InboxItemSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
      <div className="flex items-start gap-3">
        {/* Source icon */}
        <Skeleton className="h-6 w-6 rounded-full" />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex-1" />
            <Skeleton className="h-3 w-12" />
          </div>

          {/* Subject */}
          <Skeleton className="h-4 w-3/4" />

          {/* Preview */}
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function InboxListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <InboxItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function InboxFiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
      <Skeleton className="h-7 w-28 rounded-lg" />
      <Skeleton className="h-7 w-24 rounded-lg" />
      <Skeleton className="h-7 w-28 rounded-lg" />
      <div className="flex-1" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}

export function RecommendationSkeleton() {
  return (
    <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function HistoryItemSkeleton() {
  return (
    <div className="flex items-start gap-2 px-2 py-1.5">
      <Skeleton className="h-4 w-4 rounded shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-56" />
      </div>
      <Skeleton className="h-2.5 w-16" />
    </div>
  );
}

export function HistoryListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-1 px-4 py-3">
      <Skeleton className="h-4 w-24 mb-3" />
      {Array.from({ length: count }).map((_, i) => (
        <HistoryItemSkeleton key={i} />
      ))}
    </div>
  );
}

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isTriggered: boolean;
  className?: string;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isTriggered,
  className,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden transition-all duration-200",
        className
      )}
      style={{
        height: isRefreshing ? 48 : pullDistance,
        opacity: Math.min(pullDistance / 60, 1),
      }}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400",
          isRefreshing && "animate-pulse"
        )}
      >
        <svg
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isRefreshing && "animate-spin",
            isTriggered && !isRefreshing && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
        <span>
          {isRefreshing
            ? "Wird aktualisiert..."
            : isTriggered
            ? "Loslassen zum Aktualisieren"
            : "Ziehen zum Aktualisieren"}
        </span>
      </div>
    </div>
  );
}

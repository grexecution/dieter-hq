"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ============================================
// Reports List Skeleton
// ============================================

export function ReportCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

export function ReportsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
        >
          <ReportCardSkeleton />
        </div>
      ))}
    </div>
  );
}

// ============================================
// Report Viewer Skeleton
// ============================================

export function ReportViewerSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
            <Skeleton className="h-8 w-24 mt-3" />
            <Skeleton className="h-3 w-16 mt-2" />
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card overflow-hidden">
        <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Report Builder Skeleton
// ============================================

export function ReportBuilderSkeleton() {
  return (
    <div className="flex h-full animate-in fade-in duration-300">
      {/* Left Panel - Config */}
      <div className="w-80 border-r border-zinc-200/80 dark:border-zinc-800/80 p-5 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>

        {/* Data Source */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Chart Type */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Preview Card */}
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
            <Skeleton className="h-5 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Mini Skeletons for inline use
// ============================================

export function ReportStatSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function ReportChipSkeleton() {
  return <Skeleton className="h-6 w-20 rounded-full" />;
}

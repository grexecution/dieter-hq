"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { type OfficeStats as OfficeStatsType } from "@/lib/office-data";
import { Zap, Loader2, Coffee, AlertCircle, CheckCircle2 } from "lucide-react";

interface OfficeStatsProps {
  stats: OfficeStatsType;
}

export function OfficeStats({ stats }: OfficeStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 glass rounded-xl">
      {/* Active */}
      <div className="flex items-center gap-2 text-sm">
        <Zap className="h-4 w-4 text-green-500" />
        <span className="font-medium">{stats.active}</span>
        <span className="text-muted-foreground">active</span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Working */}
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 text-blue-500" />
        <span className="font-medium">{stats.working}</span>
        <span className="text-muted-foreground">working</span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Idle */}
      <div className="flex items-center gap-2 text-sm">
        <Coffee className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{stats.idle}</span>
        <span className="text-muted-foreground">idle</span>
      </div>

      {/* Blocked - Only show if > 0 */}
      {stats.blocked > 0 && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">{stats.blocked}</span>
            <span>blocked</span>
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Done Today */}
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="font-medium">{stats.doneToday}</span>
        <span className="text-muted-foreground">done today</span>
      </div>
    </div>
  );
}

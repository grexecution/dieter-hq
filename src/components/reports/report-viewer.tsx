"use client";

import * as React from "react";
import { useState } from "react";
import {
  ArrowLeft,
  Share2,
  Download,
  Pencil,
  MoreHorizontal,
  Calendar,
  Eye,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportViewerSkeleton } from "./report-skeleton";
import type { Report } from "./reports-list";

// ============================================
// Types
// ============================================

interface StatCard {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

interface ReportViewerProps {
  report: Report | null;
  stats?: StatCard[];
  isLoading?: boolean;
  onBack?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  children?: React.ReactNode; // For chart content
}

// ============================================
// Stat Card
// ============================================

function StatCardComponent({ stat }: { stat: StatCard }) {
  const getTrendIcon = () => {
    if (!stat.change) return <Minus className="h-3 w-3" />;
    if (stat.change > 0) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!stat.change) return "text-zinc-500";
    if (stat.change > 0) return "text-emerald-600 dark:text-emerald-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card className={cn(
      "group transition-all duration-200",
      "hover:shadow-md hover:border-indigo-500/20 dark:hover:border-indigo-400/20"
    )}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{stat.label}</span>
          <div className={cn("transition-transform group-hover:scale-110", getTrendColor())}>
            {getTrendIcon()}
          </div>
        </div>
        
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {stat.value}
        </div>
        
        {stat.change !== undefined && (
          <div className={cn("flex items-center gap-1 mt-2 text-xs", getTrendColor())}>
            <span>{stat.change > 0 ? "+" : ""}{stat.change}%</span>
            {stat.changeLabel && (
              <span className="text-muted-foreground">{stat.changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export function ReportViewer({
  report,
  stats = [],
  isLoading = false,
  onBack,
  onEdit,
  onShare,
  onExport,
  onRefresh,
  children,
}: ReportViewerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading || !report) {
    return <ReportViewerSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-xl -ml-2 mt-0.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {report.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                report.status === "published" 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              )}>
                {report.status === "published" ? "Veröffentlicht" : "Entwurf"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(report.updatedAt)}
              </span>
              {report.viewCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {report.viewCount} Aufrufe
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className={cn("rounded-xl", isRefreshing && "animate-spin")}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onShare}
            className="rounded-xl"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onExport}
            className="rounded-xl"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            onClick={onEdit}
            className={cn(
              "gap-2 rounded-xl",
              "bg-gradient-to-r from-indigo-600 to-purple-600",
              "hover:from-indigo-700 hover:to-purple-700"
            )}
          >
            <Pencil className="h-4 w-4" />
            Bearbeiten
          </Button>
        </div>
      </div>

      {/* Description */}
      {report.description && (
        <p className="text-muted-foreground max-w-3xl">
          {report.description}
        </p>
      )}

      {/* Stats Grid */}
      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ 
                animationDelay: `${index * 75}ms`, 
                animationFillMode: "backwards" 
              }}
            >
              <StatCardComponent stat={stat} />
            </div>
          ))}
        </div>
      )}

      {/* Chart Content */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Übersicht</CardTitle>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="rounded-lg text-xs">
                7 Tage
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg text-xs">
                30 Tage
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg text-xs">
                90 Tage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {children || (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chart wird hier angezeigt
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportViewer;

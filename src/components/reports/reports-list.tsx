"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { 
  FileBarChart2, 
  Plus, 
  MoreHorizontal, 
  Clock, 
  Eye, 
  Pencil, 
  Trash2,
  TrendingUp,
  PieChart,
  BarChart3,
  LineChart,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportsListSkeleton } from "./report-skeleton";

// ============================================
// Types
// ============================================

export interface Report {
  id: string;
  title: string;
  description?: string;
  type: "bar" | "line" | "pie" | "table" | "mixed";
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
  viewCount?: number;
  author?: {
    name: string;
    avatar?: string;
  };
}

interface ReportsListProps {
  reports: Report[];
  isLoading?: boolean;
  onCreateReport?: () => void;
  onViewReport?: (report: Report) => void;
  onEditReport?: (report: Report) => void;
  onDeleteReport?: (report: Report) => void;
}

// ============================================
// Report Type Icon
// ============================================

function ReportTypeIcon({ type, className }: { type: Report["type"]; className?: string }) {
  const icons = {
    bar: BarChart3,
    line: LineChart,
    pie: PieChart,
    table: FileBarChart2,
    mixed: TrendingUp,
  };
  const Icon = icons[type] || FileBarChart2;
  
  return (
    <div className={cn(
      "flex items-center justify-center rounded-xl",
      "bg-gradient-to-br from-indigo-500/10 to-purple-500/10",
      "dark:from-indigo-500/20 dark:to-purple-500/20",
      className
    )}>
      <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
    </div>
  );
}

// ============================================
// Status Badge
// ============================================

function StatusBadge({ status }: { status: Report["status"] }) {
  const styles = {
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    archived: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };

  const labels = {
    draft: "Entwurf",
    published: "Veröffentlicht",
    archived: "Archiviert",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      "transition-colors duration-200",
      styles[status]
    )}>
      {labels[status]}
    </span>
  );
}

// ============================================
// Report Card
// ============================================

function ReportCard({ 
  report, 
  onView, 
  onEdit, 
  onDelete 
}: { 
  report: Report;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("de-DE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  return (
    <Card 
      className={cn(
        "group relative cursor-pointer",
        // Premium hover effects
        "transition-all duration-200 ease-out",
        "hover:shadow-lg hover:shadow-indigo-500/5",
        "hover:border-indigo-500/20 dark:hover:border-indigo-400/20",
        "hover:-translate-y-0.5",
        // Active state
        "active:translate-y-0 active:shadow-md"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onView}
    >
      {/* Gradient border effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
        "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10",
        "group-hover:opacity-100 pointer-events-none"
      )} />

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ReportTypeIcon type={report.type} className="h-10 w-10" />
            <div>
              <CardTitle className="text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {report.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1">
                <Clock className="h-3 w-3" />
                {formatDate(report.updatedAt)}
              </CardDescription>
            </div>
          </div>
          <StatusBadge status={report.status} />
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        {report.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {report.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {report.viewCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {report.viewCount}
              </span>
            )}
            {report.author && (
              <span className="flex items-center gap-1.5">
                {report.author.avatar ? (
                  <img 
                    src={report.author.avatar} 
                    alt={report.author.name}
                    className="h-4 w-4 rounded-full"
                  />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-indigo-100 dark:bg-indigo-900" />
                )}
                {report.author.name}
              </span>
            )}
          </div>

          {/* Action buttons - appear on hover */}
          <div className={cn(
            "flex items-center gap-1 transition-all duration-200",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Arrow indicator on hover */}
      <div className={cn(
        "absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-200",
        isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
      )}>
        <ArrowRight className="h-5 w-5 text-indigo-500" />
      </div>
    </Card>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState({ onCreateReport }: { onCreateReport?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Illustration */}
      <div className="relative mb-6">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
        
        {/* Icon container */}
        <div className="relative flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 shadow-lg">
          <FileBarChart2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          
          {/* Sparkle decorations */}
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-amber-500 animate-pulse" />
          <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="absolute top-0 -left-3 h-2 w-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Noch keine Reports
      </h3>
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        Reports helfen dir, deine Daten zu visualisieren und Insights zu gewinnen. 
        Erstelle deinen ersten Report und entdecke Trends in deinen Projekten.
      </p>

      {/* CTA Button */}
      <Button
        size="lg"
        onClick={onCreateReport}
        className={cn(
          "gap-2 px-6",
          "bg-gradient-to-r from-indigo-600 to-purple-600",
          "hover:from-indigo-700 hover:to-purple-700",
          "shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30",
          "transition-all duration-200 hover:-translate-y-0.5"
        )}
      >
        <Plus className="h-5 w-5" />
        Ersten Report erstellen
      </Button>

      {/* Subtle hint */}
      <p className="mt-6 text-xs text-muted-foreground/60">
        Tipp: Drücke <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px]">⌘ N</kbd> für einen neuen Report
      </p>
    </div>
  );
}

// ============================================
// Reports Header
// ============================================

export function ReportsHeader({ onCreateReport }: { onCreateReport?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualisiere deine Daten und entdecke Insights
        </p>
      </div>
      
      <Button
        onClick={onCreateReport}
        className={cn(
          "gap-2",
          "bg-gradient-to-r from-indigo-600 to-purple-600",
          "hover:from-indigo-700 hover:to-purple-700",
          "shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25",
          "transition-all duration-200 hover:-translate-y-0.5"
        )}
      >
        <Plus className="h-4 w-4" />
        Neuer Report
      </Button>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ReportsList({
  reports,
  isLoading = false,
  onCreateReport,
  onViewReport,
  onEditReport,
  onDeleteReport,
}: ReportsListProps) {
  if (isLoading) {
    return (
      <div>
        <ReportsHeader onCreateReport={onCreateReport} />
        <ReportsListSkeleton count={6} />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div>
        <ReportsHeader onCreateReport={onCreateReport} />
        <EmptyState onCreateReport={onCreateReport} />
      </div>
    );
  }

  return (
    <div>
      <ReportsHeader onCreateReport={onCreateReport} />
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report, index) => (
          <div
            key={report.id}
            className="animate-in fade-in slide-in-from-bottom-2"
            style={{ 
              animationDelay: `${index * 50}ms`, 
              animationFillMode: "backwards" 
            }}
          >
            <ReportCard
              report={report}
              onView={() => onViewReport?.(report)}
              onEdit={() => onEditReport?.(report)}
              onDelete={() => onDeleteReport?.(report)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportsList;

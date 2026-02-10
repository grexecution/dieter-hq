"use client";

import * as React from "react";
import { useState } from "react";
import {
  ArrowLeft,
  Save,
  Send,
  BarChart3,
  LineChart,
  PieChart,
  Table,
  AreaChart,
  Sparkles,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReportBuilderSkeleton } from "./report-skeleton";

// ============================================
// Types
// ============================================

type ChartType = "bar" | "line" | "pie" | "area" | "table" | "mixed";

interface ReportBuilderProps {
  initialData?: {
    title?: string;
    description?: string;
    chartType?: ChartType;
  };
  isLoading?: boolean;
  isSaving?: boolean;
  onBack?: () => void;
  onSave?: (data: { title: string; description: string; chartType: ChartType }) => void;
  onPublish?: (data: { title: string; description: string; chartType: ChartType }) => void;
}

// ============================================
// Chart Type Selector
// ============================================

const chartTypes: { type: ChartType; icon: React.ElementType; label: string }[] = [
  { type: "bar", icon: BarChart3, label: "Balken" },
  { type: "line", icon: LineChart, label: "Linie" },
  { type: "area", icon: AreaChart, label: "Fläche" },
  { type: "pie", icon: PieChart, label: "Kreis" },
  { type: "table", icon: Table, label: "Tabelle" },
  { type: "mixed", icon: Sparkles, label: "Gemischt" },
];

function ChartTypeSelector({
  value,
  onChange,
}: {
  value: ChartType;
  onChange: (type: ChartType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {chartTypes.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl",
            "border-2 transition-all duration-200",
            "hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20",
            value === type
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
              : "border-zinc-200 dark:border-zinc-800"
          )}
        >
          <Icon className={cn(
            "h-6 w-6 transition-colors",
            value === type
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-zinc-500"
          )} />
          <span className={cn(
            "text-xs font-medium transition-colors",
            value === type
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-zinc-600 dark:text-zinc-400"
          )}>
            {label}
          </span>
          
          {value === type && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center justify-center h-4 w-4 rounded-full bg-indigo-500">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Preview Panel
// ============================================

function PreviewPanel({ chartType, title }: { chartType: ChartType; title: string }) {
  const ChartIcon = chartTypes.find(c => c.type === chartType)?.icon || BarChart3;
  
  return (
    <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
      <CardContent className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className={cn(
          "flex items-center justify-center h-20 w-20 rounded-2xl mb-6",
          "bg-gradient-to-br from-indigo-100 to-purple-100",
          "dark:from-indigo-900/50 dark:to-purple-900/50",
          "transition-transform duration-300 hover:scale-110"
        )}>
          <ChartIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {title || "Unbenannter Report"}
        </h3>
        
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Wähle eine Datenquelle und konfiguriere deinen Report, 
          um die Vorschau zu sehen.
        </p>

        {/* Fake chart bars for visual interest */}
        <div className="flex items-end gap-2 mt-8 h-24">
          {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
            <div
              key={i}
              className={cn(
                "w-8 rounded-t-lg transition-all duration-500",
                "bg-gradient-to-t from-indigo-500/30 to-purple-500/30"
              )}
              style={{ 
                height: `${height}%`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Main Component
// ============================================

export function ReportBuilder({
  initialData,
  isLoading = false,
  isSaving = false,
  onBack,
  onSave,
  onPublish,
}: ReportBuilderProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [chartType, setChartType] = useState<ChartType>(initialData?.chartType || "bar");

  if (isLoading) {
    return <ReportBuilderSkeleton />;
  }

  const handleSave = () => {
    onSave?.({ title, description, chartType });
  };

  const handlePublish = () => {
    onPublish?.({ title, description, chartType });
  };

  return (
    <div className="flex h-full animate-in fade-in duration-300">
      {/* Left Panel - Configuration */}
      <div className="w-80 shrink-0 border-r border-zinc-200/80 dark:border-zinc-800/80 p-5 overflow-y-auto">
        <div className="space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Report Titel eingeben..."
              className="rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was zeigt dieser Report?"
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {/* Data Source */}
          <div className="space-y-2">
            <Label>Datenquelle</Label>
            <button
              type="button"
              className={cn(
                "flex items-center justify-between w-full px-4 py-2.5 rounded-xl",
                "border border-zinc-200 dark:border-zinc-800",
                "text-sm text-left transition-colors",
                "hover:border-indigo-500/50"
              )}
            >
              <span className="text-muted-foreground">Datenquelle auswählen...</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Chart Type */}
          <div className="space-y-3">
            <Label>Chart Typ</Label>
            <ChartTypeSelector value={chartType} onChange={setChartType} />
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Zeitraum</Label>
            <button
              type="button"
              className={cn(
                "flex items-center justify-between w-full px-4 py-2.5 rounded-xl",
                "border border-zinc-200 dark:border-zinc-800",
                "text-sm text-left transition-colors",
                "hover:border-indigo-500/50"
              )}
            >
              <span className="text-muted-foreground">Letzte 30 Tage</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Vorschau
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || !title}
              className="gap-2 rounded-xl"
            >
              <Save className="h-4 w-4" />
              Speichern
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isSaving || !title}
              className={cn(
                "gap-2 rounded-xl",
                "bg-gradient-to-r from-indigo-600 to-purple-600",
                "hover:from-indigo-700 hover:to-purple-700",
                "shadow-md shadow-indigo-500/20"
              )}
            >
              <Send className="h-4 w-4" />
              Veröffentlichen
            </Button>
          </div>
        </div>

        <PreviewPanel chartType={chartType} title={title} />
      </div>
    </div>
  );
}

export default ReportBuilder;

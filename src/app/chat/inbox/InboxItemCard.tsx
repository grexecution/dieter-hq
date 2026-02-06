"use client";

import { useState } from "react";
import { Archive, Clock, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  InboxItem, 
  SOURCE_CONFIG, 
  PRIORITY_CONFIG, 
  STATUS_CONFIG,
  InboxStatus
} from "./types";
import { RecommendationCard } from "./RecommendationCard";
import { Button } from "@/components/ui/button";

interface InboxItemCardProps {
  item: InboxItem;
  onStatusChange: (id: string, status: InboxStatus) => Promise<void>;
  onExecuteRecommendation: (id: string, approve: boolean, modifiedPayload?: string) => Promise<void>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function InboxItemCard({ 
  item, 
  onStatusChange, 
  onExecuteRecommendation,
  isExpanded = false,
  onToggleExpand
}: InboxItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const sourceConfig = SOURCE_CONFIG[item.source];
  const priorityConfig = PRIORITY_CONFIG[item.priority];
  const statusConfig = STATUS_CONFIG[item.status];
  
  const receivedDate = new Date(item.receivedAt);
  const isToday = new Date().toDateString() === receivedDate.toDateString();
  const timeLabel = isToday 
    ? receivedDate.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })
    : receivedDate.toLocaleDateString("de-AT", { day: "numeric", month: "short" });

  const pendingRecommendations = item.recommendations?.filter(r => r.status === "pending") || [];
  const topRecommendation = pendingRecommendations[0];

  const handleStatusChange = async (newStatus: InboxStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(item.id, newStatus);
    } finally {
      setIsUpdating(false);
      setMenuOpen(false);
    }
  };

  return (
    <div className={cn(
      "group rounded-lg border transition-all",
      item.status === "pending" 
        ? "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
        : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-75",
      item.priority === "urgent" && item.status === "pending" && "border-l-4 border-l-red-500"
    )}>
      {/* Main content row */}
      <div 
        className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Source icon */}
        <div className="shrink-0 pt-0.5">
          <span className={cn("text-lg", sourceConfig.color)} title={sourceConfig.label}>
            {sourceConfig.emoji}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {item.senderName || item.sender}
            </span>
            {item.sourceAccount && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                → {item.sourceAccount}
              </span>
            )}
            <div className="flex-1" />
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
              {timeLabel}
            </span>
          </div>

          {/* Subject */}
          {item.subject && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate mb-0.5">
              {item.subject}
            </p>
          )}

          {/* Preview */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {item.preview}
          </p>

          {/* Inline recommendation (collapsed view) */}
          {!isExpanded && topRecommendation && (
            <div className="mt-2">
              <RecommendationCard 
                recommendation={topRecommendation}
                onExecute={onExecuteRecommendation}
                compact
              />
            </div>
          )}
        </div>

        {/* Right side: priority + actions */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {/* Priority badge */}
          {item.priority !== "normal" && (
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              priorityConfig.color
            )}>
              {priorityConfig.emoji}
            </span>
          )}

          {/* Expand/collapse */}
          <button className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-6 z-20 w-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-lg">
                  {item.status !== "archived" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange("archived");
                      }}
                      disabled={isUpdating}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archivieren
                    </button>
                  )}
                  {item.status !== "snoozed" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange("snoozed");
                      }}
                      disabled={isUpdating}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Zurückstellen
                    </button>
                  )}
                  {item.status !== "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange("pending");
                      }}
                      disabled={isUpdating}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {statusConfig.emoji}
                      Als offen markieren
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-3 space-y-3">
          {/* Full content */}
          {item.content && (
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {item.content}
              </p>
            </div>
          )}

          {/* All recommendations */}
          {item.recommendations && item.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Empfohlene Aktionen
              </h4>
              {item.recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  onExecute={onExecuteRecommendation}
                />
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("archived")}
              disabled={isUpdating || item.status === "archived"}
            >
              <Archive className="h-3.5 w-3.5 mr-1" />
              Archivieren
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("snoozed")}
              disabled={isUpdating || item.status === "snoozed"}
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              Zurückstellen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

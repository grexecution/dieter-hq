"use client";

import { useState } from "react";
import { Check, X, Edit2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Recommendation, ACTION_TYPE_CONFIG } from "./types";
import { Button } from "@/components/ui/button";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onExecute: (id: string, approve: boolean, modifiedPayload?: string) => Promise<void>;
  compact?: boolean;
}

export function RecommendationCard({ recommendation, onExecute, compact = false }: RecommendationCardProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPayload, setEditedPayload] = useState(recommendation.actionPayload || "{}");

  const actionConfig = ACTION_TYPE_CONFIG[recommendation.actionType] || ACTION_TYPE_CONFIG.custom;
  const confidence = recommendation.confidence ?? 50;

  const handleExecute = async (approve: boolean) => {
    setIsExecuting(true);
    try {
      await onExecute(
        recommendation.id, 
        approve, 
        isEditing ? editedPayload : undefined
      );
    } finally {
      setIsExecuting(false);
      setIsEditing(false);
    }
  };

  // Compact mode for inline display
  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1.5">
        <span className="text-sm">{actionConfig.emoji}</span>
        <span className="flex-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 truncate">
          {recommendation.actionLabel}
        </span>
        {recommendation.status === "pending" && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExecute(true)}
              disabled={isExecuting}
              className="rounded p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50"
              title="Ausführen"
            >
              {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => handleExecute(false)}
              disabled={isExecuting}
              className="rounded p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
              title="Ablehnen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {recommendation.status === "executed" && (
          <span className="text-[10px] text-green-600 dark:text-green-400">✓ Erledigt</span>
        )}
        {recommendation.status === "rejected" && (
          <span className="text-[10px] text-zinc-500">Abgelehnt</span>
        )}
      </div>
    );
  }

  // Full card mode
  return (
    <div className={cn(
      "rounded-lg border transition-colors",
      recommendation.status === "pending" 
        ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20"
        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-lg">{actionConfig.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
              {recommendation.actionLabel}
            </span>
            {confidence >= 80 && (
              <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 text-[10px] text-green-700 dark:text-green-400">
                {confidence}% sicher
              </span>
            )}
          </div>
          {recommendation.actionDescription && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {recommendation.actionDescription}
            </p>
          )}
        </div>

        {/* Actions */}
        {recommendation.status === "pending" && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 w-8 p-0"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleExecute(false)}
              disabled={isExecuting}
              className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => handleExecute(true)}
              disabled={isExecuting}
              className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  OK
                </>
              )}
            </Button>
          </div>
        )}

        {/* Status badges */}
        {recommendation.status === "executed" && (
          <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs text-green-700 dark:text-green-400">
            ✓ Erledigt
          </span>
        )}
        {recommendation.status === "rejected" && (
          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
            Abgelehnt
          </span>
        )}
      </div>

      {/* Details / Edit Mode */}
      {(showDetails || isEditing) && recommendation.status === "pending" && (
        <div className="border-t border-indigo-200 dark:border-indigo-800 px-3 py-2 space-y-2">
          {recommendation.reasoning && (
            <div className="text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Begründung: </span>
              <span className="text-zinc-500 dark:text-zinc-400">{recommendation.reasoning}</span>
            </div>
          )}
          
          {isEditing && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Aktion anpassen (JSON):
              </label>
              <textarea
                value={editedPayload}
                onChange={(e) => setEditedPayload(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2",
                  "text-xs font-mono placeholder:text-zinc-400",
                  "focus:outline-none focus:border-indigo-400"
                )}
                rows={3}
              />
            </div>
          )}
        </div>
      )}

      {/* Execution result */}
      {recommendation.executionResult && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {recommendation.executionResult}
          </p>
        </div>
      )}
    </div>
  );
}

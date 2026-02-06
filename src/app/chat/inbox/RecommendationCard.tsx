"use client";

import { useState } from "react";
import { 
  Check, 
  X, 
  Edit2, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  MoreHorizontal,
  Sparkles,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Recommendation, ACTION_TYPE_CONFIG } from "./types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onExecute: (id: string, approve: boolean, modifiedPayload?: string) => Promise<void>;
  compact?: boolean;
}

// Helper to extract draft text from JSON payload
function extractDraftText(payload: string | null | undefined): string {
  if (!payload) return "";
  try {
    const parsed = JSON.parse(payload);
    return parsed.draft || payload;
  } catch {
    return payload;
  }
}

// Helper to rebuild JSON payload with updated draft
function buildPayloadWithDraft(originalPayload: string | null | undefined, newDraft: string): string {
  try {
    const parsed = JSON.parse(originalPayload || "{}");
    return JSON.stringify({ ...parsed, draft: newDraft });
  } catch {
    return JSON.stringify({ draft: newDraft });
  }
}

export function RecommendationCard({ recommendation, onExecute, compact = false }: RecommendationCardProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState(() => extractDraftText(recommendation.actionPayload));
  const [executionState, setExecutionState] = useState<"idle" | "executing" | "success" | "error">("idle");

  const actionConfig = ACTION_TYPE_CONFIG[recommendation.actionType] || ACTION_TYPE_CONFIG.custom;
  const confidence = recommendation.confidence ?? 50;

  // Confidence color based on level
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "text-green-600 dark:text-green-400";
    if (conf >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-zinc-500 dark:text-zinc-400";
  };

  const getConfidenceProgressColor = (conf: number) => {
    if (conf >= 80) return "bg-green-500";
    if (conf >= 60) return "bg-yellow-500";
    return "bg-zinc-400";
  };

  const handleExecute = async (approve: boolean) => {
    setIsExecuting(true);
    setExecutionState("executing");
    try {
      // If editing, rebuild the JSON payload with the updated draft
      const modifiedPayload = isEditing 
        ? buildPayloadWithDraft(recommendation.actionPayload, editedDraft)
        : undefined;
      
      await onExecute(
        recommendation.id, 
        approve, 
        modifiedPayload
      );
      setExecutionState(approve ? "success" : "idle");
    } catch {
      setExecutionState("error");
    } finally {
      setIsExecuting(false);
      setIsEditing(false);
    }
  };

  // Compact mode for inline display
  if (compact) {
    return (
      <motion.div 
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
          recommendation.status === "pending" 
            ? "bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50"
            : "bg-zinc-50 dark:bg-zinc-800/50"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span className="text-sm">{actionConfig.emoji}</span>
        <span className="flex-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 truncate">
          {recommendation.actionLabel}
        </span>
        
        {/* Confidence mini indicator */}
        {confidence >= 80 && recommendation.status === "pending" && (
          <Sparkles className="h-3 w-3 text-green-500" />
        )}
        
        {recommendation.status === "pending" && (
          <div className="flex items-center gap-1">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleExecute(true);
              }}
              disabled={isExecuting}
              className="rounded p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
              title="Ausführen"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isExecuting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </motion.button>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleExecute(false);
              }}
              disabled={isExecuting}
              className="rounded p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
              title="Ablehnen"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {recommendation.status === "executed" && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] text-green-600 dark:text-green-400 font-medium"
            >
              ✓ Erledigt
            </motion.span>
          )}
          {recommendation.status === "rejected" && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] text-zinc-500"
            >
              Abgelehnt
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Full card mode
  return (
    <motion.div 
      className={cn(
        "rounded-lg border transition-all",
        recommendation.status === "pending" 
          ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20"
          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50",
        executionState === "executing" && "opacity-75"
      )}
      layout
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <motion.span 
          className="text-lg"
          animate={executionState === "executing" ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {actionConfig.emoji}
        </motion.span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
              {recommendation.actionLabel}
            </span>
            
            {/* Confidence indicator */}
            {confidence >= 70 && recommendation.status === "pending" && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  confidence >= 80 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                )}
              >
                {confidence >= 80 ? <Zap className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
                {confidence}%
              </motion.div>
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
            
            {/* More options dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setIsEditing(!isEditing)}>
                  <Edit2 className="h-3.5 w-3.5 mr-2" />
                  Anpassen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDetails(!showDetails)}>
                  <ChevronDown className="h-3.5 w-3.5 mr-2" />
                  Details anzeigen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleExecute(false)}
                  className="text-red-600 dark:text-red-400"
                >
                  <X className="h-3.5 w-3.5 mr-2" />
                  Ablehnen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="sm"
                onClick={() => setShowDetails(true)}
                disabled={isExecuting}
                className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Ansehen
              </Button>
            </motion.div>
          </div>
        )}

        {/* Status badges */}
        <AnimatePresence mode="wait">
          {recommendation.status === "executed" && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs text-green-700 dark:text-green-400 font-medium"
            >
              ✓ Erledigt
            </motion.span>
          )}
          {recommendation.status === "rejected" && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500"
            >
              Abgelehnt
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Confidence progress bar */}
      {recommendation.status === "pending" && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px]", getConfidenceColor(confidence))}>
              Konfidenz
            </span>
            <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <motion.div 
                className={cn("h-full rounded-full", getConfidenceProgressColor(confidence))}
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className={cn("text-[10px] font-medium tabular-nums", getConfidenceColor(confidence))}>
              {confidence}%
            </span>
          </div>
        </div>
      )}

      {/* Details / Edit Mode */}
      <AnimatePresence>
        {(showDetails || isEditing) && recommendation.status === "pending" && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-indigo-200 dark:border-indigo-800 px-3 py-2 space-y-2">
              {/* Draft Preview */}
              {recommendation.actionPayload && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1"
                >
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    📝 ENTWURF (wird NICHT automatisch gesendet)
                  </span>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {(() => {
                        try {
                          const payload = JSON.parse(recommendation.actionPayload);
                          return payload.draft || recommendation.actionPayload;
                        } catch {
                          return recommendation.actionPayload;
                        }
                      })()}
                    </p>
                  </div>
                </motion.div>
              )}

              {recommendation.reasoning && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-xs"
                >
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Kontext: </span>
                  <span className="text-zinc-500 dark:text-zinc-400">{recommendation.reasoning}</span>
                </motion.div>
              )}
              
              {/* Send button - ONLY here after viewing draft */}
              {!isEditing && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-800"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (confirm("Wirklich senden? Diese Aktion kann nicht rückgängig gemacht werden.")) {
                        handleExecute(true);
                      }
                    }}
                    disabled={isExecuting}
                    className="text-xs bg-green-600 hover:bg-green-700"
                  >
                    {isExecuting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    Senden
                  </Button>
                  <span className="text-[10px] text-zinc-400 ml-auto">
                    ⚠️ Klick auf Senden führt die Aktion aus
                  </span>
                </motion.div>
              )}
              
              {isEditing && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Nachricht bearbeiten:
                  </label>
                  <textarea
                    value={editedDraft}
                    onChange={(e) => setEditedDraft(e.target.value)}
                    placeholder="Deine Nachricht hier eingeben..."
                    className={cn(
                      "w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2",
                      "text-sm placeholder:text-zinc-400",
                      "focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400",
                      "transition-colors resize-none"
                    )}
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedDraft(extractDraftText(recommendation.actionPayload));
                      }}
                      className="h-7 text-xs"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExecute(true)}
                      disabled={isExecuting}
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                    >
                      Mit Änderungen ausführen
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Execution result */}
      <AnimatePresence>
        {recommendation.executionResult && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                → {recommendation.executionResult}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

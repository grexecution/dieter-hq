"use client";

import { useMemo } from "react";
import { Sparkles, Code, ArrowRight, MessageSquare, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================
// Types
// ============================================

export interface ChatSuggestion {
  id: string;
  label: string;
  icon: "dev" | "continue" | "idea" | "action";
  action: "workspace" | "send" | "custom";
  payload?: string; // Message to send or workspace topic
}

interface ChatSuggestionsProps {
  lastAssistantMessage?: string;
  currentTab: string;
  onSuggestionClick: (suggestion: ChatSuggestion) => void;
  className?: string;
}

// ============================================
// Suggestion Generation
// ============================================

function extractTopicFromMessage(message: string): string | null {
  // Try to extract a clear topic from the message
  // Look for code blocks, project names, or technical terms
  
  // Check for code blocks with language hints
  const codeMatch = message.match(/```(\w+)/);
  if (codeMatch) {
    const lang = codeMatch[1].toLowerCase();
    if (["typescript", "javascript", "tsx", "jsx", "python", "rust", "go"].includes(lang)) {
      return `${lang} code`;
    }
  }
  
  // Check for common project/feature patterns
  const patterns = [
    /(?:build|create|implement|fix|debug|add|update)\s+(?:the\s+)?([a-z][a-z0-9\s-]{2,30})/i,
    /(?:working on|developing|building)\s+(?:the\s+)?([a-z][a-z0-9\s-]{2,30})/i,
    /feature[:\s]+([a-z][a-z0-9\s-]{2,30})/i,
    /bug[:\s]+([a-z][a-z0-9\s-]{2,30})/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim().slice(0, 40);
    }
  }
  
  return null;
}

function generateSuggestions(
  lastMessage: string | undefined,
  currentTab: string
): ChatSuggestion[] {
  const suggestions: ChatSuggestion[] = [];
  
  if (!lastMessage) return suggestions;
  
  const messageLower = lastMessage.toLowerCase();
  const topic = extractTopicFromMessage(lastMessage);
  
  // Dev workspace suggestion for technical content
  const hasTechnicalContent = 
    messageLower.includes("code") ||
    messageLower.includes("bug") ||
    messageLower.includes("feature") ||
    messageLower.includes("implement") ||
    messageLower.includes("```") ||
    messageLower.includes("error") ||
    messageLower.includes("fix");
  
  if (hasTechnicalContent && currentTab !== "dev") {
    suggestions.push({
      id: "start-workspace",
      label: topic ? `Dev Workspace: ${topic}` : "Dev Workspace starten",
      icon: "dev",
      action: "workspace",
      payload: topic || undefined,
    });
  }
  
  // Follow-up suggestions based on context
  if (messageLower.includes("?") || messageLower.includes("möchtest") || messageLower.includes("soll ich")) {
    suggestions.push({
      id: "yes-continue",
      label: "Ja, mach das",
      icon: "action",
      action: "send",
      payload: "Ja, mach das!",
    });
    
    suggestions.push({
      id: "more-details",
      label: "Mehr Details",
      icon: "idea",
      action: "send",
      payload: "Erkläre mir mehr dazu.",
    });
  }
  
  // If message ends with a suggestion or plan
  if (messageLower.includes("vorschlag") || messageLower.includes("plan") || messageLower.includes("schritte")) {
    suggestions.push({
      id: "start-implementation",
      label: "Los geht's!",
      icon: "action",
      action: "send",
      payload: "Los geht's, starte damit!",
    });
  }
  
  // Generic continue suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      id: "continue-topic",
      label: "Weiter...",
      icon: "continue",
      action: "custom",
    });
  }
  
  return suggestions.slice(0, 3); // Max 3 suggestions
}

// ============================================
// Icon Component
// ============================================

function SuggestionIcon({ type }: { type: ChatSuggestion["icon"] }) {
  switch (type) {
    case "dev":
      return <Code className="h-3.5 w-3.5" />;
    case "continue":
      return <ArrowRight className="h-3.5 w-3.5" />;
    case "idea":
      return <Lightbulb className="h-3.5 w-3.5" />;
    case "action":
      return <Sparkles className="h-3.5 w-3.5" />;
    default:
      return <MessageSquare className="h-3.5 w-3.5" />;
  }
}

// ============================================
// Main Component
// ============================================

export function ChatSuggestions({
  lastAssistantMessage,
  currentTab,
  onSuggestionClick,
  className,
}: ChatSuggestionsProps) {
  const suggestions = useMemo(
    () => generateSuggestions(lastAssistantMessage, currentTab),
    [lastAssistantMessage, currentTab]
  );
  
  if (suggestions.length === 0) return null;
  
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2 py-2", className)}>
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          variant="outline"
          size="sm"
          className={cn(
            "h-7 gap-1.5 rounded-full border-zinc-200 dark:border-zinc-700",
            "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            "text-xs font-medium text-zinc-700 dark:text-zinc-300",
            "transition-all hover:scale-[1.02] active:scale-[0.98]",
            suggestion.icon === "dev" && "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
          )}
          onClick={() => onSuggestionClick(suggestion)}
        >
          <SuggestionIcon type={suggestion.icon} />
          <span className="max-w-[150px] truncate">{suggestion.label}</span>
        </Button>
      ))}
    </div>
  );
}

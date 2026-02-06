// Unified Inbox Types

export type InboxSource = "email" | "whatsapp" | "clickup" | "slack";
export type InboxPriority = "urgent" | "high" | "normal" | "low";
export type InboxStatus = "pending" | "actioned" | "archived" | "snoozed";
export type RecommendationStatus = "pending" | "approved" | "rejected" | "executed";
export type ActionType = "reply" | "archive" | "delegate" | "task" | "schedule" | "custom";

export interface InboxItem {
  id: string;
  source: InboxSource;
  sourceId: string;
  sourceAccount: string | null;
  threadId: string | null;
  sender: string;
  senderName: string | null;
  subject: string | null;
  preview: string;
  content: string | null;
  priority: InboxPriority;
  status: InboxStatus;
  receivedAt: string; // ISO date
  createdAt: string; // ISO date
  recommendations?: Recommendation[];
}

export interface Recommendation {
  id: string;
  inboxItemId: string;
  actionType: ActionType;
  actionLabel: string;
  actionDescription: string | null;
  actionPayload: string | null; // JSON
  confidence: number | null; // 0-100
  reasoning: string | null;
  status: RecommendationStatus;
  executedAt: string | null;
  executionResult: string | null;
  createdAt: string;
}

export interface ActionLogEntry {
  id: string;
  recommendationId: string | null;
  inboxItemId: string | null;
  action: string;
  executedBy: string;
  result: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  inboxItem?: {
    id: string;
    source: InboxSource;
    sender: string;
    subject: string | null;
    preview: string;
  } | null;
  recommendation?: {
    id: string;
    actionType: ActionType;
    actionLabel: string;
  } | null;
}

export interface SyncState {
  id: string;
  source: InboxSource;
  account: string | null;
  lastSyncAt: string | null;
  metadata: Record<string, unknown> | null;
}

// Filter state for inbox view
export interface InboxFilters {
  source: InboxSource | "all";
  status: InboxStatus | "all";
  priority: InboxPriority | "all";
}

// Source display config
export const SOURCE_CONFIG: Record<InboxSource, { emoji: string; label: string; color: string }> = {
  email: { emoji: "📧", label: "Email", color: "text-blue-600 dark:text-blue-400" },
  whatsapp: { emoji: "💬", label: "WhatsApp", color: "text-green-600 dark:text-green-400" },
  clickup: { emoji: "✅", label: "ClickUp", color: "text-purple-600 dark:text-purple-400" },
  slack: { emoji: "💼", label: "Slack", color: "text-pink-600 dark:text-pink-400" },
};

// Priority display config
export const PRIORITY_CONFIG: Record<InboxPriority, { emoji: string; label: string; color: string }> = {
  urgent: { emoji: "🔴", label: "Dringend", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30" },
  high: { emoji: "🟠", label: "Hoch", color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30" },
  normal: { emoji: "🟢", label: "Normal", color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30" },
  low: { emoji: "⚪", label: "Niedrig", color: "text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800" },
};

// Status display config
export const STATUS_CONFIG: Record<InboxStatus, { emoji: string; label: string }> = {
  pending: { emoji: "⏳", label: "Offen" },
  actioned: { emoji: "✅", label: "Erledigt" },
  archived: { emoji: "📦", label: "Archiviert" },
  snoozed: { emoji: "😴", label: "Zurückgestellt" },
};

// Action type display config
export const ACTION_TYPE_CONFIG: Record<ActionType, { emoji: string; label: string }> = {
  reply: { emoji: "↩️", label: "Antworten" },
  archive: { emoji: "📦", label: "Archivieren" },
  delegate: { emoji: "👋", label: "Delegieren" },
  task: { emoji: "✅", label: "Aufgabe erstellen" },
  schedule: { emoji: "📅", label: "Termin planen" },
  custom: { emoji: "⚡", label: "Aktion" },
};

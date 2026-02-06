import { z } from "zod";

// --- Enums ---
export const InboxSourceSchema = z.enum(["email", "whatsapp", "clickup", "slack"]);
export const InboxPrioritySchema = z.enum(["urgent", "high", "normal", "low"]);
export const InboxStatusSchema = z.enum(["pending", "actioned", "archived", "snoozed"]);
export const ActionTypeSchema = z.enum(["reply", "archive", "delegate", "task", "schedule", "custom"]);
export const RecommendationStatusSchema = z.enum(["pending", "approved", "rejected", "executed"]);
export const SortFieldSchema = z.enum(["receivedAt", "priority", "source", "createdAt"]);
export const SortOrderSchema = z.enum(["asc", "desc"]);

// --- Types ---
export type InboxSource = z.infer<typeof InboxSourceSchema>;
export type InboxPriority = z.infer<typeof InboxPrioritySchema>;
export type InboxStatus = z.infer<typeof InboxStatusSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type RecommendationStatus = z.infer<typeof RecommendationStatusSchema>;
export type SortField = z.infer<typeof SortFieldSchema>;
export type SortOrder = z.infer<typeof SortOrderSchema>;

// --- Request Schemas ---

// GET /api/inbox/items query params
export const InboxItemsQuerySchema = z.object({
  source: InboxSourceSchema.optional(),
  status: InboxStatusSchema.optional(),
  priority: InboxPrioritySchema.optional(),
  isRead: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(), // ISO date string for cursor-based pagination
  offset: z.coerce.number().int().min(0).optional(), // Legacy offset support
  sortBy: SortFieldSchema.default("receivedAt"),
  sortOrder: SortOrderSchema.default("desc"),
});
export type InboxItemsQuery = z.infer<typeof InboxItemsQuerySchema>;

// POST /api/inbox/items
export const CreateInboxItemSchema = z.object({
  source: InboxSourceSchema,
  sourceId: z.string().min(1),
  sourceAccount: z.string().optional(),
  threadId: z.string().optional(),
  sender: z.string().min(1),
  senderName: z.string().optional(),
  subject: z.string().optional(),
  preview: z.string().min(1),
  content: z.string().optional(),
  priority: InboxPrioritySchema.default("normal"),
  receivedAt: z.string().datetime({ offset: true }),
});
export type CreateInboxItem = z.infer<typeof CreateInboxItemSchema>;

// PATCH /api/inbox/items/[id]
export const UpdateInboxItemSchema = z.object({
  status: InboxStatusSchema.optional(),
  priority: InboxPrioritySchema.optional(),
  isRead: z.boolean().optional(),
}).refine(data => data.status || data.priority || data.isRead !== undefined, {
  message: "At least one field must be provided",
});
export type UpdateInboxItem = z.infer<typeof UpdateInboxItemSchema>;

// POST /api/inbox/items/bulk (create)
export const BulkCreateInboxItemsSchema = z.object({
  items: z.array(CreateInboxItemSchema).min(1).max(100),
});
export type BulkCreateInboxItems = z.infer<typeof BulkCreateInboxItemsSchema>;

// PATCH /api/inbox/items/bulk (update)
export const BulkUpdateInboxItemsSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  update: z.object({
    status: InboxStatusSchema.optional(),
    priority: InboxPrioritySchema.optional(),
    isRead: z.boolean().optional(),
  }).refine(data => data.status || data.priority || data.isRead !== undefined, {
    message: "At least one update field must be provided",
  }),
});
export type BulkUpdateInboxItems = z.infer<typeof BulkUpdateInboxItemsSchema>;

// POST /api/inbox/items/[id]/snooze
export const SnoozeInboxItemSchema = z.object({
  until: z.string().datetime({ offset: true }),
});
export type SnoozeInboxItem = z.infer<typeof SnoozeInboxItemSchema>;

// POST /api/inbox/recommendations
export const CreateRecommendationSchema = z.object({
  inboxItemId: z.string().min(1),
  actionType: ActionTypeSchema,
  actionLabel: z.string().min(1),
  actionDescription: z.string().optional(),
  actionPayload: z.string().optional(), // JSON string
  confidence: z.number().int().min(0).max(100).optional(),
  reasoning: z.string().optional(),
});
export type CreateRecommendation = z.infer<typeof CreateRecommendationSchema>;

// POST /api/inbox/sync
export const SyncRequestSchema = z.object({
  source: z.enum(["email", "whatsapp", "all"]),
  account: z.string().optional(),
}).refine(data => {
  // Email with specific account is fine
  // Email without account will sync all accounts
  // WhatsApp and all don't need account
  return true;
}, {
  message: "Invalid sync request",
});
export type SyncRequest = z.infer<typeof SyncRequestSchema>;

// --- Response Types ---

export interface InboxItemResponse {
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
  isRead: boolean;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  snoozedUntil: string | null;
}

export interface InboxItemWithRecommendations extends InboxItemResponse {
  recommendations: RecommendationResponse[];
}

export interface RecommendationResponse {
  id: string;
  inboxItemId: string;
  actionType: ActionType;
  actionLabel: string;
  actionDescription: string | null;
  actionPayload: string | null;
  confidence: number | null;
  reasoning: string | null;
  status: RecommendationStatus;
  executedAt: string | null;
  executionResult: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface InboxStatsResponse {
  total: number;
  bySource: Record<InboxSource, number>;
  byStatus: Record<InboxStatus, number>;
  byPriority: Record<InboxPriority, number>;
  unread: number;
  snoozed: number;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// --- Error codes ---
export const ErrorCodes = {
  INVALID_JSON: "INVALID_JSON",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  DATABASE_ERROR: "DATABASE_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

// --- Helper to create API responses ---
export function apiSuccess<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

export function apiError(code: string, message: string, details?: unknown): ApiResponse {
  return { ok: false, error: { code, message, details } };
}

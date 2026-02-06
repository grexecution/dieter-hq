/**
 * Unified Inbox Sync Module
 * 
 * Provides sync functionality for:
 * - Email (via gog CLI)
 * - WhatsApp (via wacli CLI)
 */

export { syncEmailInbox, syncAllEmailInboxes } from "./sync-email";
export { syncWhatsAppInbox } from "./sync-whatsapp";
export { detectPriority, needsAttentionToday, isVipSender, classifyContentType, extractDeadline, type PriorityInput, type PriorityResult } from "./priority-detector";
export { parseEmailFrom, parseWhatsAppJid, getSenderDisplayName, lookupWhatsAppContact, clearContactCache } from "./sender-lookup";
export { generateRecommendations, reanalyzeItem, type AnalysisContext, type GeneratedRecommendation } from "./recommendation-engine";
export * from "./types";

/**
 * Priority Detection for Inbox Items
 *
 * Analyzes content, sender, and metadata to determine priority level.
 * Uses pattern matching for reliability and speed.
 */

import type { InboxItem, InboxPriority } from "@/app/chat/inbox/types";

// ============================================================================
// INPUT TYPES (for sync compatibility)
// ============================================================================

/**
 * Simplified input for priority detection from sync sources
 */
export interface PriorityInput {
  subject?: string | null;
  content?: string | null;
  preview?: string | null;
  sender?: string | null;
  senderName?: string | null;
}

// ============================================================================
// PATTERN DEFINITIONS
// ============================================================================

// Urgent indicators - immediate action needed
const URGENT_PATTERNS = [
  /\b(asap|urgent|dringend|sofort|immediately|kritisch|critical|emergency)\b/i,
  /\b(heute|today|now|jetzt|bis\s+heute)\b/i,
  /\bdeadline.*(?:today|heute|now)\b/i,
  /\b(?:brauche|need|requires?).*(?:heute|today|asap|sofort)\b/i,
  /\b(hilfe|help).*(?:dringend|urgent|sofort)\b/i,
  /🚨|🔴|⚠️|‼️/,
  /\bproduktion(?:s)?.*(?:fehler|error|down|problem)\b/i,
  /\b(server|system|site|website).*(?:down|offline|fehler)\b/i,
];

// High priority indicators
const HIGH_PATTERNS = [
  /\b(wichtig|important|priority|priorität)\b/i,
  /\b(morgen|tomorrow|bis\s+morgen)\b/i,
  /\b(kunde|customer|client).*(?:problem|issue|beschwerde|complaint)\b/i,
  /\b(eskalation|escalation)\b/i,
  /\b(ceo|cto|geschäftsführ|chef|boss)\b/i,
  /\b(deadline|frist|termin)\b/i,
  /\b(bezahlung|payment|rechnung|invoice).*(?:problem|fehler|überfällig|overdue)\b/i,
  /\b(?:request|anfrage).*(?:approve|genehmigen|review)\b/i,
];

// Low priority indicators - can wait
const LOW_PATTERNS = [
  /\b(newsletter|digest|weekly|monthly|monatlich|wöchentlich)\b/i,
  /\b(unsubscribe|abmelden|austragen)\b/i,
  /\b(notification|benachrichtigung)\b/i,
  /\b(automated|automatisch|auto-reply|autoresponder)\b/i,
  /\b(no-?reply|noreply)\b/i,
  /\b(promotion|angebot|sale|rabatt|discount)\b/i,
  /\b(social\s+update|activity\s+alert)\b/i,
  /\b(marketing|werbung)\b/i,
  /\b(fyi|zur\s+info|for\s+your\s+information|zur\s+kenntnisnahme)\b/i,
];

// Notification patterns (automated systems)
const NOTIFICATION_PATTERNS = [
  /\b(github|gitlab|jira|confluence|trello|asana|linear|slack|notion)\b/i,
  /\b(mentioned|assigned|commented|merged|updated|created)\b/i,
  /\[.*\]\s*(?:RE:|Fwd:|Update:)/i,
  /\bCI\/CD|pipeline|build|deploy\b/i,
  /\b(alert|alarm|warning)\s*:/i,
];

// VIP sender patterns (high priority by default)
const VIP_PATTERNS = [
  /@(?:anthropic|openai|google|microsoft|apple)\.com$/i,
  /\b(ceo|cto|cfo|coo|founder|geschäftsführ|vorstand)\b/i,
];

// ============================================================================
// PRIORITY DETECTOR
// ============================================================================

export interface PriorityResult {
  priority: InboxPriority;
  confidence: number; // 0-100
  reasons: string[];
  isNotification: boolean;
  isNewsletter: boolean;
}

/**
 * Detect priority for an inbox item or priority input
 */
export function detectPriority(item: InboxItem | PriorityInput): PriorityResult {
  const text = buildAnalysisText(item);
  const reasons: string[] = [];
  let urgentScore = 0;
  let highScore = 0;
  let lowScore = 0;

  // Check urgent patterns
  for (const pattern of URGENT_PATTERNS) {
    if (pattern.test(text)) {
      urgentScore += 30;
      reasons.push(`Urgent keyword detected: ${pattern.source.slice(0, 30)}`);
    }
  }

  // Check high priority patterns
  for (const pattern of HIGH_PATTERNS) {
    if (pattern.test(text)) {
      highScore += 20;
      reasons.push(`High priority indicator: ${pattern.source.slice(0, 30)}`);
    }
  }

  // Check low priority patterns
  for (const pattern of LOW_PATTERNS) {
    if (pattern.test(text)) {
      lowScore += 25;
      reasons.push(`Low priority indicator: ${pattern.source.slice(0, 30)}`);
    }
  }

  // Check for notifications
  const isNotification = NOTIFICATION_PATTERNS.some((p) => p.test(text));
  if (isNotification) {
    lowScore += 15;
    reasons.push("Automated notification detected");
  }

  // Check for newsletters
  const isNewsletter =
    /newsletter|digest|weekly|monthly|unsubscribe/i.test(text);
  if (isNewsletter) {
    lowScore += 20;
    reasons.push("Newsletter detected");
  }

  // Check VIP sender
  const senderForVip = "sender" in item && item.sender ? item.sender : "";
  const senderNameForVip = "senderName" in item && item.senderName ? item.senderName : "";
  const isVipSenderMatch = VIP_PATTERNS.some(
    (p) => p.test(senderForVip) || (senderNameForVip && p.test(senderNameForVip))
  );
  if (isVipSenderMatch) {
    highScore += 25;
    reasons.push("VIP sender detected");
  }

  // Time-based urgency (received recently + urgent keywords = higher priority)
  // Only apply if receivedAt is available (InboxItem type)
  if ("receivedAt" in item && item.receivedAt) {
    const hoursSinceReceived =
      (Date.now() - new Date(item.receivedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceReceived < 1 && urgentScore > 0) {
      urgentScore += 10;
      reasons.push("Recently received urgent message");
    }
  }

  // Calculate final priority
  let priority: InboxPriority;
  let confidence: number;

  if (urgentScore >= 30) {
    priority = "urgent";
    confidence = Math.min(95, 60 + urgentScore);
  } else if (highScore >= 20 && lowScore < highScore) {
    priority = "high";
    confidence = Math.min(90, 50 + highScore);
  } else if (lowScore >= 25) {
    priority = "low";
    confidence = Math.min(90, 50 + lowScore);
  } else {
    priority = "normal";
    confidence = 60; // Default confidence for normal
    if (reasons.length === 0) {
      reasons.push("No specific priority indicators found");
    }
  }

  return {
    priority,
    confidence,
    reasons,
    isNotification,
    isNewsletter,
  };
}

/**
 * Detect if item needs attention today based on content
 */
export function needsAttentionToday(item: InboxItem | PriorityInput): boolean {
  const text = buildAnalysisText(item);

  // Check for today/deadline patterns
  const todayPatterns = [
    /\b(today|heute|now|jetzt|sofort|immediately)\b/i,
    /\bdeadline.*(?:today|heute)\b/i,
    /\b(?:due|fällig).*(?:today|heute)\b/i,
    /\bbis\s+(?:heute|today|EOD|end\s+of\s+day)\b/i,
  ];

  return todayPatterns.some((p) => p.test(text));
}

/**
 * Check if sender is on VIP list
 */
export function isVipSender(
  item: InboxItem | PriorityInput,
  customVipList?: string[]
): boolean {
  const sender = ("sender" in item && item.sender ? item.sender : "").toLowerCase();
  const senderName = ("senderName" in item && item.senderName ? item.senderName : "").toLowerCase();

  // Check custom VIP list
  if (customVipList) {
    for (const vip of customVipList) {
      const vipLower = vip.toLowerCase();
      if (sender.includes(vipLower) || senderName.includes(vipLower)) {
        return true;
      }
    }
  }

  // Check default VIP patterns
  const senderStr = "sender" in item && item.sender ? item.sender : "";
  const senderNameStr = "senderName" in item && item.senderName ? item.senderName : "";
  return VIP_PATTERNS.some(
    (p) => p.test(senderStr) || (senderNameStr && p.test(senderNameStr))
  );
}

/**
 * Classify the type of content
 */
export type ContentType =
  | "question"
  | "request"
  | "notification"
  | "newsletter"
  | "meeting"
  | "task"
  | "fyi"
  | "unknown";

export function classifyContentType(item: InboxItem | PriorityInput): ContentType {
  const text = buildAnalysisText(item);

  // Question detection
  if (
    /\?/.test(text) &&
    /\b(kannst|könntest|würdest|can|could|would|is|are|do|does|how|what|when|where|why|who)\b/i.test(
      text
    )
  ) {
    return "question";
  }

  // Meeting request
  if (
    /\b(meeting|termin|call|besprechung|zoom|teams|calendar|invite)\b/i.test(
      text
    )
  ) {
    return "meeting";
  }

  // Task/request detection
  if (
    /\b(please|bitte|kannst|könntest|action\s+required|todo|task|aufgabe)\b/i.test(
      text
    )
  ) {
    return "request";
  }

  // Newsletter
  if (/newsletter|digest|weekly|monthly|unsubscribe/i.test(text)) {
    return "newsletter";
  }

  // Notification
  if (NOTIFICATION_PATTERNS.some((p) => p.test(text))) {
    return "notification";
  }

  // FYI
  if (/\b(fyi|zur\s+info|for\s+your\s+information|zur\s+kenntnisnahme)\b/i.test(text)) {
    return "fyi";
  }

  return "unknown";
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build analysis text from item fields
 */
function buildAnalysisText(item: InboxItem | PriorityInput): string {
  // Handle both InboxItem (has 'subject') and PriorityInput
  const subject = "subject" in item ? item.subject : null;
  const preview = "preview" in item ? item.preview : null;
  const content = "content" in item ? item.content : null;
  const sender = "sender" in item ? item.sender : null;
  const senderName = "senderName" in item ? item.senderName : null;

  return [
    subject || "",
    preview || "",
    content || "",
    sender || "",
    senderName || "",
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Create a preview text from content
 * Strips HTML, normalizes whitespace, truncates
 */
export function createPreview(content: string | null | undefined, maxLength: number = 200): string {
  if (!content) return "";

  // Strip HTML tags
  let text = content.replace(/<[^>]*>/g, " ");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Truncate with ellipsis if needed
  if (text.length > maxLength) {
    // Try to break at word boundary
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > maxLength * 0.7) {
      return truncated.slice(0, lastSpace) + "...";
    }
    return truncated + "...";
  }

  return text;
}

/**
 * Extract deadline mentions from text
 */
export function extractDeadline(item: InboxItem | PriorityInput): Date | null {
  const text = buildAnalysisText(item);

  // Today
  if (/\b(today|heute|now)\b/i.test(text)) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  // Tomorrow
  if (/\b(tomorrow|morgen)\b/i.test(text)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    return tomorrow;
  }

  // This week
  if (/\b(this\s+week|diese\s+woche)\b/i.test(text)) {
    const friday = new Date();
    const day = friday.getDay();
    const daysUntilFriday = day <= 5 ? 5 - day : 7 - day + 5;
    friday.setDate(friday.getDate() + daysUntilFriday);
    friday.setHours(23, 59, 59, 999);
    return friday;
  }

  // Specific date patterns (DD.MM., MM/DD, etc.)
  const dateMatch = text.match(
    /\b(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\b/
  );
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const fullYear = year
      ? year.length === 2
        ? 2000 + parseInt(year)
        : parseInt(year)
      : new Date().getFullYear();
    const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime()) && date > new Date()) {
      return date;
    }
  }

  return null;
}

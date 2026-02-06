/**
 * AI Recommendation Engine for Unified Inbox
 *
 * Analyzes inbox items and generates smart action recommendations.
 * Uses rule-based detection with confidence scoring.
 * Can be enhanced with LLM calls for complex cases.
 */

import type {
  InboxItem,
  InboxPriority,
  ActionType,
} from "@/app/chat/inbox/types";
import {
  detectPriority,
  classifyContentType,
  extractDeadline,
  isVipSender,
  needsAttentionToday,
  type ContentType,
  type PriorityResult,
} from "./priority-detector";

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendationPayload {
  // Reply action
  draft?: string;
  tone?: "professional" | "casual" | "formal";

  // Archive action
  reason?: "newsletter" | "notification" | "fyi" | "resolved";

  // Delegate action
  suggestedDelegate?: string;
  context?: string;

  // Task action
  title?: string;
  description?: string;
  dueDate?: string;

  // Schedule action
  meetingTitle?: string;
  suggestedDuration?: number; // minutes
  suggestedTimes?: string[];

  // Custom action
  steps?: string[];
}

export interface GeneratedRecommendation {
  actionType: ActionType;
  actionLabel: string;
  actionDescription: string;
  actionPayload: RecommendationPayload;
  confidence: number; // 0-100
  reasoning: string;
}

export interface AnalysisContext {
  // VIP senders to prioritize
  vipSenders?: string[];
  // Team members for delegation
  teamMembers?: Array<{ name: string; role: string; expertise?: string[] }>;
  // Current user name for drafts
  userName?: string;
  // Working hours (for scheduling)
  workingHours?: { start: number; end: number }; // 0-23
  // Time zone
  timeZone?: string;
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

/**
 * Generate smart recommendations for an inbox item
 *
 * @param item - The inbox item to analyze
 * @param context - Optional context for personalization
 * @returns Array of 1-3 ranked recommendations
 */
export async function generateRecommendations(
  item: InboxItem,
  context?: AnalysisContext
): Promise<GeneratedRecommendation[]> {
  const recommendations: GeneratedRecommendation[] = [];

  // Step 1: Detect priority and content type
  const priorityResult = detectPriority(item);
  const contentType = classifyContentType(item);

  // Step 2: Generate recommendations based on analysis
  // Archive recommendation for newsletters/notifications
  if (priorityResult.isNewsletter || priorityResult.isNotification) {
    recommendations.push(generateArchiveRecommendation(item, priorityResult));
  }

  // Reply recommendation for questions
  if (contentType === "question") {
    recommendations.push(generateReplyRecommendation(item, context));
  }

  // Meeting/schedule recommendation
  if (contentType === "meeting") {
    recommendations.push(generateScheduleRecommendation(item, context));
  }

  // Task creation for requests
  if (contentType === "request") {
    recommendations.push(generateTaskRecommendation(item, priorityResult));
  }

  // Delegate recommendation for work items (if team available)
  if (context?.teamMembers && context.teamMembers.length > 0) {
    const delegateRec = generateDelegateRecommendation(item, context);
    if (delegateRec) {
      recommendations.push(delegateRec);
    }
  }

  // FYI items can be archived
  if (contentType === "fyi" && !recommendations.some((r) => r.actionType === "archive")) {
    recommendations.push(generateArchiveRecommendation(item, priorityResult, "fyi"));
  }

  // Unknown content - suggest review or task
  if (contentType === "unknown" && recommendations.length === 0) {
    recommendations.push(generateDefaultRecommendation(item, priorityResult));
  }

  // Step 3: Sort by confidence and limit to 3
  recommendations.sort((a, b) => b.confidence - a.confidence);

  // Ensure at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push(generateDefaultRecommendation(item, priorityResult));
  }

  return recommendations.slice(0, 3);
}

/**
 * Re-analyze an item with fresh context
 */
export async function reanalyzeItem(
  item: InboxItem,
  context?: AnalysisContext
): Promise<{
  priority: InboxPriority;
  recommendations: GeneratedRecommendation[];
  analysis: {
    contentType: ContentType;
    needsToday: boolean;
    isVip: boolean;
    hasDeadline: Date | null;
  };
}> {
  const priorityResult = detectPriority(item);
  const contentType = classifyContentType(item);
  const deadline = extractDeadline(item);
  const isVip = isVipSender(item, context?.vipSenders);
  const needsToday = needsAttentionToday(item);

  const recommendations = await generateRecommendations(item, context);

  return {
    priority: priorityResult.priority,
    recommendations,
    analysis: {
      contentType,
      needsToday,
      isVip,
      hasDeadline: deadline,
    },
  };
}

// ============================================================================
// RECOMMENDATION GENERATORS
// ============================================================================

function generateArchiveRecommendation(
  item: InboxItem,
  priority: PriorityResult,
  overrideReason?: "newsletter" | "notification" | "fyi" | "resolved"
): GeneratedRecommendation {
  let reason: "newsletter" | "notification" | "fyi" | "resolved";
  let label: string;
  let description: string;
  let confidence: number;

  if (overrideReason) {
    reason = overrideReason;
  } else if (priority.isNewsletter) {
    reason = "newsletter";
  } else if (priority.isNotification) {
    reason = "notification";
  } else {
    reason = "fyi";
  }

  switch (reason) {
    case "newsletter":
      label = "Newsletter archivieren";
      description = "Automatisch erkannter Newsletter - keine Aktion nötig";
      confidence = 85;
      break;
    case "notification":
      label = "Benachrichtigung archivieren";
      description = "System-Benachrichtigung ohne erforderliche Aktion";
      confidence = 80;
      break;
    case "fyi":
      label = "Zur Kenntnisnahme archivieren";
      description = "Informativ, keine Aktion erforderlich";
      confidence = 70;
      break;
    default:
      label = "Archivieren";
      description = "Keine weitere Aktion nötig";
      confidence = 60;
  }

  return {
    actionType: "archive",
    actionLabel: label,
    actionDescription: description,
    actionPayload: { reason },
    confidence,
    reasoning: priority.reasons.join("; ") || "No specific indicators",
  };
}

function generateReplyRecommendation(
  item: InboxItem,
  context?: AnalysisContext
): GeneratedRecommendation {
  const text = [item.subject, item.preview, item.content].filter(Boolean).join(" ");
  const hasQuestion = /\?/.test(text);
  const isGerman = /\b(kannst|könntest|würdest|bitte|danke|hallo)\b/i.test(text);

  // Detect tone
  const isFormal = /\b(sehr\s+geehrt|dear\s+sir|dear\s+madam|mit\s+freundlichen)\b/i.test(text);
  const tone: "professional" | "casual" | "formal" = isFormal
    ? "formal"
    : isGerman
    ? "professional"
    : "casual";

  // Generate draft suggestion based on detected question
  let draft = "";
  const greeting = isGerman ? "Hallo" : "Hi";
  const senderFirst = (item.senderName || item.sender.split("@")[0]).split(" ")[0];

  if (hasQuestion) {
    // Try to identify the question topic
    if (/\b(termin|meeting|zeit|time|available|verfügbar)\b/i.test(text)) {
      draft = isGerman
        ? `${greeting} ${senderFirst},\n\ndanke für deine Nachricht.\n\n[Verfügbarkeit/Terminvorschlag einfügen]\n\nViele Grüße${context?.userName ? `\n${context.userName}` : ""}`
        : `${greeting} ${senderFirst},\n\nThanks for reaching out.\n\n[Insert availability/time suggestion]\n\nBest${context?.userName ? `,\n${context.userName}` : ""}`;
    } else if (/\b(preis|price|kosten|cost|budget)\b/i.test(text)) {
      draft = isGerman
        ? `${greeting} ${senderFirst},\n\ndanke für deine Anfrage.\n\n[Preis/Angebot einfügen]\n\nViele Grüße${context?.userName ? `\n${context.userName}` : ""}`
        : `${greeting} ${senderFirst},\n\nThanks for your inquiry.\n\n[Insert pricing/quote]\n\nBest${context?.userName ? `,\n${context.userName}` : ""}`;
    } else {
      draft = isGerman
        ? `${greeting} ${senderFirst},\n\ndanke für deine Nachricht.\n\n[Antwort einfügen]\n\nViele Grüße${context?.userName ? `\n${context.userName}` : ""}`
        : `${greeting} ${senderFirst},\n\nThanks for your message.\n\n[Insert response]\n\nBest${context?.userName ? `,\n${context.userName}` : ""}`;
    }
  } else {
    draft = isGerman
      ? `${greeting} ${senderFirst},\n\n[Antwort einfügen]\n\nViele Grüße${context?.userName ? `\n${context.userName}` : ""}`
      : `${greeting} ${senderFirst},\n\n[Insert response]\n\nBest${context?.userName ? `,\n${context.userName}` : ""}`;
  }

  return {
    actionType: "reply",
    actionLabel: isGerman ? "Antworten" : "Reply",
    actionDescription: hasQuestion
      ? "Frage erkannt - Antwort-Entwurf vorbereitet"
      : "Antwort verfassen",
    actionPayload: { draft, tone },
    confidence: hasQuestion ? 75 : 50,
    reasoning: hasQuestion ? "Question mark detected in content" : "Reply might be needed",
  };
}

function generateScheduleRecommendation(
  item: InboxItem,
  context?: AnalysisContext
): GeneratedRecommendation {
  const text = [item.subject, item.preview, item.content].filter(Boolean).join(" ");

  // Extract meeting title from subject or first line
  let meetingTitle = item.subject || "Meeting";
  if (meetingTitle.toLowerCase().startsWith("re:")) {
    meetingTitle = meetingTitle.slice(3).trim();
  }
  if (meetingTitle.toLowerCase().startsWith("fwd:")) {
    meetingTitle = meetingTitle.slice(4).trim();
  }

  // Try to detect duration
  let suggestedDuration = 30; // default
  if (/\b(1\s*h|eine?\s+stunde|one\s+hour)\b/i.test(text)) {
    suggestedDuration = 60;
  } else if (/\b(15\s*min|kurz|quick|brief)\b/i.test(text)) {
    suggestedDuration = 15;
  } else if (/\b(30\s*min|halb|half)\b/i.test(text)) {
    suggestedDuration = 30;
  }

  // Generate suggested times (next business day slots)
  const suggestedTimes: string[] = [];
  const now = new Date();
  const workStart = context?.workingHours?.start ?? 9;
  const workEnd = context?.workingHours?.end ?? 17;

  // Find next business day
  const nextDay = new Date(now);
  nextDay.setDate(nextDay.getDate() + 1);
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  // Generate 3 time slots
  const slots = [10, 14, 16].filter((h) => h >= workStart && h < workEnd);
  for (const hour of slots.slice(0, 3)) {
    const slot = new Date(nextDay);
    slot.setHours(hour, 0, 0, 0);
    suggestedTimes.push(slot.toISOString());
  }

  return {
    actionType: "schedule",
    actionLabel: "Termin planen",
    actionDescription: `Meeting-Anfrage erkannt: ${meetingTitle}`,
    actionPayload: {
      meetingTitle,
      suggestedDuration,
      suggestedTimes,
    },
    confidence: 70,
    reasoning: "Meeting-related keywords detected",
  };
}

function generateTaskRecommendation(
  item: InboxItem,
  priority: PriorityResult
): GeneratedRecommendation {
  const text = [item.subject, item.preview, item.content].filter(Boolean).join(" ");

  // Extract task title from subject
  let title = item.subject || "Task from " + (item.senderName || item.sender);
  if (title.toLowerCase().startsWith("re:")) {
    title = title.slice(3).trim();
  }

  // Build description
  const description = `Von: ${item.senderName || item.sender}\n\n${item.preview || ""}`;

  // Extract deadline if present
  const deadline = extractDeadline(item);
  const dueDate = deadline?.toISOString();

  // Adjust confidence based on action indicators
  let confidence = 65;
  if (/\b(please|bitte|action\s+required|todo|aufgabe)\b/i.test(text)) {
    confidence += 10;
  }
  if (priority.priority === "urgent" || priority.priority === "high") {
    confidence += 5;
  }

  return {
    actionType: "task",
    actionLabel: "Aufgabe erstellen",
    actionDescription: deadline
      ? `Aufgabe mit Frist: ${deadline.toLocaleDateString("de-DE")}`
      : "Als Aufgabe zum Nachverfolgen erstellen",
    actionPayload: {
      title,
      description,
      dueDate,
    },
    confidence,
    reasoning: "Action request detected in content",
  };
}

function generateDelegateRecommendation(
  item: InboxItem,
  context: AnalysisContext
): GeneratedRecommendation | null {
  if (!context.teamMembers || context.teamMembers.length === 0) {
    return null;
  }

  const text = [item.subject, item.preview, item.content]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Try to match expertise
  let bestMatch: (typeof context.teamMembers)[0] | null = null;
  let matchScore = 0;

  for (const member of context.teamMembers) {
    let score = 0;

    // Check expertise match
    if (member.expertise) {
      for (const skill of member.expertise) {
        if (text.includes(skill.toLowerCase())) {
          score += 20;
        }
      }
    }

    // Check role match
    if (member.role) {
      const roleWords = member.role.toLowerCase().split(/\s+/);
      for (const word of roleWords) {
        if (text.includes(word)) {
          score += 10;
        }
      }
    }

    if (score > matchScore) {
      matchScore = score;
      bestMatch = member;
    }
  }

  // Only suggest delegation if we have a reasonable match
  if (matchScore < 10 || !bestMatch) {
    return null;
  }

  return {
    actionType: "delegate",
    actionLabel: `An ${bestMatch.name} delegieren`,
    actionDescription: `${bestMatch.role} - könnte am besten helfen`,
    actionPayload: {
      suggestedDelegate: bestMatch.name,
      context: `Basierend auf Expertise: ${bestMatch.expertise?.join(", ") || bestMatch.role}`,
    },
    confidence: Math.min(75, 40 + matchScore),
    reasoning: `Expertise match: ${bestMatch.expertise?.join(", ") || bestMatch.role}`,
  };
}

function generateDefaultRecommendation(
  item: InboxItem,
  priority: PriorityResult
): GeneratedRecommendation {
  // For normal/unknown items, suggest review + task creation
  const needsUrgentAction =
    priority.priority === "urgent" || priority.priority === "high";

  if (needsUrgentAction) {
    return {
      actionType: "task",
      actionLabel: "Als Aufgabe erfassen",
      actionDescription: "Priorität erkannt - zur Nachverfolgung als Aufgabe erfassen",
      actionPayload: {
        title: item.subject || `Nachricht von ${item.senderName || item.sender}`,
        description: `Von: ${item.senderName || item.sender}\n\n${item.preview || ""}`,
      },
      confidence: 55,
      reasoning: `Priority: ${priority.priority}`,
    };
  }

  // Default: suggest reply for messages without clear action
  return {
    actionType: "reply",
    actionLabel: "Überprüfen & antworten",
    actionDescription: "Inhalt prüfen und ggf. antworten",
    actionPayload: {
      draft: "",
      tone: "professional",
    },
    confidence: 40,
    reasoning: "No specific action detected - review recommended",
  };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Generate recommendations for multiple items (batch)
 */
export async function generateBatchRecommendations(
  items: InboxItem[],
  context?: AnalysisContext
): Promise<Map<string, GeneratedRecommendation[]>> {
  const results = new Map<string, GeneratedRecommendation[]>();

  // Process in parallel with concurrency limit
  const batchSize = 10;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const promises = batch.map(async (item) => {
      const recs = await generateRecommendations(item, context);
      results.set(item.id, recs);
    });
    await Promise.all(promises);
  }

  return results;
}

/**
 * Quick priority scan for inbox items (fast, no recommendations)
 */
export function quickPriorityScan(
  items: InboxItem[]
): Map<string, PriorityResult> {
  const results = new Map<string, PriorityResult>();

  for (const item of items) {
    results.set(item.id, detectPriority(item));
  }

  return results;
}

// ============================================================================
// EXPORT FOR TESTING
// ============================================================================

export {
  detectPriority,
  classifyContentType,
  extractDeadline,
  isVipSender,
  needsAttentionToday,
};
export type { ContentType, PriorityResult };

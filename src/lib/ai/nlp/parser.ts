/**
 * Natural Language Processing for Task Creation
 * 
 * Parses natural language input into structured task data using
 * pattern matching, entity extraction, and contextual understanding.
 */

import {
  ParsedTaskIntent,
  NLPEntityExtraction,
  ExtractedDate,
  ExtractedDuration,
  ExtractedPriority,
  ExtractedContext,
  TaskPriority,
  TaskContextType,
  Ambiguity,
} from '../types';

// ============================================================================
// DATE PARSING
// ============================================================================

const RELATIVE_DATE_PATTERNS: Array<{ pattern: RegExp; resolver: (match: RegExpMatchArray, now: Date) => Date }> = [
  {
    pattern: /\b(today)\b/i,
    resolver: (_, now) => now,
  },
  {
    pattern: /\b(tomorrow)\b/i,
    resolver: (_, now) => addDays(now, 1),
  },
  {
    pattern: /\b(yesterday)\b/i,
    resolver: (_, now) => addDays(now, -1),
  },
  {
    pattern: /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    resolver: (match, now) => getNextDayOfWeek(now, match[1]),
  },
  {
    pattern: /\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    resolver: (match, now) => getThisDayOfWeek(now, match[1]),
  },
  {
    pattern: /\bin\s+(\d+)\s+(day|days)\b/i,
    resolver: (match, now) => addDays(now, parseInt(match[1])),
  },
  {
    pattern: /\bin\s+(\d+)\s+(week|weeks)\b/i,
    resolver: (match, now) => addDays(now, parseInt(match[1]) * 7),
  },
  {
    pattern: /\bin\s+(\d+)\s+(month|months)\b/i,
    resolver: (match, now) => addMonths(now, parseInt(match[1])),
  },
  {
    pattern: /\bnext\s+week\b/i,
    resolver: (_, now) => addDays(now, 7),
  },
  {
    pattern: /\bend\s+of\s+(week|month|year)\b/i,
    resolver: (match, now) => getEndOf(now, match[1]),
  },
  {
    pattern: /\b(eow|eod|eom)\b/i,
    resolver: (match, now) => {
      const abbrev = match[1].toLowerCase();
      if (abbrev === 'eod') return setEndOfDay(now);
      if (abbrev === 'eow') return getEndOf(now, 'week');
      return getEndOf(now, 'month');
    },
  },
];

const ABSOLUTE_DATE_PATTERNS: Array<{ pattern: RegExp; resolver: (match: RegExpMatchArray, now: Date) => Date }> = [
  {
    // MM/DD or MM/DD/YYYY
    pattern: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
    resolver: (match, now) => {
      const month = parseInt(match[1]) - 1;
      const day = parseInt(match[2]);
      const year = match[3] ? normalizeYear(parseInt(match[3])) : now.getFullYear();
      return new Date(year, month, day);
    },
  },
  {
    // YYYY-MM-DD (ISO format)
    pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/,
    resolver: (match) => new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3])),
  },
  {
    // Month DD or Month DDth
    pattern: /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
    resolver: (match, now) => {
      const month = parseMonthName(match[1]);
      const day = parseInt(match[2]);
      let year = now.getFullYear();
      const date = new Date(year, month, day);
      if (date < now) year++; // Assume next year if date passed
      return new Date(year, month, day);
    },
  },
];

// ============================================================================
// DURATION PARSING
// ============================================================================

const DURATION_PATTERNS: Array<{ pattern: RegExp; resolver: (match: RegExpMatchArray) => number }> = [
  {
    pattern: /\b(\d+(?:\.\d+)?)\s*h(?:our)?s?\b/i,
    resolver: (match) => Math.round(parseFloat(match[1]) * 60),
  },
  {
    pattern: /\b(\d+)\s*m(?:in(?:ute)?s?)?\b/i,
    resolver: (match) => parseInt(match[1]),
  },
  {
    pattern: /\b(\d+(?:\.\d+)?)\s*hr?s?\b/i,
    resolver: (match) => Math.round(parseFloat(match[1]) * 60),
  },
  {
    pattern: /\b(\d+):(\d{2})\b/,
    resolver: (match) => parseInt(match[1]) * 60 + parseInt(match[2]),
  },
  {
    // Pomodoro-style
    pattern: /\b(\d+)\s*pomodoro(?:s)?\b/i,
    resolver: (match) => parseInt(match[1]) * 25,
  },
  {
    // Quick estimates
    pattern: /\b(quick|brief|short)\b/i,
    resolver: () => 15,
  },
  {
    pattern: /\b(half\s+(?:an?\s+)?hour)\b/i,
    resolver: () => 30,
  },
  {
    pattern: /\b(an?\s+hour)\b/i,
    resolver: () => 60,
  },
];

// ============================================================================
// PRIORITY PARSING
// ============================================================================

const PRIORITY_KEYWORDS: Record<string, TaskPriority> = {
  // Critical
  'asap': 'critical',
  'urgent': 'critical',
  'emergency': 'critical',
  'critical': 'critical',
  'immediately': 'critical',
  'right now': 'critical',
  '!!!': 'critical',
  'p0': 'critical',
  
  // High
  'important': 'high',
  'high priority': 'high',
  'high': 'high',
  'p1': 'high',
  '!!': 'high',
  'soon': 'high',
  
  // Medium
  'medium': 'medium',
  'normal': 'medium',
  'p2': 'medium',
  '!': 'medium',
  
  // Low
  'low': 'low',
  'low priority': 'low',
  'when possible': 'low',
  'p3': 'low',
  'eventually': 'low',
  
  // Someday
  'someday': 'someday',
  'maybe': 'someday',
  'backlog': 'someday',
  'nice to have': 'someday',
  'p4': 'someday',
};

// ============================================================================
// CONTEXT PARSING
// ============================================================================

const CONTEXT_KEYWORDS: Record<string, TaskContextType> = {
  // Work
  'work': 'work',
  'office': 'work',
  'meeting': 'work',
  'client': 'work',
  'project': 'work',
  'deadline': 'work',
  'presentation': 'work',
  'report': 'work',
  
  // Personal
  'personal': 'personal',
  'home': 'personal',
  'family': 'personal',
  'errand': 'personal',
  'chore': 'personal',
  
  // Health
  'health': 'health',
  'doctor': 'health',
  'gym': 'health',
  'workout': 'health',
  'exercise': 'health',
  'medication': 'health',
  'appointment': 'health',
  
  // Finance
  'finance': 'finance',
  'money': 'finance',
  'bill': 'finance',
  'payment': 'finance',
  'invoice': 'finance',
  'budget': 'finance',
  'tax': 'finance',
  
  // Learning
  'learn': 'learning',
  'study': 'learning',
  'course': 'learning',
  'read': 'learning',
  'book': 'learning',
  'tutorial': 'learning',
  
  // Social
  'social': 'social',
  'friend': 'social',
  'party': 'social',
  'dinner': 'social',
  'call': 'social',
  'catch up': 'social',
};

// ============================================================================
// MAIN PARSER
// ============================================================================

export class TaskNLPParser {
  private now: Date;

  constructor(referenceDate?: Date) {
    this.now = referenceDate || new Date();
  }

  /**
   * Parse natural language input into a structured task intent
   */
  parse(input: string): ParsedTaskIntent {
    const extraction = this.extractEntities(input);
    const cleanedTitle = this.cleanTitle(input, extraction);
    const ambiguities = this.detectAmbiguities(input, extraction);
    
    // Calculate overall confidence based on extraction quality
    const confidence = this.calculateConfidence(extraction, ambiguities);

    return {
      title: cleanedTitle,
      description: undefined, // Could be enhanced with AI
      dueDate: extraction.dates[0]?.value,
      duration: extraction.durations[0]?.minutes,
      priority: extraction.priorities[0]?.value,
      context: extraction.contexts.map(c => c.value),
      tags: extraction.tags,
      confidence,
      ambiguities,
    };
  }

  /**
   * Extract all entities from input text
   */
  extractEntities(input: string): NLPEntityExtraction {
    return {
      dates: this.extractDates(input),
      durations: this.extractDurations(input),
      priorities: this.extractPriorities(input),
      contexts: this.extractContexts(input),
      tags: this.extractTags(input),
    };
  }

  /**
   * Extract date references from input
   */
  private extractDates(input: string): ExtractedDate[] {
    const dates: ExtractedDate[] = [];

    // Try relative patterns first (higher priority)
    for (const { pattern, resolver } of RELATIVE_DATE_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        dates.push({
          text: match[0],
          value: resolver(match, this.now),
          confidence: 0.9,
          isRelative: true,
        });
      }
    }

    // Try absolute patterns
    for (const { pattern, resolver } of ABSOLUTE_DATE_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        dates.push({
          text: match[0],
          value: resolver(match, this.now),
          confidence: 0.95,
          isRelative: false,
        });
      }
    }

    // Sort by confidence and return unique dates
    return this.deduplicateDates(dates);
  }

  /**
   * Extract duration estimates from input
   */
  private extractDurations(input: string): ExtractedDuration[] {
    const durations: ExtractedDuration[] = [];

    for (const { pattern, resolver } of DURATION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        durations.push({
          text: match[0],
          minutes: resolver(match),
          confidence: 0.85,
        });
      }
    }

    return durations;
  }

  /**
   * Extract priority indicators from input
   */
  private extractPriorities(input: string): ExtractedPriority[] {
    const priorities: ExtractedPriority[] = [];
    const lowerInput = input.toLowerCase();

    for (const [keyword, priority] of Object.entries(PRIORITY_KEYWORDS)) {
      if (lowerInput.includes(keyword)) {
        priorities.push({
          text: keyword,
          value: priority,
          confidence: keyword.length > 3 ? 0.9 : 0.7, // Longer keywords more reliable
        });
      }
    }

    // Sort by confidence
    return priorities.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract context categories from input
   */
  private extractContexts(input: string): ExtractedContext[] {
    const contexts: ExtractedContext[] = [];
    const lowerInput = input.toLowerCase();
    const seen = new Set<TaskContextType>();

    for (const [keyword, context] of Object.entries(CONTEXT_KEYWORDS)) {
      if (lowerInput.includes(keyword) && !seen.has(context)) {
        seen.add(context);
        contexts.push({
          text: keyword,
          value: context,
          confidence: 0.8,
        });
      }
    }

    return contexts;
  }

  /**
   * Extract hashtags and @mentions as tags
   */
  private extractTags(input: string): string[] {
    const tags: string[] = [];

    // Hashtags
    const hashtagMatches = input.match(/#(\w+)/g);
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(t => t.slice(1)));
    }

    // @mentions (could be project or person references)
    const mentionMatches = input.match(/@(\w+)/g);
    if (mentionMatches) {
      tags.push(...mentionMatches.map(t => t.slice(1)));
    }

    return Array.from(new Set(tags)); // Deduplicate
  }

  /**
   * Clean the title by removing extracted entities
   */
  private cleanTitle(input: string, extraction: NLPEntityExtraction): string {
    let title = input;

    // Remove date references
    for (const date of extraction.dates) {
      title = title.replace(date.text, '');
    }

    // Remove duration references
    for (const duration of extraction.durations) {
      title = title.replace(duration.text, '');
    }

    // Remove priority keywords
    for (const priority of extraction.priorities) {
      title = title.replace(new RegExp(priority.text, 'gi'), '');
    }

    // Remove tags
    title = title.replace(/#\w+/g, '').replace(/@\w+/g, '');

    // Remove common prepositions left hanging
    title = title.replace(/\b(by|due|for|in|on|at|until|before)\s*$/gi, '');
    title = title.replace(/^\s*(by|due|for|in|on|at|until|before)\b/gi, '');

    // Clean up whitespace
    return title.replace(/\s+/g, ' ').trim();
  }

  /**
   * Detect ambiguities in the parsed input
   */
  private detectAmbiguities(input: string, extraction: NLPEntityExtraction): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];

    // Multiple dates detected
    if (extraction.dates.length > 1) {
      ambiguities.push({
        field: 'dueDate',
        options: extraction.dates.map(d => d.text),
        context: 'Multiple date references found',
      });
    }

    // Multiple durations detected
    if (extraction.durations.length > 1) {
      ambiguities.push({
        field: 'duration',
        options: extraction.durations.map(d => `${d.minutes} minutes`),
        context: 'Multiple duration estimates found',
      });
    }

    // Conflicting priorities
    if (extraction.priorities.length > 1) {
      const uniquePriorities = Array.from(new Set(extraction.priorities.map(p => p.value)));
      if (uniquePriorities.length > 1) {
        ambiguities.push({
          field: 'priority',
          options: extraction.priorities.map(p => p.text),
          context: 'Conflicting priority indicators',
        });
      }
    }

    return ambiguities;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(extraction: NLPEntityExtraction, ambiguities: Ambiguity[]): number {
    let confidence = 1.0;

    // Reduce confidence for each ambiguity
    confidence -= ambiguities.length * 0.15;

    // Boost confidence if we extracted meaningful data
    if (extraction.dates.length > 0) confidence += 0.1;
    if (extraction.durations.length > 0) confidence += 0.1;
    if (extraction.priorities.length > 0) confidence += 0.05;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Deduplicate dates that resolve to the same value
   */
  private deduplicateDates(dates: ExtractedDate[]): ExtractedDate[] {
    const seen = new Map<string, ExtractedDate>();
    
    for (const date of dates) {
      const key = date.value.toISOString().split('T')[0];
      const existing = seen.get(key);
      if (!existing || date.confidence > existing.confidence) {
        seen.set(key, date);
      }
    }

    return Array.from(seen.values());
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function setEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getNextDayOfWeek(from: Date, dayName: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  const currentDay = from.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7;
  return addDays(from, daysToAdd);
}

function getThisDayOfWeek(from: Date, dayName: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  const currentDay = from.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;
  return addDays(from, daysToAdd);
}

function getEndOf(date: Date, period: string): Date {
  const result = new Date(date);
  
  switch (period.toLowerCase()) {
    case 'week':
      // End of week (Sunday)
      const daysUntilSunday = 7 - result.getDay();
      result.setDate(result.getDate() + daysUntilSunday);
      break;
    case 'month':
      result.setMonth(result.getMonth() + 1, 0); // Last day of current month
      break;
    case 'year':
      result.setMonth(11, 31); // December 31
      break;
  }
  
  return setEndOfDay(result);
}

function parseMonthName(name: string): number {
  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };
  return months[name.toLowerCase()] ?? 0;
}

function normalizeYear(year: number): number {
  if (year < 100) {
    return year + 2000; // Assume 21st century for 2-digit years
  }
  return year;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick parse function for simple use cases
 */
export function parseTaskFromText(input: string, referenceDate?: Date): ParsedTaskIntent {
  const parser = new TaskNLPParser(referenceDate);
  return parser.parse(input);
}

/**
 * Extract just the due date from text
 */
export function extractDueDate(input: string, referenceDate?: Date): Date | undefined {
  const parser = new TaskNLPParser(referenceDate);
  const dates = parser.extractEntities(input).dates;
  return dates[0]?.value;
}

/**
 * Validate and normalize task title
 */
export function normalizeTaskTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-\*\•]+/, '') // Remove leading bullets/dashes
    .trim();
}

/**
 * Intelligent Context Routing Algorithm
 * 
 * Routes incoming messages to the most appropriate context based on:
 * - Intent classification
 * - Content analysis
 * - Historical patterns
 * - Active context state
 * - User preferences
 */

import {
  Context,
  ContextType,
  RoutingDecision,
  RoutingHint,
  DetectedIntent,
  IntentType,
  AlternativeRoute,
  RecommendationContext,
} from './types';

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

interface IntentPattern {
  type: IntentType;
  patterns: RegExp[];
  keywords: string[];
  priority: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    type: 'task_creation',
    patterns: [
      /create\s+(a\s+)?task/i,
      /add\s+(a\s+)?todo/i,
      /remind\s+me\s+to/i,
      /schedule\s+(a\s+)?/i,
      /set\s+up\s+(a\s+)?/i,
    ],
    keywords: ['task', 'todo', 'reminder', 'schedule', 'create', 'add', 'make'],
    priority: 8,
  },
  {
    type: 'context_switch',
    patterns: [
      /switch\s+to\s+/i,
      /go\s+(back\s+)?to\s+/i,
      /open\s+(the\s+)?/i,
      /show\s+me\s+(the\s+)?/i,
      /let'?s\s+talk\s+about/i,
    ],
    keywords: ['switch', 'context', 'thread', 'conversation', 'back', 'return'],
    priority: 9,
  },
  {
    type: 'question',
    patterns: [
      /^(what|who|where|when|why|how|which|is|are|can|could|would|should|do|does|did)/i,
      /\?$/,
    ],
    keywords: ['explain', 'tell', 'describe', 'help', 'understand'],
    priority: 5,
  },
  {
    type: 'command',
    patterns: [
      /^(run|execute|start|stop|restart|install|deploy|build|test)/i,
      /^(delete|remove|clear|reset)/i,
      /^(send|post|publish|share)/i,
    ],
    keywords: ['run', 'execute', 'start', 'stop', 'deploy', 'install'],
    priority: 7,
  },
  {
    type: 'request',
    patterns: [
      /^(please\s+)?(can|could|would)\s+you/i,
      /^(i\s+)?(need|want|would\s+like)/i,
      /^help\s+(me\s+)?/i,
    ],
    keywords: ['please', 'help', 'need', 'want', 'could'],
    priority: 6,
  },
  {
    type: 'clarification',
    patterns: [
      /what\s+do\s+you\s+mean/i,
      /can\s+you\s+clarify/i,
      /i\s+don'?t\s+understand/i,
      /elaborate\s+on/i,
    ],
    keywords: ['clarify', 'explain', 'elaborate', 'mean', 'confused'],
    priority: 7,
  },
  {
    type: 'feedback',
    patterns: [
      /^(good|great|nice|awesome|perfect|thanks|thank\s+you)/i,
      /^(bad|wrong|incorrect|no|nope)/i,
      /that'?s\s+(right|correct|wrong|incorrect)/i,
    ],
    keywords: ['thanks', 'good', 'bad', 'wrong', 'correct', 'perfect'],
    priority: 4,
  },
  {
    type: 'information',
    patterns: [
      /^(here'?s|this\s+is|fyi|note)/i,
      /^(update|status|report)/i,
    ],
    keywords: ['here', 'update', 'status', 'info', 'note', 'fyi'],
    priority: 5,
  },
  {
    type: 'greeting',
    patterns: [
      /^(hi|hello|hey|good\s+(morning|afternoon|evening))/i,
      /^(howdy|greetings|yo)/i,
    ],
    keywords: ['hi', 'hello', 'hey', 'morning', 'afternoon', 'evening'],
    priority: 2,
  },
  {
    type: 'farewell',
    patterns: [
      /^(bye|goodbye|see\s+you|talk\s+later|gtg|gotta\s+go)/i,
      /^(good\s+night|have\s+a\s+good)/i,
    ],
    keywords: ['bye', 'goodbye', 'later', 'night'],
    priority: 2,
  },
];

// ============================================================================
// CONTEXT TYPE PATTERNS
// ============================================================================

interface ContextPattern {
  type: ContextType;
  patterns: RegExp[];
  keywords: string[];
  domains: string[];
}

const CONTEXT_PATTERNS: ContextPattern[] = [
  {
    type: 'specialist',
    patterns: [
      /\b(code|function|class|method|variable|api|bug|error|debug)/i,
      /\b(review|refactor|optimize|implement|test)/i,
      /```[\s\S]*```/,
    ],
    keywords: ['code', 'function', 'api', 'bug', 'debug', 'implement', 'review'],
    domains: ['programming', 'development', 'coding'],
  },
  {
    type: 'task',
    patterns: [
      /\b(research|analyze|investigate|find|search)\b/i,
      /\b(in\s+the\s+background|separately|async)/i,
      /\b(long-running|take\s+a\s+while|batch)/i,
    ],
    keywords: ['research', 'analyze', 'background', 'batch', 'async'],
    domains: ['research', 'analysis', 'investigation'],
  },
  {
    type: 'background',
    patterns: [
      /\b(heartbeat|cron|schedule|periodic|monitor)/i,
      /\b(check\s+(in|on)|keep\s+an\s+eye)/i,
    ],
    keywords: ['heartbeat', 'cron', 'schedule', 'monitor', 'periodic'],
    domains: ['monitoring', 'automation', 'scheduling'],
  },
  {
    type: 'external',
    patterns: [
      /\b(discord|slack|telegram|whatsapp|group\s+chat)/i,
      /\b(channel|server|team|group)/i,
    ],
    keywords: ['discord', 'slack', 'telegram', 'channel', 'group'],
    domains: ['communication', 'messaging', 'social'],
  },
];

// ============================================================================
// INTELLIGENT CONTEXT ROUTER
// ============================================================================

export class IntelligentContextRouter {
  private routingHints: RoutingHint[] = [];
  private contextHistory: Map<string, number> = new Map(); // contextId -> usage count

  /**
   * Add custom routing hints
   */
  addRoutingHint(hint: RoutingHint): void {
    this.routingHints.push(hint);
    this.routingHints.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove a routing hint
   */
  removeRoutingHint(pattern: string): void {
    this.routingHints = this.routingHints.filter(h => h.pattern !== pattern);
  }

  /**
   * Route a message to the most appropriate context
   */
  route(
    message: string,
    contexts: Map<string, Context>,
    currentContextId: string | null,
    userPreferences?: RecommendationContext['userPreferences']
  ): RoutingDecision {
    // Step 1: Detect intent
    const intents = this.classifyIntent(message);
    const primaryIntent = intents[0];

    // Step 2: Check for explicit context switch requests
    const explicitSwitch = this.detectExplicitSwitch(message, contexts);
    if (explicitSwitch) {
      return explicitSwitch;
    }

    // Step 3: Check custom routing hints
    const hintMatch = this.matchRoutingHints(message);
    if (hintMatch) {
      const matchingContext = this.findContextByType(contexts, hintMatch.contextType);
      if (matchingContext) {
        return {
          targetContextId: matchingContext.id,
          confidence: 0.85,
          reasoning: [`Matched routing hint: ${hintMatch.description || hintMatch.pattern}`],
          alternatives: [],
          suggestNewContext: false,
        };
      }
    }

    // Step 4: Analyze content for context type
    const suggestedType = this.analyzeContentForContextType(message);

    // Step 5: Score existing contexts
    const contextScores = this.scoreContexts(
      message,
      intents,
      contexts,
      currentContextId
    );

    // Step 6: Determine routing decision
    const sortedScores = Array.from(contextScores.entries())
      .sort((a, b) => b[1].score - a[1].score);

    const topScore = sortedScores[0];

    // If current context is good enough, stay there
    if (currentContextId && contextScores.has(currentContextId)) {
      const currentScore = contextScores.get(currentContextId)!;
      if (currentScore.score >= 0.7 && topScore[1].score - currentScore.score < 0.2) {
        return {
          targetContextId: currentContextId,
          confidence: currentScore.score,
          reasoning: ['Current context is suitable for this message'],
          alternatives: this.buildAlternatives(sortedScores.slice(1, 4), contexts),
          suggestNewContext: false,
        };
      }
    }

    // If no good match, suggest new context
    if (!topScore || topScore[1].score < 0.5) {
      return {
        targetContextId: currentContextId || '',
        confidence: topScore?.[1].score || 0,
        reasoning: ['No existing context is a good match'],
        alternatives: this.buildAlternatives(sortedScores.slice(0, 3), contexts),
        suggestNewContext: true,
        suggestedContextType: suggestedType || 'primary',
      };
    }

    return {
      targetContextId: topScore[0],
      confidence: topScore[1].score,
      reasoning: topScore[1].reasons,
      alternatives: this.buildAlternatives(sortedScores.slice(1, 4), contexts),
      suggestNewContext: false,
    };
  }

  /**
   * Classify message intent
   */
  classifyIntent(message: string): DetectedIntent[] {
    const intents: DetectedIntent[] = [];
    const messageLower = message.toLowerCase();

    for (const pattern of INTENT_PATTERNS) {
      let confidence = 0;
      const entities: Record<string, string> = {};

      // Check regex patterns
      for (const regex of pattern.patterns) {
        const match = regex.exec(message);
        if (match) {
          confidence = Math.max(confidence, 0.8);
          if (match.groups) {
            Object.assign(entities, match.groups);
          }
        }
      }

      // Check keywords
      let keywordMatches = 0;
      for (const keyword of pattern.keywords) {
        if (messageLower.includes(keyword)) {
          keywordMatches++;
        }
      }
      if (keywordMatches > 0) {
        const keywordScore = Math.min(keywordMatches * 0.2, 0.6);
        confidence = Math.max(confidence, keywordScore);
      }

      if (confidence > 0) {
        intents.push({
          type: pattern.type,
          confidence: confidence * (pattern.priority / 10),
          entities,
          originalText: message,
        });
      }
    }

    // Sort by confidence
    intents.sort((a, b) => b.confidence - a.confidence);

    // If no intent detected, default to information
    if (intents.length === 0) {
      intents.push({
        type: 'information',
        confidence: 0.3,
        entities: {},
        originalText: message,
      });
    }

    return intents;
  }

  /**
   * Detect explicit context switch requests
   */
  private detectExplicitSwitch(
    message: string,
    contexts: Map<string, Context>
  ): RoutingDecision | null {
    const switchPatterns = [
      /switch\s+to\s+["']?([^"'\n]+)["']?/i,
      /go\s+(?:back\s+)?to\s+["']?([^"'\n]+)["']?/i,
      /open\s+(?:the\s+)?["']?([^"'\n]+)["']?\s+(?:context|thread|conversation)/i,
    ];

    for (const pattern of switchPatterns) {
      const match = pattern.exec(message);
      if (match) {
        const targetName = match[1].toLowerCase().trim();
        
        // Find matching context
        for (const [id, context] of contexts) {
          if (
            context.goal?.toLowerCase().includes(targetName) ||
            id.toLowerCase().includes(targetName)
          ) {
            return {
              targetContextId: id,
              confidence: 0.95,
              reasoning: [`Explicit switch request to "${match[1]}"`],
              alternatives: [],
              suggestNewContext: false,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Match against custom routing hints
   */
  private matchRoutingHints(message: string): RoutingHint | null {
    for (const hint of this.routingHints) {
      try {
        const regex = new RegExp(hint.pattern, 'i');
        if (regex.test(message)) {
          return hint;
        }
      } catch {
        // Invalid regex, try as substring
        if (message.toLowerCase().includes(hint.pattern.toLowerCase())) {
          return hint;
        }
      }
    }
    return null;
  }

  /**
   * Analyze message content to suggest context type
   */
  private analyzeContentForContextType(message: string): ContextType | null {
    const messageLower = message.toLowerCase();

    for (const pattern of CONTEXT_PATTERNS) {
      let matchScore = 0;

      // Check regex patterns
      for (const regex of pattern.patterns) {
        if (regex.test(message)) {
          matchScore += 0.4;
        }
      }

      // Check keywords
      for (const keyword of pattern.keywords) {
        if (messageLower.includes(keyword)) {
          matchScore += 0.2;
        }
      }

      // Check domains
      for (const domain of pattern.domains) {
        if (messageLower.includes(domain)) {
          matchScore += 0.1;
        }
      }

      if (matchScore >= 0.5) {
        return pattern.type;
      }
    }

    return null;
  }

  /**
   * Score existing contexts for relevance to message
   */
  private scoreContexts(
    message: string,
    intents: DetectedIntent[],
    contexts: Map<string, Context>,
    currentContextId: string | null
  ): Map<string, { score: number; reasons: string[] }> {
    const scores = new Map<string, { score: number; reasons: string[] }>();
    const messageLower = message.toLowerCase();
    const messageWords = new Set(messageLower.split(/\s+/));

    for (const [id, context] of contexts) {
      let score = 0;
      const reasons: string[] = [];

      // Skip archived/failed contexts
      if (context.status === 'archived' || context.status === 'failed') {
        continue;
      }

      // Factor 1: Recency bonus (current context gets a boost)
      if (id === currentContextId) {
        score += 0.2;
        reasons.push('Current active context');
      }

      // Factor 2: Goal/topic match
      if (context.goal) {
        const goalWords = new Set(context.goal.toLowerCase().split(/\s+/));
        const overlap = [...messageWords].filter(w => goalWords.has(w)).length;
        if (overlap > 0) {
          const goalScore = Math.min(overlap * 0.15, 0.4);
          score += goalScore;
          reasons.push(`Goal match: "${context.goal}"`);
        }
      }

      // Factor 3: Recent message similarity
      const recentMessages = context.messages.slice(-10);
      for (const msg of recentMessages) {
        const msgWords = new Set(msg.content.toLowerCase().split(/\s+/));
        const overlap = [...messageWords].filter(w => msgWords.has(w)).length;
        if (overlap > 2) {
          score += 0.1;
          reasons.push('Similar to recent messages');
          break;
        }
      }

      // Factor 4: Intent compatibility
      const primaryIntent = intents[0];
      if (primaryIntent) {
        // Task creation → task context
        if (primaryIntent.type === 'task_creation' && context.type === 'task') {
          score += 0.3;
          reasons.push('Task creation intent matches task context');
        }
        // Commands → primary or specialist
        if (primaryIntent.type === 'command' && 
            (context.type === 'primary' || context.type === 'specialist')) {
          score += 0.2;
          reasons.push('Command intent suitable for this context');
        }
      }

      // Factor 5: Context type match with content analysis
      const suggestedType = this.analyzeContentForContextType(message);
      if (suggestedType && context.type === suggestedType) {
        score += 0.25;
        reasons.push(`Content suggests ${suggestedType} context`);
      }

      // Factor 6: Entity overlap with extracted entities
      for (const entity of context.summary?.entities || []) {
        if (messageLower.includes(entity.value.toLowerCase())) {
          score += 0.15;
          reasons.push(`Mentions entity: ${entity.value}`);
        }
      }

      // Factor 7: Historical usage
      const usageCount = this.contextHistory.get(id) || 0;
      if (usageCount > 5) {
        score += 0.05;
        reasons.push('Frequently used context');
      }

      // Factor 8: Active context status bonus
      if (context.status === 'active') {
        score += 0.1;
        reasons.push('Context is active');
      }

      // Normalize score to 0-1
      score = Math.min(score, 1);

      if (score > 0.1) {
        scores.set(id, { score, reasons });
      }
    }

    return scores;
  }

  /**
   * Build alternative routing options
   */
  private buildAlternatives(
    sortedScores: Array<[string, { score: number; reasons: string[] }]>,
    contexts: Map<string, Context>
  ): AlternativeRoute[] {
    return sortedScores
      .filter(([_, s]) => s.score > 0.3)
      .map(([id, s]) => ({
        contextId: id,
        confidence: s.score,
        reasoning: s.reasons.join('; '),
      }));
  }

  /**
   * Find a context by type
   */
  private findContextByType(
    contexts: Map<string, Context>,
    type: ContextType
  ): Context | null {
    for (const context of contexts.values()) {
      if (context.type === type && context.status === 'active') {
        return context;
      }
    }
    return null;
  }

  /**
   * Record context usage for historical learning
   */
  recordContextUsage(contextId: string): void {
    const current = this.contextHistory.get(contextId) || 0;
    this.contextHistory.set(contextId, current + 1);
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalRoutings: number;
    contextUsage: Record<string, number>;
    customHints: number;
  } {
    let total = 0;
    const usage: Record<string, number> = {};

    for (const [id, count] of this.contextHistory) {
      usage[id] = count;
      total += count;
    }

    return {
      totalRoutings: total,
      contextUsage: usage,
      customHints: this.routingHints.length,
    };
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE
// ============================================================================

let routerInstance: IntelligentContextRouter | null = null;

export function getContextRouter(): IntelligentContextRouter {
  if (!routerInstance) {
    routerInstance = new IntelligentContextRouter();
  }
  return routerInstance;
}

export function routeMessage(
  message: string,
  contexts: Map<string, Context>,
  currentContextId: string | null
): RoutingDecision {
  return getContextRouter().route(message, contexts, currentContextId);
}

export function classifyMessageIntent(message: string): DetectedIntent[] {
  return getContextRouter().classifyIntent(message);
}

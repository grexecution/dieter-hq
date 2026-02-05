/**
 * Context Summarization and Transition Logic
 * 
 * Handles:
 * - Automatic context summarization
 * - Context transitions and handoffs
 * - State preservation during switches
 * - Memory compression and management
 */

import {
  Context,
  ContextMessage,
  ContextSummary,
  DecisionRecord,
  ExtractedEntity,
  EntityType,
  SentimentScore,
  ContextTransition,
  TransitionType,
  TransitionPlan,
  ContextSwitchOptions,
} from './types';

// ============================================================================
// ENTITY EXTRACTION
// ============================================================================

interface EntityPattern {
  type: EntityType;
  patterns: RegExp[];
}

const ENTITY_PATTERNS: EntityPattern[] = [
  {
    type: 'person',
    patterns: [
      /@(\w+)/g,                                    // @mentions
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g,     // Proper names
    ],
  },
  {
    type: 'organization',
    patterns: [
      /\b(Google|Microsoft|Apple|Amazon|Meta|OpenAI|Anthropic|GitHub)\b/gi,
      /\b([A-Z][a-z]*(?:Corp|Inc|LLC|Ltd|Co)\b)/g,
    ],
  },
  {
    type: 'project',
    patterns: [
      /project\s+["']?([^"'\n]+)["']?/gi,
      /\b(dieter-hq|openclaw|workspace)\b/gi,
    ],
  },
  {
    type: 'technology',
    patterns: [
      /\b(React|Vue|Angular|Node\.?js|Python|TypeScript|JavaScript|Rust|Go|Docker|Kubernetes|AWS|GCP|Azure)\b/gi,
      /\b(PostgreSQL|MongoDB|Redis|MySQL|SQLite)\b/gi,
      /\b(Next\.?js|Express|FastAPI|Django|Flask)\b/gi,
    ],
  },
  {
    type: 'date',
    patterns: [
      /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
      /\b(\d{4}-\d{2}-\d{2})\b/g,
      /\b(tomorrow|yesterday|today|next\s+\w+|last\s+\w+)\b/gi,
      /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
    ],
  },
  {
    type: 'file',
    patterns: [
      /\b([\w.-]+\.(ts|js|tsx|jsx|py|rs|go|md|json|yaml|yml|css|html))\b/g,
      /`([^`]+\.[a-z]+)`/g,
    ],
  },
  {
    type: 'url',
    patterns: [
      /https?:\/\/[^\s<>"{}|\\^`[\]]+/g,
    ],
  },
  {
    type: 'task',
    patterns: [
      /TODO:?\s*(.+?)(?:\n|$)/gi,
      /FIXME:?\s*(.+?)(?:\n|$)/gi,
      /\[ \]\s*(.+?)(?:\n|$)/g,      // Unchecked checkbox
    ],
  },
];

// ============================================================================
// CONTEXT SUMMARIZER
// ============================================================================

export class ContextSummarizer {
  private summaryCache: Map<string, ContextSummary> = new Map();

  /**
   * Generate a summary for a context
   */
  summarize(context: Context, options?: SummarizeOptions): ContextSummary {
    const messages = options?.messageRange 
      ? context.messages.slice(options.messageRange.from, options.messageRange.to)
      : context.messages;

    if (messages.length === 0) {
      return this.createEmptySummary(context.id);
    }

    // Extract text content
    const combinedText = messages.map(m => m.content).join('\n\n');

    // Generate summaries
    const shortSummary = this.generateShortSummary(messages, context);
    const fullSummary = this.generateFullSummary(messages, context);
    const keyPoints = this.extractKeyPoints(messages);
    const decisions = this.extractDecisions(messages);
    const entities = this.extractEntities(combinedText);
    const topics = this.extractTopics(combinedText);
    const sentiment = this.analyzeSentiment(combinedText);

    // Calculate compression ratio
    const originalTokens = this.estimateTokens(combinedText);
    const summaryTokens = this.estimateTokens(shortSummary + fullSummary);
    const compressionRatio = originalTokens / Math.max(summaryTokens, 1);

    const summary: ContextSummary = {
      id: `summary_${Date.now()}`,
      contextId: context.id,
      shortSummary,
      fullSummary,
      keyPoints,
      decisions,
      entities,
      topics,
      sentiment,
      createdAt: new Date(),
      messageRange: {
        from: options?.messageRange?.from ?? 0,
        to: options?.messageRange?.to ?? messages.length,
      },
      compressionRatio,
    };

    // Cache the summary
    this.summaryCache.set(context.id, summary);

    return summary;
  }

  /**
   * Generate an incremental summary (update existing)
   */
  incrementalSummarize(
    context: Context,
    existingSummary: ContextSummary,
    newMessages: ContextMessage[]
  ): ContextSummary {
    if (newMessages.length === 0) {
      return existingSummary;
    }

    const newText = newMessages.map(m => m.content).join('\n\n');

    // Extract new information
    const newKeyPoints = this.extractKeyPoints(newMessages);
    const newDecisions = this.extractDecisions(newMessages);
    const newEntities = this.extractEntities(newText);
    const newTopics = this.extractTopics(newText);

    // Merge with existing
    const mergedKeyPoints = this.mergeKeyPoints(existingSummary.keyPoints, newKeyPoints);
    const mergedDecisions = [...existingSummary.decisions, ...newDecisions];
    const mergedEntities = this.mergeEntities(existingSummary.entities, newEntities);
    const mergedTopics = this.mergeTopics(existingSummary.topics, newTopics);

    // Regenerate short summary with full context
    const allMessages = context.messages;
    const shortSummary = this.generateShortSummary(allMessages, context);

    // Update full summary
    const updateAddendum = this.generateUpdateSummary(newMessages);
    const fullSummary = existingSummary.fullSummary + '\n\n' + updateAddendum;

    // Recalculate sentiment with combined text
    const combinedText = allMessages.map(m => m.content).join('\n\n');
    const sentiment = this.analyzeSentiment(combinedText);

    return {
      ...existingSummary,
      shortSummary,
      fullSummary: this.trimSummary(fullSummary, 2000),
      keyPoints: mergedKeyPoints.slice(0, 10),
      decisions: mergedDecisions.slice(-20),
      entities: mergedEntities,
      topics: mergedTopics.slice(0, 15),
      sentiment,
      createdAt: new Date(),
      messageRange: {
        from: existingSummary.messageRange.from,
        to: context.messages.length,
      },
    };
  }

  /**
   * Get cached summary
   */
  getCachedSummary(contextId: string): ContextSummary | null {
    return this.summaryCache.get(contextId) || null;
  }

  /**
   * Check if summary needs update
   */
  needsUpdate(context: Context, messageThreshold: number = 10): boolean {
    const cached = this.summaryCache.get(context.id);
    if (!cached) return true;

    const messagesSinceSummary = context.messages.length - cached.messageRange.to;
    return messagesSinceSummary >= messageThreshold;
  }

  // ==========================================================================
  // SUMMARY GENERATION
  // ==========================================================================

  private generateShortSummary(messages: ContextMessage[], context: Context): string {
    if (messages.length === 0) return 'Empty conversation';

    // Get key topics and actions
    const topics = this.extractTopics(messages.map(m => m.content).join(' ')).slice(0, 3);
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

    // Build summary
    const parts: string[] = [];

    if (context.goal) {
      parts.push(`Goal: ${context.goal}`);
    }

    if (topics.length > 0) {
      parts.push(`Topics: ${topics.join(', ')}`);
    }

    if (lastUserMessage) {
      const userPreview = this.truncate(lastUserMessage.content, 50);
      parts.push(`Latest: "${userPreview}"`);
    }

    parts.push(`${messages.length} messages`);

    return parts.join(' | ');
  }

  private generateFullSummary(messages: ContextMessage[], context: Context): string {
    const parts: string[] = [];

    // Context overview
    if (context.goal) {
      parts.push(`**Goal:** ${context.goal}\n`);
    }

    // Conversation flow
    parts.push('**Conversation Overview:**');

    // Group messages into logical segments
    const segments = this.segmentConversation(messages);
    for (const segment of segments.slice(-5)) {
      parts.push(`- ${segment.summary}`);
    }

    // Key actions taken
    const toolMessages = messages.filter(m => m.role === 'tool');
    if (toolMessages.length > 0) {
      parts.push('\n**Actions Taken:**');
      const actionSummary = this.summarizeActions(toolMessages);
      for (const action of actionSummary.slice(0, 5)) {
        parts.push(`- ${action}`);
      }
    }

    return parts.join('\n');
  }

  private generateUpdateSummary(newMessages: ContextMessage[]): string {
    if (newMessages.length === 0) return '';

    const userMessages = newMessages.filter(m => m.role === 'user');
    const assistantMessages = newMessages.filter(m => m.role === 'assistant');

    const parts: string[] = ['**Update:**'];

    if (userMessages.length > 0) {
      const userTopics = this.extractTopics(userMessages.map(m => m.content).join(' '));
      if (userTopics.length > 0) {
        parts.push(`User discussed: ${userTopics.slice(0, 3).join(', ')}`);
      }
    }

    if (assistantMessages.length > 0) {
      const actions = this.extractActionsFromAssistant(assistantMessages);
      if (actions.length > 0) {
        parts.push(`Assistant: ${actions.slice(0, 3).join('; ')}`);
      }
    }

    return parts.join('\n');
  }

  // ==========================================================================
  // EXTRACTION METHODS
  // ==========================================================================

  private extractKeyPoints(messages: ContextMessage[]): string[] {
    const keyPoints: string[] = [];
    const seenPoints = new Set<string>();

    for (const message of messages) {
      if (message.role !== 'user' && message.role !== 'assistant') continue;

      // Extract questions
      const questions = message.content.match(/[^.!?]*\?/g) || [];
      for (const q of questions.slice(0, 2)) {
        const normalized = q.trim().toLowerCase();
        if (!seenPoints.has(normalized) && q.length > 10) {
          seenPoints.add(normalized);
          keyPoints.push(`Question: ${this.truncate(q.trim(), 100)}`);
        }
      }

      // Extract statements with strong language
      const strongStatements = this.extractStrongStatements(message.content);
      for (const statement of strongStatements.slice(0, 2)) {
        const normalized = statement.toLowerCase();
        if (!seenPoints.has(normalized)) {
          seenPoints.add(normalized);
          keyPoints.push(this.truncate(statement, 100));
        }
      }
    }

    return keyPoints.slice(0, 10);
  }

  private extractDecisions(messages: ContextMessage[]): DecisionRecord[] {
    const decisions: DecisionRecord[] = [];
    const decisionPatterns = [
      /(?:decided|chosen|selected|going with|will use|opted for)\s+(.+?)(?:\.|$)/gi,
      /(?:let's|we'll|I'll)\s+(.+?)(?:\.|$)/gi,
      /(?:the plan is to|going to)\s+(.+?)(?:\.|$)/gi,
    ];

    for (const message of messages) {
      if (message.role !== 'assistant') continue;

      for (const pattern of decisionPatterns) {
        let match;
        while ((match = pattern.exec(message.content)) !== null) {
          decisions.push({
            description: this.truncate(match[1].trim(), 150),
            timestamp: message.timestamp,
            confidence: 0.7,
          });
        }
      }
    }

    return decisions;
  }

  private extractEntities(text: string): ExtractedEntity[] {
    const entityMap = new Map<string, ExtractedEntity>();

    for (const { type, patterns } of ENTITY_PATTERNS) {
      for (const pattern of patterns) {
        let match;
        // Reset regex state
        pattern.lastIndex = 0;
        
        while ((match = pattern.exec(text)) !== null) {
          const value = match[1] || match[0];
          const normalized = value.toLowerCase();
          
          if (entityMap.has(normalized)) {
            entityMap.get(normalized)!.mentions++;
          } else {
            entityMap.set(normalized, {
              type,
              value,
              mentions: 1,
            });
          }
        }
      }
    }

    // Sort by mentions and return top entities
    return Array.from(entityMap.values())
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 30);
  }

  private extractTopics(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4);

    // Count word frequency
    const frequency = new Map<string, number>();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }

    // Filter out common words
    const stopWords = new Set([
      'about', 'above', 'after', 'again', 'against', 'because',
      'before', 'being', 'below', 'between', 'could', 'didn',
      'doesn', 'doing', 'during', 'further', 'hadn', 'hasn',
      'haven', 'having', 'itself', 'might', 'mustn', 'needn',
      'other', 'should', 'shouldn', 'their', 'theirs', 'there',
      'these', 'those', 'through', 'under', 'until', 'wasn',
      'weren', 'which', 'while', 'would', 'wouldn', 'yourself',
    ]);

    return Array.from(frequency.entries())
      .filter(([word]) => !stopWords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  private analyzeSentiment(text: string): SentimentScore {
    const words = text.toLowerCase().split(/\s+/);
    
    const positiveWords = new Set([
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'awesome', 'nice', 'love', 'perfect', 'thanks', 'thank', 'helpful',
      'brilliant', 'outstanding', 'superb', 'happy', 'pleased', 'success',
    ]);

    const negativeWords = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'wrong', 'error', 'fail',
      'failed', 'broken', 'bug', 'issue', 'problem', 'confused', 'stuck',
      'frustrated', 'annoying', 'difficult', 'hard', 'can\'t', 'won\'t',
    ]);

    let positive = 0;
    let negative = 0;

    for (const word of words) {
      if (positiveWords.has(word)) positive++;
      if (negativeWords.has(word)) negative++;
    }

    const total = positive + negative || 1;

    return {
      positive: positive / total,
      negative: negative / total,
      neutral: 1 - (positive + negative) / Math.max(words.length, 1),
      overall: positive > negative ? 'positive' 
             : negative > positive ? 'negative' 
             : 'neutral',
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private segmentConversation(
    messages: ContextMessage[]
  ): Array<{ summary: string; messages: ContextMessage[] }> {
    const segments: Array<{ summary: string; messages: ContextMessage[] }> = [];
    let currentSegment: ContextMessage[] = [];

    for (const message of messages) {
      currentSegment.push(message);

      // Segment on user messages after assistant response
      if (message.role === 'user' && currentSegment.length > 1) {
        const summary = this.summarizeSegment(currentSegment.slice(0, -1));
        segments.push({ summary, messages: currentSegment.slice(0, -1) });
        currentSegment = [message];
      }
    }

    if (currentSegment.length > 0) {
      segments.push({
        summary: this.summarizeSegment(currentSegment),
        messages: currentSegment,
      });
    }

    return segments;
  }

  private summarizeSegment(messages: ContextMessage[]): string {
    const userMessage = messages.find(m => m.role === 'user');
    const assistantMessage = messages.find(m => m.role === 'assistant');

    if (userMessage && assistantMessage) {
      const userPreview = this.truncate(userMessage.content, 40);
      return `User asked about "${userPreview}", assistant responded`;
    }
    
    if (userMessage) {
      return `User: ${this.truncate(userMessage.content, 60)}`;
    }
    
    if (assistantMessage) {
      return `Assistant: ${this.truncate(assistantMessage.content, 60)}`;
    }

    return 'System/tool messages';
  }

  private summarizeActions(toolMessages: ContextMessage[]): string[] {
    const actions: string[] = [];
    const actionCounts = new Map<string, number>();

    for (const message of toolMessages) {
      // Try to extract tool name from message
      const toolMatch = message.content.match(/^(\w+):/);
      const toolName = toolMatch?.[1] || 'tool';
      actionCounts.set(toolName, (actionCounts.get(toolName) || 0) + 1);
    }

    for (const [tool, count] of actionCounts) {
      actions.push(`${tool}: ${count} operation${count > 1 ? 's' : ''}`);
    }

    return actions;
  }

  private extractStrongStatements(text: string): string[] {
    const statements: string[] = [];
    const patterns = [
      /(?:important|crucial|critical|essential|key)\s*(?:is|to|that)\s*([^.!?]+)/gi,
      /(?:must|need to|have to|should)\s+([^.!?]+)/gi,
      /(?:the main|the primary|the core)\s+([^.!?]+)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        statements.push(match[0].trim());
      }
    }

    return statements;
  }

  private extractActionsFromAssistant(messages: ContextMessage[]): string[] {
    const actions: string[] = [];
    const actionVerbs = ['created', 'updated', 'deleted', 'modified', 'fixed', 'implemented', 'added', 'removed'];

    for (const message of messages) {
      for (const verb of actionVerbs) {
        const regex = new RegExp(`${verb}\\s+([^.!?]+)`, 'gi');
        let match;
        while ((match = regex.exec(message.content)) !== null) {
          actions.push(`${verb} ${this.truncate(match[1].trim(), 50)}`);
        }
      }
    }

    return actions;
  }

  private mergeKeyPoints(existing: string[], newPoints: string[]): string[] {
    const seen = new Set(existing.map(p => p.toLowerCase()));
    const merged = [...existing];

    for (const point of newPoints) {
      const normalized = point.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        merged.push(point);
      }
    }

    return merged;
  }

  private mergeEntities(existing: ExtractedEntity[], newEntities: ExtractedEntity[]): ExtractedEntity[] {
    const entityMap = new Map<string, ExtractedEntity>();

    for (const entity of [...existing, ...newEntities]) {
      const key = `${entity.type}:${entity.value.toLowerCase()}`;
      if (entityMap.has(key)) {
        entityMap.get(key)!.mentions += entity.mentions;
      } else {
        entityMap.set(key, { ...entity });
      }
    }

    return Array.from(entityMap.values())
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 30);
  }

  private mergeTopics(existing: string[], newTopics: string[]): string[] {
    const topicSet = new Set([...existing, ...newTopics]);
    return Array.from(topicSet);
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }

  private trimSummary(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    
    // Try to cut at paragraph boundary
    const truncated = text.slice(0, maxChars);
    const lastParagraph = truncated.lastIndexOf('\n\n');
    if (lastParagraph > maxChars * 0.7) {
      return truncated.slice(0, lastParagraph);
    }
    
    return truncated.slice(0, truncated.lastIndexOf(' ')) + '...';
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private createEmptySummary(contextId: string): ContextSummary {
    return {
      id: `summary_${Date.now()}`,
      contextId,
      shortSummary: 'Empty conversation',
      fullSummary: 'No messages in this context yet.',
      keyPoints: [],
      decisions: [],
      entities: [],
      topics: [],
      sentiment: { positive: 0, negative: 0, neutral: 1, overall: 'neutral' },
      createdAt: new Date(),
      messageRange: { from: 0, to: 0 },
      compressionRatio: 1,
    };
  }
}

// ============================================================================
// CONTEXT TRANSITION MANAGER
// ============================================================================

export class ContextTransitionManager {
  private summarizer: ContextSummarizer;
  private transitionHistory: ContextTransition[] = [];

  constructor() {
    this.summarizer = new ContextSummarizer();
  }

  /**
   * Plan a context transition
   */
  planTransition(
    from: Context,
    to: Context,
    type: TransitionType,
    options?: ContextSwitchOptions
  ): TransitionPlan {
    const transitions: ContextTransition[] = [];

    // Create the main transition
    const transition: ContextTransition = {
      id: `transition_${Date.now()}`,
      fromContextId: from.id,
      toContextId: to.id,
      type,
      timestamp: new Date(),
      userInitiated: options?.notifyUser !== false,
      notificationSent: false,
      preservedEntities: [],
    };

    // Generate handoff summary if needed
    if (options?.summarizeBeforeSwitch) {
      const summary = this.summarizer.summarize(from);
      transition.handoffSummary = summary.shortSummary;
      transition.preservedEntities = summary.entities.slice(0, 10);
    }

    // Preserve state if requested
    if (options?.preserveState) {
      transition.sharedState = this.extractSharedState(from);
    }

    // Add custom handoff message
    if (options?.handoffMessage) {
      transition.handoffSummary = options.handoffMessage;
    }

    transitions.push(transition);

    return {
      transitions,
      summary: `Switch from "${from.goal || from.id}" to "${to.goal || to.id}"`,
      estimatedDuration: 100, // ms
      requiresUserConfirmation: options?.notifyUser !== false,
    };
  }

  /**
   * Execute a transition
   */
  executeTransition(transition: ContextTransition): void {
    transition.notificationSent = true;
    this.transitionHistory.push(transition);
  }

  /**
   * Get transition history
   */
  getTransitionHistory(limit?: number): ContextTransition[] {
    const history = this.transitionHistory;
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get transitions for a context
   */
  getTransitionsForContext(contextId: string): ContextTransition[] {
    return this.transitionHistory.filter(
      t => t.fromContextId === contextId || t.toContextId === contextId
    );
  }

  /**
   * Generate a handoff message for transitioning
   */
  generateHandoffMessage(
    from: Context,
    to: Context,
    summary?: ContextSummary
  ): string {
    const parts: string[] = [];

    parts.push(`📋 **Context Handoff**`);
    parts.push(`From: ${from.goal || from.type} → To: ${to.goal || to.type}`);

    if (summary) {
      parts.push(`\n**Summary:** ${summary.shortSummary}`);

      if (summary.keyPoints.length > 0) {
        parts.push('\n**Key Points:**');
        for (const point of summary.keyPoints.slice(0, 3)) {
          parts.push(`- ${point}`);
        }
      }

      if (summary.decisions.length > 0) {
        parts.push('\n**Decisions Made:**');
        for (const decision of summary.decisions.slice(-3)) {
          parts.push(`- ${decision.description}`);
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * Extract shared state for preservation
   */
  private extractSharedState(context: Context): Record<string, unknown> {
    return {
      goal: context.goal,
      type: context.type,
      topics: context.summary?.topics || [],
      entities: context.summary?.entities || [],
      tokenUsage: context.tokenUsage,
      messageCount: context.messages.length,
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface SummarizeOptions {
  messageRange?: {
    from: number;
    to: number;
  };
  includeSystemMessages?: boolean;
  maxLength?: number;
}

// ============================================================================
// SINGLETON & CONVENIENCE
// ============================================================================

let summarizerInstance: ContextSummarizer | null = null;
let transitionManagerInstance: ContextTransitionManager | null = null;

export function getContextSummarizer(): ContextSummarizer {
  if (!summarizerInstance) {
    summarizerInstance = new ContextSummarizer();
  }
  return summarizerInstance;
}

export function getTransitionManager(): ContextTransitionManager {
  if (!transitionManagerInstance) {
    transitionManagerInstance = new ContextTransitionManager();
  }
  return transitionManagerInstance;
}

export function summarizeContext(context: Context): ContextSummary {
  return getContextSummarizer().summarize(context);
}

export function planContextSwitch(
  from: Context,
  to: Context,
  options?: ContextSwitchOptions
): TransitionPlan {
  return getTransitionManager().planTransition(from, to, 'switch', options);
}

/**
 * Predictive Thread Recommendations
 * 
 * Provides intelligent suggestions for:
 * - Related/relevant threads
 * - Context switches
 * - Thread actions (archive, merge, etc.)
 * - Proactive context management
 */

import {
  Context,
  ContextType,
  ContextStatus,
  ThreadRecommendation,
  SuggestedAction,
  RecommendationContext,
  UserPreferences,
  ContextSummary,
  ExtractedEntity,
} from './types';
import { getContextSummarizer } from './summarizer';

// ============================================================================
// SIMILARITY SCORING
// ============================================================================

interface SimilarityScore {
  contextId: string;
  score: number;
  factors: SimilarityFactor[];
}

interface SimilarityFactor {
  name: string;
  score: number;
  weight: number;
  detail?: string;
}

// ============================================================================
// THREAD RECOMMENDER
// ============================================================================

export class ThreadRecommender {
  private summarizer = getContextSummarizer();
  private userPatterns: Map<string, PatternData> = new Map();

  /**
   * Get thread recommendations for a message
   */
  getRecommendations(
    message: string,
    contexts: Map<string, Context>,
    currentContext: Context | null,
    preferences?: UserPreferences,
    limit: number = 5
  ): ThreadRecommendation[] {
    const recommendations: ThreadRecommendation[] = [];

    // Calculate similarity scores for all contexts
    const scores: SimilarityScore[] = [];

    for (const [id, context] of contexts) {
      // Skip current context and archived/failed
      if (context.id === currentContext?.id) continue;
      if (context.status === 'archived' || context.status === 'failed') continue;

      const score = this.calculateSimilarity(message, context, currentContext);
      if (score.score > 0.1) {
        scores.push(score);
      }
    }

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // Build recommendations
    for (const score of scores.slice(0, limit)) {
      const context = contexts.get(score.contextId)!;
      const recommendation = this.buildRecommendation(
        context,
        score,
        message,
        preferences
      );
      recommendations.push(recommendation);
    }

    // Add action suggestions
    this.addActionSuggestions(recommendations, contexts, currentContext);

    return recommendations;
  }

  /**
   * Get proactive recommendations (not message-triggered)
   */
  getProactiveRecommendations(
    contexts: Map<string, Context>,
    currentContext: Context | null,
    preferences?: UserPreferences
  ): ThreadRecommendation[] {
    const recommendations: ThreadRecommendation[] = [];

    const now = Date.now();

    for (const context of contexts.values()) {
      if (context.status === 'archived' || context.status === 'failed') continue;
      if (context.id === currentContext?.id) continue;

      // Check for stale contexts that need attention
      const lastActive = context.lastActiveAt.getTime();
      const ageHours = (now - lastActive) / (1000 * 60 * 60);

      // Contexts with pending tasks
      if (context.tasks.pending.length > 0 || context.tasks.active.length > 0) {
        recommendations.push({
          contextId: context.id,
          relevanceScore: 70 + Math.min(context.tasks.active.length * 10, 20),
          reasons: [
            `Has ${context.tasks.active.length} active and ${context.tasks.pending.length} pending tasks`,
          ],
          recentActivity: context.lastActiveAt,
          matchedKeywords: [],
          suggestedAction: {
            type: 'review',
            description: 'Check on running tasks',
            priority: 8,
          },
        });
      }

      // Paused contexts that might need resuming
      if (context.status === 'paused' && ageHours < 24) {
        recommendations.push({
          contextId: context.id,
          relevanceScore: 60,
          reasons: ['Paused conversation that might need continuation'],
          recentActivity: context.lastActiveAt,
          matchedKeywords: [],
          suggestedAction: {
            type: 'resume',
            description: 'Resume paused conversation',
            priority: 5,
          },
        });
      }

      // Old contexts that might need archiving
      const archiveThreshold = preferences?.autoArchiveAfterDays || 7;
      if (ageHours > archiveThreshold * 24 && context.status === 'active') {
        recommendations.push({
          contextId: context.id,
          relevanceScore: 30,
          reasons: [
            `Inactive for ${Math.floor(ageHours / 24)} days`,
          ],
          recentActivity: context.lastActiveAt,
          matchedKeywords: [],
          suggestedAction: {
            type: 'archive',
            description: 'Archive inactive conversation',
            priority: 2,
          },
        });
      }
    }

    // Sort by relevance
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return recommendations.slice(0, 5);
  }

  /**
   * Find contexts that could be merged
   */
  findMergeCandidates(
    contexts: Map<string, Context>
  ): Array<{ context1: string; context2: string; similarity: number; reason: string }> {
    const candidates: Array<{ context1: string; context2: string; similarity: number; reason: string }> = [];
    const contextList = Array.from(contexts.values());

    for (let i = 0; i < contextList.length; i++) {
      for (let j = i + 1; j < contextList.length; j++) {
        const c1 = contextList[i];
        const c2 = contextList[j];

        // Skip if different types
        if (c1.type !== c2.type) continue;

        // Skip if either is archived/failed
        if (c1.status === 'archived' || c1.status === 'failed') continue;
        if (c2.status === 'archived' || c2.status === 'failed') continue;

        const similarity = this.calculateContextSimilarity(c1, c2);
        if (similarity >= 0.7) {
          candidates.push({
            context1: c1.id,
            context2: c2.id,
            similarity,
            reason: this.explainSimilarity(c1, c2),
          });
        }
      }
    }

    return candidates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Learn from user behavior
   */
  recordUserAction(
    action: 'switch' | 'create' | 'archive' | 'merge',
    fromContext: string | null,
    toContext: string | null,
    message?: string
  ): void {
    const key = `${action}:${fromContext || 'null'}:${toContext || 'null'}`;
    const existing = this.userPatterns.get(key) || { count: 0, messages: [] };
    existing.count++;
    if (message) {
      existing.messages.push(message);
      // Keep only recent messages
      if (existing.messages.length > 10) {
        existing.messages.shift();
      }
    }
    this.userPatterns.set(key, existing);
  }

  // ==========================================================================
  // SIMILARITY CALCULATION
  // ==========================================================================

  private calculateSimilarity(
    message: string,
    targetContext: Context,
    currentContext: Context | null
  ): SimilarityScore {
    const factors: SimilarityFactor[] = [];
    const messageLower = message.toLowerCase();
    const messageWords = new Set(messageLower.split(/\s+/).filter(w => w.length > 3));

    // Factor 1: Goal/topic match
    if (targetContext.goal) {
      const goalLower = targetContext.goal.toLowerCase();
      const goalWords = new Set(goalLower.split(/\s+/));
      const overlap = [...messageWords].filter(w => goalWords.has(w)).length;
      
      if (overlap > 0) {
        factors.push({
          name: 'goal_match',
          score: Math.min(overlap * 0.25, 1),
          weight: 0.3,
          detail: `Goal: "${targetContext.goal}"`,
        });
      }
    }

    // Factor 2: Summary topic match
    if (targetContext.summary) {
      const topicOverlap = this.calculateTopicOverlap(
        Array.from(messageWords),
        targetContext.summary.topics
      );
      
      if (topicOverlap > 0) {
        factors.push({
          name: 'topic_match',
          score: topicOverlap,
          weight: 0.25,
          detail: `Topics: ${targetContext.summary.topics.slice(0, 3).join(', ')}`,
        });
      }
    }

    // Factor 3: Entity match
    if (targetContext.summary?.entities) {
      const entityMatch = this.calculateEntityOverlap(
        message,
        targetContext.summary.entities
      );
      
      if (entityMatch.score > 0) {
        factors.push({
          name: 'entity_match',
          score: entityMatch.score,
          weight: 0.25,
          detail: `Matched: ${entityMatch.matched.join(', ')}`,
        });
      }
    }

    // Factor 4: Recent message similarity
    const recentMessages = targetContext.messages.slice(-5);
    let maxMessageSim = 0;
    
    for (const msg of recentMessages) {
      const msgWords = new Set(msg.content.toLowerCase().split(/\s+/));
      const overlap = [...messageWords].filter(w => msgWords.has(w)).length;
      const sim = overlap / Math.max(messageWords.size, 1);
      maxMessageSim = Math.max(maxMessageSim, sim);
    }

    if (maxMessageSim > 0.1) {
      factors.push({
        name: 'recent_similarity',
        score: maxMessageSim,
        weight: 0.15,
        detail: 'Similar to recent messages',
      });
    }

    // Factor 5: Recency bonus
    const hoursSinceActive = (Date.now() - targetContext.lastActiveAt.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 1 - hoursSinceActive / 24); // Decay over 24 hours
    
    factors.push({
      name: 'recency',
      score: recencyScore,
      weight: 0.05,
      detail: `Active ${hoursSinceActive.toFixed(1)}h ago`,
    });

    // Calculate weighted total
    let totalScore = 0;
    let totalWeight = 0;

    for (const factor of factors) {
      totalScore += factor.score * factor.weight;
      totalWeight += factor.weight;
    }

    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      contextId: targetContext.id,
      score: Math.min(normalizedScore, 1),
      factors,
    };
  }

  private calculateContextSimilarity(c1: Context, c2: Context): number {
    let score = 0;
    let factors = 0;

    // Goal similarity
    if (c1.goal && c2.goal) {
      const goal1Words = new Set(c1.goal.toLowerCase().split(/\s+/));
      const goal2Words = new Set(c2.goal.toLowerCase().split(/\s+/));
      const overlap = [...goal1Words].filter(w => goal2Words.has(w)).length;
      const union = new Set([...goal1Words, ...goal2Words]).size;
      score += overlap / union;
      factors++;
    }

    // Topic similarity
    if (c1.summary?.topics && c2.summary?.topics) {
      const overlap = c1.summary.topics.filter(t => c2.summary!.topics.includes(t)).length;
      const union = new Set([...c1.summary.topics, ...c2.summary.topics]).size;
      score += overlap / union;
      factors++;
    }

    // Entity similarity
    if (c1.summary?.entities && c2.summary?.entities) {
      const e1Values = new Set(c1.summary.entities.map(e => e.value.toLowerCase()));
      const e2Values = new Set(c2.summary.entities.map(e => e.value.toLowerCase()));
      const overlap = [...e1Values].filter(v => e2Values.has(v)).length;
      const union = new Set([...e1Values, ...e2Values]).size;
      if (union > 0) {
        score += overlap / union;
        factors++;
      }
    }

    return factors > 0 ? score / factors : 0;
  }

  private calculateTopicOverlap(words: string[], topics: string[]): number {
    const topicSet = new Set(topics.map(t => t.toLowerCase()));
    let overlap = 0;

    for (const word of words) {
      if (topicSet.has(word)) {
        overlap++;
      }
    }

    return overlap / Math.max(topicSet.size, 1);
  }

  private calculateEntityOverlap(
    message: string,
    entities: ExtractedEntity[]
  ): { score: number; matched: string[] } {
    const messageLower = message.toLowerCase();
    const matched: string[] = [];

    for (const entity of entities) {
      if (messageLower.includes(entity.value.toLowerCase())) {
        matched.push(entity.value);
      }
    }

    return {
      score: matched.length / Math.max(entities.length, 1),
      matched,
    };
  }

  // ==========================================================================
  // RECOMMENDATION BUILDING
  // ==========================================================================

  private buildRecommendation(
    context: Context,
    score: SimilarityScore,
    message: string,
    preferences?: UserPreferences
  ): ThreadRecommendation {
    const reasons: string[] = [];
    const matchedKeywords: string[] = [];

    // Build reasons from factors
    for (const factor of score.factors) {
      if (factor.score > 0.2) {
        reasons.push(factor.detail || factor.name);
      }
    }

    // Extract matched keywords
    const messageLower = message.toLowerCase();
    if (context.goal) {
      const goalWords = context.goal.toLowerCase().split(/\s+/);
      for (const word of goalWords) {
        if (word.length > 3 && messageLower.includes(word)) {
          matchedKeywords.push(word);
        }
      }
    }

    return {
      contextId: context.id,
      relevanceScore: Math.round(score.score * 100),
      reasons,
      recentActivity: context.lastActiveAt,
      matchedKeywords: matchedKeywords.slice(0, 5),
    };
  }

  private addActionSuggestions(
    recommendations: ThreadRecommendation[],
    contexts: Map<string, Context>,
    currentContext: Context | null
  ): void {
    for (const rec of recommendations) {
      const context = contexts.get(rec.contextId);
      if (!context) continue;

      // Suggest continuing high-relevance contexts
      if (rec.relevanceScore >= 70) {
        rec.suggestedAction = {
          type: 'continue',
          description: 'Switch to continue this conversation',
          priority: 7,
        };
      } else if (rec.relevanceScore >= 50) {
        rec.suggestedAction = {
          type: 'review',
          description: 'Review for potential relevance',
          priority: 5,
        };
      }

      // Override if context has active tasks
      if (context.tasks.active.length > 0) {
        rec.suggestedAction = {
          type: 'review',
          description: `${context.tasks.active.length} task(s) running`,
          priority: 8,
        };
      }
    }
  }

  private explainSimilarity(c1: Context, c2: Context): string {
    const reasons: string[] = [];

    if (c1.goal && c2.goal) {
      reasons.push(`Similar goals: "${c1.goal}" and "${c2.goal}"`);
    }

    if (c1.summary?.topics && c2.summary?.topics) {
      const shared = c1.summary.topics.filter(t => c2.summary!.topics.includes(t));
      if (shared.length > 0) {
        reasons.push(`Shared topics: ${shared.slice(0, 3).join(', ')}`);
      }
    }

    return reasons.join('; ') || 'Similar content';
  }
}

// ============================================================================
// PREDICTIVE CONTEXT ENGINE
// ============================================================================

export class PredictiveContextEngine {
  private recommender: ThreadRecommender;
  private predictionCache: Map<string, CachedPrediction> = new Map();
  private cacheMaxAge = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.recommender = new ThreadRecommender();
  }

  /**
   * Predict next likely context based on message
   */
  predictNextContext(
    message: string,
    contexts: Map<string, Context>,
    currentContext: Context | null
  ): PredictedContext | null {
    // Check cache
    const cacheKey = this.getCacheKey(message, currentContext?.id || '');
    const cached = this.predictionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.prediction;
    }

    const recommendations = this.recommender.getRecommendations(
      message,
      contexts,
      currentContext,
      undefined,
      3
    );

    if (recommendations.length === 0) {
      return null;
    }

    const top = recommendations[0];
    const context = contexts.get(top.contextId);
    if (!context) return null;

    const prediction: PredictedContext = {
      contextId: top.contextId,
      confidence: top.relevanceScore / 100,
      reasons: top.reasons,
      suggestedAction: top.suggestedAction?.type || 'continue',
      alternativeContexts: recommendations.slice(1).map(r => ({
        contextId: r.contextId,
        confidence: r.relevanceScore / 100,
      })),
    };

    // Cache the prediction
    this.predictionCache.set(cacheKey, {
      prediction,
      timestamp: Date.now(),
    });

    return prediction;
  }

  /**
   * Predict optimal model for message in context
   */
  predictOptimalModel(
    message: string,
    context: Context
  ): { modelId: string; confidence: number; reason: string } {
    // Simple heuristics for now
    const hasCode = /```[\s\S]*```/.test(message) || /\b(function|class|const|let|var)\b/.test(message);
    const isComplex = message.length > 500 || message.split('?').length > 2;
    const needsReasoning = /\b(why|how|explain|analyze|compare)\b/i.test(message);

    if (hasCode && isComplex) {
      return {
        modelId: 'anthropic/claude-opus-4-5',
        confidence: 0.8,
        reason: 'Complex code-related task',
      };
    }

    if (needsReasoning || isComplex) {
      return {
        modelId: 'anthropic/claude-sonnet-4-5',
        confidence: 0.7,
        reason: 'Reasoning or complex task',
      };
    }

    return {
      modelId: 'anthropic/claude-3-5-haiku-20241022',
      confidence: 0.6,
      reason: 'Standard task',
    };
  }

  /**
   * Generate proactive suggestions
   */
  generateProactiveSuggestions(
    contexts: Map<string, Context>,
    currentContext: Context | null
  ): ProactiveSuggestion[] {
    const suggestions: ProactiveSuggestion[] = [];

    const proactive = this.recommender.getProactiveRecommendations(
      contexts,
      currentContext
    );

    for (const rec of proactive) {
      const context = contexts.get(rec.contextId);
      if (!context) continue;

      suggestions.push({
        type: rec.suggestedAction?.type || 'review',
        contextId: rec.contextId,
        contextGoal: context.goal,
        message: rec.suggestedAction?.description || rec.reasons[0],
        priority: rec.suggestedAction?.priority || 5,
      });
    }

    // Add merge suggestions
    const mergeCandidates = this.recommender.findMergeCandidates(contexts);
    for (const candidate of mergeCandidates.slice(0, 2)) {
      const c1 = contexts.get(candidate.context1);
      const c2 = contexts.get(candidate.context2);
      if (!c1 || !c2) continue;

      suggestions.push({
        type: 'merge',
        contextId: candidate.context1,
        relatedContextId: candidate.context2,
        contextGoal: c1.goal,
        message: `Consider merging: ${candidate.reason}`,
        priority: 4,
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Clear prediction cache
   */
  clearCache(): void {
    this.predictionCache.clear();
  }

  private getCacheKey(message: string, contextId: string): string {
    // Create a simple hash
    const hash = message.slice(0, 100) + ':' + contextId;
    return hash;
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface PatternData {
  count: number;
  messages: string[];
}

interface CachedPrediction {
  prediction: PredictedContext;
  timestamp: number;
}

export interface PredictedContext {
  contextId: string;
  confidence: number;
  reasons: string[];
  suggestedAction: 'continue' | 'review' | 'merge' | 'archive' | 'resume';
  alternativeContexts: Array<{
    contextId: string;
    confidence: number;
  }>;
}

export interface ProactiveSuggestion {
  type: 'continue' | 'resume' | 'review' | 'archive' | 'merge';
  contextId: string;
  relatedContextId?: string;
  contextGoal?: string;
  message: string;
  priority: number;
}

// ============================================================================
// SINGLETON & CONVENIENCE
// ============================================================================

let recommenderInstance: ThreadRecommender | null = null;
let predictionEngineInstance: PredictiveContextEngine | null = null;

export function getThreadRecommender(): ThreadRecommender {
  if (!recommenderInstance) {
    recommenderInstance = new ThreadRecommender();
  }
  return recommenderInstance;
}

export function getPredictiveEngine(): PredictiveContextEngine {
  if (!predictionEngineInstance) {
    predictionEngineInstance = new PredictiveContextEngine();
  }
  return predictionEngineInstance;
}

export function getThreadRecommendations(
  message: string,
  contexts: Map<string, Context>,
  currentContext: Context | null,
  limit?: number
): ThreadRecommendation[] {
  return getThreadRecommender().getRecommendations(
    message,
    contexts,
    currentContext,
    undefined,
    limit
  );
}

export function predictContext(
  message: string,
  contexts: Map<string, Context>,
  currentContext: Context | null
): PredictedContext | null {
  return getPredictiveEngine().predictNextContext(message, contexts, currentContext);
}

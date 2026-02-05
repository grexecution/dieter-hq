/**
 * Dynamic Model Selection Per Thread
 * 
 * Selects the optimal AI model based on:
 * - Task complexity analysis
 * - Context requirements
 * - Budget constraints
 * - Latency requirements
 * - Model capabilities
 */

import {
  ModelConfig,
  ModelCapability,
  ModelSelectionCriteria,
  ModelCandidate,
  ModelRecommendation,
  ThinkingLevel,
  ComplexityLevel,
  UrgencyLevel,
  QualityLevel,
  Context,
  ContextMessage,
} from './types';

// ============================================================================
// MODEL REGISTRY
// ============================================================================

const MODEL_REGISTRY: ModelCandidate[] = [
  // Claude models
  {
    modelId: 'anthropic/claude-opus-4-5',
    displayName: 'Claude Opus 4.5',
    provider: 'anthropic',
    capabilities: ['code', 'reasoning', 'creative', 'vision', 'tools', 'long_context'],
    contextWindow: 200000,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    latencyMs: { firstToken: 1500, perToken: 30 },
    qualityScore: 98,
    thinkingSupport: true,
    maxThinkingLevel: 'high',
  },
  {
    modelId: 'anthropic/claude-sonnet-4-5',
    displayName: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    capabilities: ['code', 'reasoning', 'creative', 'vision', 'tools', 'long_context', 'fast'],
    contextWindow: 200000,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    latencyMs: { firstToken: 800, perToken: 20 },
    qualityScore: 90,
    thinkingSupport: true,
    maxThinkingLevel: 'medium',
  },
  {
    modelId: 'anthropic/claude-3-5-haiku-20241022',
    displayName: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    capabilities: ['code', 'tools', 'fast', 'cheap'],
    contextWindow: 200000,
    costPer1kTokens: { input: 0.0008, output: 0.004 },
    latencyMs: { firstToken: 300, perToken: 10 },
    qualityScore: 78,
    thinkingSupport: false,
    maxThinkingLevel: 'off',
  },
  // OpenAI models
  {
    modelId: 'openai/gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    capabilities: ['code', 'reasoning', 'creative', 'vision', 'tools'],
    contextWindow: 128000,
    costPer1kTokens: { input: 0.005, output: 0.015 },
    latencyMs: { firstToken: 600, perToken: 25 },
    qualityScore: 88,
    thinkingSupport: false,
    maxThinkingLevel: 'off',
  },
  {
    modelId: 'openai/gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    capabilities: ['code', 'tools', 'fast', 'cheap'],
    contextWindow: 128000,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
    latencyMs: { firstToken: 200, perToken: 8 },
    qualityScore: 72,
    thinkingSupport: false,
    maxThinkingLevel: 'off',
  },
  {
    modelId: 'openai/o1',
    displayName: 'O1 (Reasoning)',
    provider: 'openai',
    capabilities: ['reasoning', 'code', 'long_context'],
    contextWindow: 200000,
    costPer1kTokens: { input: 0.015, output: 0.06 },
    latencyMs: { firstToken: 3000, perToken: 50 },
    qualityScore: 95,
    thinkingSupport: true,
    maxThinkingLevel: 'high',
  },
  // Google models
  {
    modelId: 'google/gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    provider: 'google',
    capabilities: ['code', 'vision', 'tools', 'fast'],
    contextWindow: 1000000,
    costPer1kTokens: { input: 0.0001, output: 0.0004 },
    latencyMs: { firstToken: 250, perToken: 12 },
    qualityScore: 80,
    thinkingSupport: true,
    maxThinkingLevel: 'low',
  },
];

// ============================================================================
// COMPLEXITY ANALYZER
// ============================================================================

interface ComplexitySignals {
  codePresence: boolean;
  codeComplexity: number;
  questionCount: number;
  technicalTerms: number;
  abstractConcepts: number;
  multiStepReasoning: boolean;
  creativityRequired: boolean;
  dataAnalysis: boolean;
  ambiguity: number;
}

const TECHNICAL_TERMS = new Set([
  'algorithm', 'architecture', 'async', 'await', 'binary', 'buffer',
  'callback', 'class', 'closure', 'compile', 'concurrency', 'database',
  'debug', 'deploy', 'docker', 'encrypt', 'endpoint', 'framework',
  'function', 'git', 'hash', 'http', 'interface', 'kubernetes',
  'lambda', 'memory', 'microservice', 'mutex', 'namespace', 'oauth',
  'object', 'optimization', 'parse', 'polymorphism', 'promise', 'protocol',
  'query', 'recursion', 'regex', 'rest', 'schema', 'server',
  'socket', 'sql', 'stack', 'state', 'stream', 'thread',
  'token', 'typescript', 'variable', 'vector', 'webhook', 'yaml',
]);

const ABSTRACT_CONCEPTS = new Set([
  'philosophy', 'ethics', 'consciousness', 'meaning', 'existence',
  'knowledge', 'reality', 'truth', 'justice', 'freedom', 'morality',
  'causality', 'determinism', 'emergence', 'complexity', 'chaos',
  'entropy', 'infinity', 'probability', 'uncertainty', 'paradox',
]);

export class ComplexityAnalyzer {
  /**
   * Analyze message complexity
   */
  analyze(message: string, history?: ContextMessage[]): ComplexitySignals {
    const signals: ComplexitySignals = {
      codePresence: false,
      codeComplexity: 0,
      questionCount: 0,
      technicalTerms: 0,
      abstractConcepts: 0,
      multiStepReasoning: false,
      creativityRequired: false,
      dataAnalysis: false,
      ambiguity: 0,
    };

    // Check for code blocks
    const codeBlocks = message.match(/```[\s\S]*?```/g) || [];
    signals.codePresence = codeBlocks.length > 0;
    if (signals.codePresence) {
      signals.codeComplexity = this.estimateCodeComplexity(codeBlocks.join('\n'));
    }

    // Count questions
    signals.questionCount = (message.match(/\?/g) || []).length;

    // Count technical terms
    const words = message.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (TECHNICAL_TERMS.has(word)) {
        signals.technicalTerms++;
      }
      if (ABSTRACT_CONCEPTS.has(word)) {
        signals.abstractConcepts++;
      }
    }

    // Detect multi-step reasoning
    const multiStepIndicators = [
      'first', 'then', 'next', 'finally', 'step',
      'consider', 'analyze', 'compare', 'evaluate',
      'pros and cons', 'tradeoffs', 'implications',
    ];
    for (const indicator of multiStepIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        signals.multiStepReasoning = true;
        break;
      }
    }

    // Detect creativity requirements
    const creativityIndicators = [
      'creative', 'imagine', 'story', 'write',
      'design', 'brainstorm', 'ideas', 'novel',
      'innovative', 'unique', 'original',
    ];
    for (const indicator of creativityIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        signals.creativityRequired = true;
        break;
      }
    }

    // Detect data analysis
    const dataIndicators = [
      'analyze', 'data', 'statistics', 'graph',
      'chart', 'metrics', 'numbers', 'calculate',
      'trends', 'patterns', 'correlation',
    ];
    for (const indicator of dataIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        signals.dataAnalysis = true;
        break;
      }
    }

    // Estimate ambiguity
    const ambiguityIndicators = [
      'maybe', 'perhaps', 'might', 'could be',
      'not sure', 'unclear', 'depends', 'either',
    ];
    for (const indicator of ambiguityIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        signals.ambiguity += 0.2;
      }
    }
    signals.ambiguity = Math.min(signals.ambiguity, 1);

    return signals;
  }

  /**
   * Estimate code complexity from code blocks
   */
  private estimateCodeComplexity(code: string): number {
    let complexity = 0;

    // Length factor
    complexity += Math.min(code.length / 1000, 0.3);

    // Control flow complexity
    const controlFlow = (code.match(/\b(if|else|for|while|switch|case|try|catch)\b/g) || []).length;
    complexity += Math.min(controlFlow * 0.05, 0.3);

    // Nesting depth (approximation)
    const braces = code.match(/[{}]/g) || [];
    let maxDepth = 0;
    let currentDepth = 0;
    for (const brace of braces) {
      if (brace === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else {
        currentDepth--;
      }
    }
    complexity += Math.min(maxDepth * 0.1, 0.2);

    // Function count
    const functions = (code.match(/\b(function|=>|def |fn )\b/g) || []).length;
    complexity += Math.min(functions * 0.05, 0.2);

    return Math.min(complexity, 1);
  }

  /**
   * Convert signals to complexity level
   */
  toComplexityLevel(signals: ComplexitySignals): ComplexityLevel {
    let score = 0;

    // Code presence and complexity
    if (signals.codePresence) {
      score += signals.codeComplexity * 0.3;
    }

    // Technical content
    score += Math.min(signals.technicalTerms * 0.05, 0.2);
    score += Math.min(signals.abstractConcepts * 0.08, 0.15);

    // Reasoning requirements
    if (signals.multiStepReasoning) score += 0.2;
    if (signals.questionCount > 3) score += 0.1;

    // Creativity requirements
    if (signals.creativityRequired) score += 0.15;

    // Data analysis
    if (signals.dataAnalysis) score += 0.1;

    // Ambiguity adds complexity
    score += signals.ambiguity * 0.1;

    // Convert to level
    if (score < 0.15) return 'trivial';
    if (score < 0.3) return 'simple';
    if (score < 0.5) return 'moderate';
    if (score < 0.75) return 'complex';
    return 'expert';
  }
}

// ============================================================================
// DYNAMIC MODEL SELECTOR
// ============================================================================

export class DynamicModelSelector {
  private analyzer: ComplexityAnalyzer;
  private customModels: ModelCandidate[] = [];
  private usageHistory: Map<string, { success: number; total: number }> = new Map();

  constructor() {
    this.analyzer = new ComplexityAnalyzer();
  }

  /**
   * Register a custom model
   */
  registerModel(model: ModelCandidate): void {
    this.customModels.push(model);
  }

  /**
   * Get all available models
   */
  getAvailableModels(): ModelCandidate[] {
    return [...MODEL_REGISTRY, ...this.customModels];
  }

  /**
   * Select optimal model for a message
   */
  selectModel(
    message: string,
    context?: Context,
    preferences?: Partial<ModelSelectionCriteria>
  ): ModelRecommendation {
    // Analyze message complexity
    const signals = this.analyzer.analyze(
      message,
      context?.messages
    );
    const complexity = this.analyzer.toComplexityLevel(signals);

    // Build selection criteria
    const criteria: ModelSelectionCriteria = {
      taskComplexity: complexity,
      requiresReasoning: signals.multiStepReasoning || signals.abstractConcepts > 0,
      requiresCode: signals.codePresence,
      requiresCreativity: signals.creativityRequired,
      requiresVision: this.detectVisionRequirement(message),
      contextLength: this.estimateContextLength(message, context),
      urgency: preferences?.urgency || 'normal',
      budgetConstraint: preferences?.budgetConstraint,
      qualityRequirement: preferences?.qualityRequirement || this.inferQualityRequirement(complexity),
    };

    // Score all models
    const scoredModels = this.scoreModels(criteria);

    // Select best model
    const best = scoredModels[0];

    return {
      model: best.model,
      config: this.buildModelConfig(best.model, criteria),
      score: best.score,
      reasoning: best.reasoning,
      estimatedCost: this.estimateCost(best.model, criteria.contextLength),
      estimatedLatency: this.estimateLatency(best.model, criteria.contextLength),
    };
  }

  /**
   * Select model based on explicit criteria
   */
  selectByRequirements(criteria: ModelSelectionCriteria): ModelRecommendation {
    const scoredModels = this.scoreModels(criteria);
    const best = scoredModels[0];

    return {
      model: best.model,
      config: this.buildModelConfig(best.model, criteria),
      score: best.score,
      reasoning: best.reasoning,
      estimatedCost: this.estimateCost(best.model, criteria.contextLength),
      estimatedLatency: this.estimateLatency(best.model, criteria.contextLength),
    };
  }

  /**
   * Get model recommendations for a context
   */
  getRecommendationsForContext(
    context: Context,
    count: number = 3
  ): ModelRecommendation[] {
    // Analyze recent messages
    const recentMessages = context.messages.slice(-10);
    const combinedText = recentMessages.map(m => m.content).join('\n');

    const signals = this.analyzer.analyze(combinedText);
    const complexity = this.analyzer.toComplexityLevel(signals);

    const criteria: ModelSelectionCriteria = {
      taskComplexity: complexity,
      requiresReasoning: signals.multiStepReasoning,
      requiresCode: signals.codePresence,
      requiresCreativity: signals.creativityRequired,
      requiresVision: false,
      contextLength: context.tokenUsage.total,
      urgency: 'normal',
      qualityRequirement: 'standard',
    };

    const scoredModels = this.scoreModels(criteria);

    return scoredModels.slice(0, count).map(({ model, score, reasoning }) => ({
      model,
      config: this.buildModelConfig(model, criteria),
      score,
      reasoning,
      estimatedCost: this.estimateCost(model, criteria.contextLength),
      estimatedLatency: this.estimateLatency(model, criteria.contextLength),
    }));
  }

  /**
   * Score all models against criteria
   */
  private scoreModels(
    criteria: ModelSelectionCriteria
  ): Array<{ model: ModelCandidate; score: number; reasoning: string[] }> {
    const allModels = this.getAvailableModels();
    const scored: Array<{ model: ModelCandidate; score: number; reasoning: string[] }> = [];

    for (const model of allModels) {
      let score = 0;
      const reasoning: string[] = [];

      // Check hard requirements
      if (criteria.requiresVision && !model.capabilities.includes('vision')) {
        continue; // Skip - doesn't support vision
      }
      if (criteria.contextLength > model.contextWindow) {
        continue; // Skip - context too long
      }

      // Quality score (base)
      const qualityWeight = this.getQualityWeight(criteria.qualityRequirement);
      score += (model.qualityScore / 100) * qualityWeight;
      reasoning.push(`Quality: ${model.qualityScore}/100`);

      // Capability match
      if (criteria.requiresCode && model.capabilities.includes('code')) {
        score += 0.15;
        reasoning.push('Supports code');
      }
      if (criteria.requiresReasoning && model.capabilities.includes('reasoning')) {
        score += 0.2;
        reasoning.push('Strong reasoning');
      }
      if (criteria.requiresCreativity && model.capabilities.includes('creative')) {
        score += 0.15;
        reasoning.push('Creative capability');
      }

      // Complexity match
      const complexityScore = this.matchComplexity(model, criteria.taskComplexity);
      score += complexityScore * 0.2;
      reasoning.push(`Complexity match: ${(complexityScore * 100).toFixed(0)}%`);

      // Urgency/latency
      if (criteria.urgency === 'immediate') {
        if (model.capabilities.includes('fast')) {
          score += 0.2;
          reasoning.push('Fast response time');
        } else {
          score -= 0.1;
        }
      } else if (criteria.urgency === 'background') {
        // Prefer cheaper models for background
        if (model.capabilities.includes('cheap')) {
          score += 0.1;
          reasoning.push('Cost-effective for background');
        }
      }

      // Budget constraint
      if (criteria.budgetConstraint) {
        const estimatedCost = this.estimateCost(model, criteria.contextLength);
        if (estimatedCost > criteria.budgetConstraint) {
          score -= 0.3;
          reasoning.push('Exceeds budget');
        } else if (estimatedCost < criteria.budgetConstraint * 0.5) {
          score += 0.1;
          reasoning.push('Within budget');
        }
      }

      // Thinking support bonus for complex tasks
      if (criteria.taskComplexity === 'complex' || criteria.taskComplexity === 'expert') {
        if (model.thinkingSupport) {
          score += 0.15;
          reasoning.push('Thinking mode available');
        }
      }

      // Historical success rate
      const history = this.usageHistory.get(model.modelId);
      if (history && history.total > 10) {
        const successRate = history.success / history.total;
        score += (successRate - 0.8) * 0.2; // Bonus/penalty based on success rate
        reasoning.push(`Success rate: ${(successRate * 100).toFixed(0)}%`);
      }

      scored.push({ model, score, reasoning });
    }

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Build model configuration
   */
  private buildModelConfig(
    model: ModelCandidate,
    criteria: ModelSelectionCriteria
  ): ModelConfig {
    // Determine thinking level
    let thinkingLevel: ThinkingLevel = 'off';
    if (model.thinkingSupport) {
      if (criteria.taskComplexity === 'expert') {
        thinkingLevel = model.maxThinkingLevel;
      } else if (criteria.taskComplexity === 'complex') {
        thinkingLevel = model.maxThinkingLevel === 'high' ? 'medium' : model.maxThinkingLevel;
      } else if (criteria.requiresReasoning) {
        thinkingLevel = 'low';
      }
    }

    // Determine temperature
    let temperature = 0.7;
    if (criteria.requiresCreativity) {
      temperature = 0.9;
    } else if (criteria.requiresCode) {
      temperature = 0.3;
    } else if (criteria.requiresReasoning) {
      temperature = 0.5;
    }

    // Determine max tokens
    let maxTokens = 4096;
    if (criteria.taskComplexity === 'trivial' || criteria.taskComplexity === 'simple') {
      maxTokens = 1024;
    } else if (criteria.taskComplexity === 'expert') {
      maxTokens = 8192;
    }

    return {
      modelId: model.modelId,
      thinkingLevel,
      temperature,
      maxTokens,
      capabilities: model.capabilities,
    };
  }

  /**
   * Match model to complexity level
   */
  private matchComplexity(model: ModelCandidate, complexity: ComplexityLevel): number {
    const qualityThresholds: Record<ComplexityLevel, number> = {
      trivial: 60,
      simple: 70,
      moderate: 80,
      complex: 88,
      expert: 95,
    };

    const threshold = qualityThresholds[complexity];

    if (model.qualityScore >= threshold) {
      // Model is adequate or overkill
      const overkill = (model.qualityScore - threshold) / 20;
      return 1 - Math.min(overkill * 0.3, 0.3); // Slight penalty for overkill
    } else {
      // Model might not be good enough
      const shortfall = (threshold - model.qualityScore) / 20;
      return Math.max(1 - shortfall, 0);
    }
  }

  /**
   * Get quality weight based on requirement
   */
  private getQualityWeight(quality: QualityLevel): number {
    const weights: Record<QualityLevel, number> = {
      draft: 0.2,
      standard: 0.4,
      high: 0.6,
      premium: 0.8,
    };
    return weights[quality];
  }

  /**
   * Detect vision requirement
   */
  private detectVisionRequirement(message: string): boolean {
    const visionIndicators = [
      'image', 'picture', 'photo', 'screenshot',
      'look at', 'analyze this', 'what do you see',
      '.png', '.jpg', '.jpeg', '.gif', '.webp',
    ];
    const messageLower = message.toLowerCase();
    return visionIndicators.some(i => messageLower.includes(i));
  }

  /**
   * Estimate context length
   */
  private estimateContextLength(message: string, context?: Context): number {
    const messageTokens = Math.ceil(message.length / 4); // Rough estimate
    const contextTokens = context?.tokenUsage.total || 0;
    return messageTokens + contextTokens;
  }

  /**
   * Infer quality requirement from complexity
   */
  private inferQualityRequirement(complexity: ComplexityLevel): QualityLevel {
    const mapping: Record<ComplexityLevel, QualityLevel> = {
      trivial: 'draft',
      simple: 'standard',
      moderate: 'standard',
      complex: 'high',
      expert: 'premium',
    };
    return mapping[complexity];
  }

  /**
   * Estimate cost for a model
   */
  private estimateCost(model: ModelCandidate, tokenCount: number): number {
    const inputCost = (tokenCount * model.costPer1kTokens.input) / 1000;
    const outputCost = (tokenCount * 0.5 * model.costPer1kTokens.output) / 1000; // Estimate output as 50% of input
    return inputCost + outputCost;
  }

  /**
   * Estimate latency for a model
   */
  private estimateLatency(model: ModelCandidate, tokenCount: number): number {
    const estimatedOutputTokens = tokenCount * 0.3; // Estimate
    return model.latencyMs.firstToken + (estimatedOutputTokens * model.latencyMs.perToken);
  }

  /**
   * Record model usage result
   */
  recordUsage(modelId: string, success: boolean): void {
    const history = this.usageHistory.get(modelId) || { success: 0, total: 0 };
    history.total++;
    if (success) history.success++;
    this.usageHistory.set(modelId, history);
  }
}

// ============================================================================
// SINGLETON & CONVENIENCE
// ============================================================================

let selectorInstance: DynamicModelSelector | null = null;

export function getModelSelector(): DynamicModelSelector {
  if (!selectorInstance) {
    selectorInstance = new DynamicModelSelector();
  }
  return selectorInstance;
}

export function selectOptimalModel(
  message: string,
  context?: Context
): ModelRecommendation {
  return getModelSelector().selectModel(message, context);
}

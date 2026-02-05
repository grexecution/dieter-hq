/**
 * Central Context Manager
 * 
 * Orchestrates all context management components:
 * - Context lifecycle management
 * - Intelligent routing
 * - Dynamic model selection
 * - Background task tracking
 * - Context summarization
 * - Predictive recommendations
 */

import {
  Context,
  ContextType,
  ContextStatus,
  ContextMessage,
  ModelConfig,
  ContextManagerState,
  ContextManagerConfig,
  ContextSwitchOptions,
  ContextMetrics,
  SystemMetrics,
  TokenUsage,
  ThinkingLevel,
  RoutingDecision,
  ModelRecommendation,
  ThreadRecommendation,
  ContextTransition,
  TrackedTask,
  ContextSummary,
} from './types';

import { IntelligentContextRouter, getContextRouter } from './router';
import { DynamicModelSelector, getModelSelector } from './model-selector';
import { BackgroundTaskTracker, getTaskTracker, CreateTaskParams } from './task-tracker';
import { ContextSummarizer, ContextTransitionManager, getContextSummarizer, getTransitionManager } from './summarizer';
import { ThreadRecommender, PredictiveContextEngine, getThreadRecommender, getPredictiveEngine, PredictedContext, ProactiveSuggestion } from './recommender';

// ============================================================================
// CONTEXT MANAGER
// ============================================================================

export class ContextManager {
  private state: ContextManagerState;
  private config: ContextManagerConfig;
  
  private router: IntelligentContextRouter;
  private modelSelector: DynamicModelSelector;
  private taskTracker: BackgroundTaskTracker;
  private summarizer: ContextSummarizer;
  private transitionManager: ContextTransitionManager;
  private recommender: ThreadRecommender;
  private predictionEngine: PredictiveContextEngine;

  private eventListeners: Map<string, ContextEventListener[]> = new Map();

  constructor(config?: Partial<ContextManagerConfig>) {
    this.config = {
      maxContexts: 20,
      defaultModel: 'anthropic/claude-3-5-haiku-20241022',
      defaultThinkingLevel: 'off',
      summarizeThreshold: 20,
      archiveAfterInactivityMs: 7 * 24 * 60 * 60 * 1000, // 7 days
      enableAutoRouting: true,
      enablePredictiveRecommendations: true,
      enableBackgroundTasking: true,
      ...config,
    };

    this.state = {
      contexts: new Map(),
      activeContextId: null,
      backgroundContextIds: [],
      transitionHistory: [],
      backgroundTasks: {
        tasks: new Map(),
        listeners: new Map(),
        history: [],
      },
      recommendations: [],
    };

    // Initialize components
    this.router = getContextRouter();
    this.modelSelector = getModelSelector();
    this.taskTracker = getTaskTracker();
    this.summarizer = getContextSummarizer();
    this.transitionManager = getTransitionManager();
    this.recommender = getThreadRecommender();
    this.predictionEngine = getPredictiveEngine();
  }

  // ==========================================================================
  // CONTEXT LIFECYCLE
  // ==========================================================================

  /**
   * Create a new context
   */
  createContext(params: CreateContextParams): Context {
    const id = params.id || this.generateId();
    const now = new Date();

    // Check max contexts
    if (this.state.contexts.size >= this.config.maxContexts) {
      // Auto-archive oldest inactive context
      this.autoArchiveOldest();
    }

    // Get model config
    const modelConfig = params.modelConfig || this.getDefaultModelConfig();

    const context: Context = {
      id,
      type: params.type || 'primary',
      status: 'active',
      config: modelConfig,
      messages: [],
      tokenUsage: { prompt: 0, completion: 0, total: 0 },
      tasks: {
        pending: [],
        active: [],
        completed: [],
        failed: [],
      },
      createdAt: now,
      lastActiveAt: now,
      childContextIds: [],
      goal: params.goal,
      priority: params.priority || 5,
      routingHints: params.routingHints || [],
      intents: [],
    };

    // Set parent if provided
    if (params.parentContextId) {
      context.parentContextId = params.parentContextId;
      const parent = this.state.contexts.get(params.parentContextId);
      if (parent) {
        parent.childContextIds.push(id);
      }
    }

    this.state.contexts.set(id, context);

    // Set as active if no active context
    if (!this.state.activeContextId) {
      this.state.activeContextId = id;
    }

    this.emit('context:created', { context });

    return context;
  }

  /**
   * Get a context by ID
   */
  getContext(id: string): Context | null {
    return this.state.contexts.get(id) || null;
  }

  /**
   * Get the active context
   */
  getActiveContext(): Context | null {
    if (!this.state.activeContextId) return null;
    return this.state.contexts.get(this.state.activeContextId) || null;
  }

  /**
   * Get all contexts
   */
  getAllContexts(): Context[] {
    return Array.from(this.state.contexts.values());
  }

  /**
   * Get contexts by type
   */
  getContextsByType(type: ContextType): Context[] {
    return this.getAllContexts().filter(c => c.type === type);
  }

  /**
   * Get contexts by status
   */
  getContextsByStatus(status: ContextStatus): Context[] {
    return this.getAllContexts().filter(c => c.status === status);
  }

  /**
   * Update context
   */
  updateContext(id: string, updates: Partial<Context>): Context | null {
    const context = this.state.contexts.get(id);
    if (!context) return null;

    const updated = {
      ...context,
      ...updates,
      lastActiveAt: new Date(),
    };

    this.state.contexts.set(id, updated);
    this.emit('context:updated', { context: updated });

    return updated;
  }

  /**
   * Add a message to a context
   */
  addMessage(contextId: string, message: Omit<ContextMessage, 'id' | 'timestamp'>): ContextMessage | null {
    const context = this.state.contexts.get(contextId);
    if (!context) return null;

    const fullMessage: ContextMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...message,
    };

    context.messages.push(fullMessage);
    context.lastActiveAt = new Date();

    // Update token count (estimate)
    const tokenCount = Math.ceil(message.content.length / 4);
    fullMessage.tokenCount = tokenCount;
    context.tokenUsage.total += tokenCount;
    if (message.role === 'user') {
      context.tokenUsage.prompt += tokenCount;
    } else {
      context.tokenUsage.completion += tokenCount;
    }

    // Check if summarization needed
    if (context.messages.length % this.config.summarizeThreshold === 0) {
      this.autoSummarize(contextId);
    }

    // Detect intents from user messages
    if (message.role === 'user') {
      context.intents = this.router.classifyIntent(message.content);
    }

    this.emit('message:added', { contextId, message: fullMessage });

    return fullMessage;
  }

  /**
   * Archive a context
   */
  archiveContext(id: string): boolean {
    const context = this.state.contexts.get(id);
    if (!context) return false;

    context.status = 'archived';

    // If this was active, clear it
    if (this.state.activeContextId === id) {
      this.state.activeContextId = null;
      // Activate the next best context
      const active = this.getAllContexts().find(c => c.status === 'active');
      if (active) {
        this.state.activeContextId = active.id;
      }
    }

    // Remove from background contexts
    this.state.backgroundContextIds = this.state.backgroundContextIds.filter(cid => cid !== id);

    this.emit('context:archived', { context });

    return true;
  }

  /**
   * Delete a context
   */
  deleteContext(id: string): boolean {
    const context = this.state.contexts.get(id);
    if (!context) return false;

    // Cancel any running tasks
    this.taskTracker.cancelContextTasks(id, 'Context deleted');

    // Remove from state
    this.state.contexts.delete(id);

    // Update active context if needed
    if (this.state.activeContextId === id) {
      this.state.activeContextId = null;
      const active = this.getAllContexts().find(c => c.status === 'active');
      if (active) {
        this.state.activeContextId = active.id;
      }
    }

    // Remove from parent's children
    if (context.parentContextId) {
      const parent = this.state.contexts.get(context.parentContextId);
      if (parent) {
        parent.childContextIds = parent.childContextIds.filter(cid => cid !== id);
      }
    }

    this.emit('context:deleted', { contextId: id });

    return true;
  }

  // ==========================================================================
  // INTELLIGENT ROUTING
  // ==========================================================================

  /**
   * Route a message to the appropriate context
   */
  routeMessage(message: string): RoutingDecision {
    const currentContext = this.getActiveContext();
    return this.router.route(
      message,
      this.state.contexts,
      currentContext?.id || null
    );
  }

  /**
   * Handle message with auto-routing
   */
  async handleMessage(
    message: string,
    options?: HandleMessageOptions
  ): Promise<HandleMessageResult> {
    // Route the message if auto-routing enabled
    let targetContextId = options?.contextId || this.state.activeContextId;
    let routingDecision: RoutingDecision | null = null;

    if (this.config.enableAutoRouting && !options?.skipRouting) {
      routingDecision = this.routeMessage(message);
      
      if (routingDecision.suggestNewContext && routingDecision.suggestedContextType) {
        // Create new context if suggested
        const newContext = this.createContext({
          type: routingDecision.suggestedContextType,
          goal: this.extractGoalFromMessage(message),
        });
        targetContextId = newContext.id;
      } else if (routingDecision.confidence > 0.7) {
        targetContextId = routingDecision.targetContextId;
      }
    }

    // Ensure we have a target context
    if (!targetContextId) {
      const newContext = this.createContext({
        type: 'primary',
        goal: this.extractGoalFromMessage(message),
      });
      targetContextId = newContext.id;
    }

    const context = this.state.contexts.get(targetContextId)!;

    // Switch context if needed
    if (targetContextId !== this.state.activeContextId) {
      await this.switchContext(targetContextId, options?.switchOptions);
    }

    // Add the message
    const addedMessage = this.addMessage(targetContextId, {
      role: 'user',
      content: message,
    });

    // Get model recommendation
    const modelRec = this.modelSelector.selectModel(message, context);

    // Get thread recommendations
    const recommendations = this.config.enablePredictiveRecommendations
      ? this.recommender.getRecommendations(
          message,
          this.state.contexts,
          context,
          undefined,
          3
        )
      : [];

    this.state.recommendations = recommendations;

    return {
      contextId: targetContextId,
      message: addedMessage!,
      routingDecision,
      modelRecommendation: modelRec,
      recommendations,
    };
  }

  // ==========================================================================
  // CONTEXT SWITCHING
  // ==========================================================================

  /**
   * Switch to a different context
   */
  async switchContext(
    targetContextId: string,
    options?: ContextSwitchOptions
  ): Promise<boolean> {
    const currentContext = this.getActiveContext();
    const targetContext = this.state.contexts.get(targetContextId);

    if (!targetContext) return false;

    // Plan transition
    if (currentContext) {
      const plan = this.transitionManager.planTransition(
        currentContext,
        targetContext,
        'switch',
        options
      );

      // Execute transitions
      for (const transition of plan.transitions) {
        this.transitionManager.executeTransition(transition);
        this.state.transitionHistory.push(transition);
      }

      // Summarize current context if requested
      if (options?.summarizeBeforeSwitch) {
        await this.autoSummarize(currentContext.id);
      }
    }

    // Update active context
    this.state.activeContextId = targetContextId;
    targetContext.status = 'active';
    targetContext.lastActiveAt = new Date();

    // Record usage for learning
    this.router.recordContextUsage(targetContextId);

    this.emit('context:switched', {
      from: currentContext?.id,
      to: targetContextId,
    });

    return true;
  }

  /**
   * Spawn a child context (subagent)
   */
  spawnSubcontext(
    parentContextId: string,
    params: Omit<CreateContextParams, 'parentContextId'>
  ): Context {
    const childContext = this.createContext({
      ...params,
      type: params.type || 'task',
      parentContextId,
    });

    // Add to background if not setting as active
    if (!params.setActive) {
      this.state.backgroundContextIds.push(childContext.id);
    }

    this.emit('context:spawned', {
      parentId: parentContextId,
      childId: childContext.id,
    });

    return childContext;
  }

  /**
   * Complete a subcontext and return to parent
   */
  async completeSubcontext(
    contextId: string,
    result?: unknown
  ): Promise<boolean> {
    const context = this.state.contexts.get(contextId);
    if (!context || !context.parentContextId) return false;

    // Mark as completed
    context.status = 'completed';

    // Summarize if it had activity
    if (context.messages.length > 0) {
      await this.autoSummarize(contextId);
    }

    // Create transition
    const parentContext = this.state.contexts.get(context.parentContextId);
    if (parentContext) {
      const transition: ContextTransition = {
        id: `transition_${Date.now()}`,
        fromContextId: contextId,
        toContextId: context.parentContextId,
        type: 'complete',
        timestamp: new Date(),
        handoffSummary: context.summary?.shortSummary,
        sharedState: { result },
        preservedEntities: context.summary?.entities.slice(0, 5) || [],
        userInitiated: false,
        notificationSent: true,
      };

      this.state.transitionHistory.push(transition);

      // Switch back to parent if this was active
      if (this.state.activeContextId === contextId) {
        await this.switchContext(context.parentContextId);
      }
    }

    // Remove from background contexts
    this.state.backgroundContextIds = this.state.backgroundContextIds.filter(
      id => id !== contextId
    );

    this.emit('context:completed', { context, result });

    return true;
  }

  // ==========================================================================
  // MODEL SELECTION
  // ==========================================================================

  /**
   * Get model recommendation for current context
   */
  getModelRecommendation(message: string): ModelRecommendation {
    const context = this.getActiveContext();
    return this.modelSelector.selectModel(message, context || undefined);
  }

  /**
   * Get multiple model options
   */
  getModelOptions(count: number = 3): ModelRecommendation[] {
    const context = this.getActiveContext();
    if (!context) return [];
    return this.modelSelector.getRecommendationsForContext(context, count);
  }

  /**
   * Update context model config
   */
  setContextModel(
    contextId: string,
    modelConfig: Partial<ModelConfig>
  ): boolean {
    const context = this.state.contexts.get(contextId);
    if (!context) return false;

    context.config = { ...context.config, ...modelConfig };
    return true;
  }

  // ==========================================================================
  // BACKGROUND TASKS
  // ==========================================================================

  /**
   * Create a background task
   */
  createTask(params: Omit<CreateTaskParams, 'contextId'>): TrackedTask {
    const contextId = this.state.activeContextId || this.createContext({ type: 'background' }).id;
    return this.taskTracker.createTask({ ...params, contextId });
  }

  /**
   * Get all active tasks
   */
  getActiveTasks(): TrackedTask[] {
    return this.taskTracker.getActiveTasks();
  }

  /**
   * Get tasks for a context
   */
  getContextTasks(contextId: string): TrackedTask[] {
    return this.taskTracker.getTasksForContext(contextId);
  }

  /**
   * Update task progress
   */
  updateTaskProgress(taskId: string, progress: number, message?: string): void {
    this.taskTracker.updateProgress(taskId, progress, message);
  }

  /**
   * Complete a task
   */
  completeTask(taskId: string, result?: unknown): void {
    this.taskTracker.completeTask(taskId, result);
  }

  /**
   * Fail a task
   */
  failTask(taskId: string, error: string): void {
    this.taskTracker.failTask(taskId, error);
  }

  // ==========================================================================
  // SUMMARIZATION
  // ==========================================================================

  /**
   * Summarize a context
   */
  summarizeContext(contextId: string): ContextSummary | null {
    const context = this.state.contexts.get(contextId);
    if (!context) return null;

    const summary = this.summarizer.summarize(context);
    context.summary = summary;
    context.lastSummarizedAt = new Date();

    return summary;
  }

  /**
   * Get context summary
   */
  getContextSummary(contextId: string): ContextSummary | null {
    const context = this.state.contexts.get(contextId);
    return context?.summary || null;
  }

  private async autoSummarize(contextId: string): Promise<void> {
    const context = this.state.contexts.get(contextId);
    if (!context) return;

    if (context.summary) {
      // Incremental update
      const newMessages = context.messages.slice(context.summary.messageRange.to);
      if (newMessages.length > 0) {
        context.summary = this.summarizer.incrementalSummarize(
          context,
          context.summary,
          newMessages
        );
      }
    } else {
      // Full summarization
      context.summary = this.summarizer.summarize(context);
    }

    context.lastSummarizedAt = new Date();
  }

  // ==========================================================================
  // RECOMMENDATIONS
  // ==========================================================================

  /**
   * Get thread recommendations
   */
  getRecommendations(message?: string): ThreadRecommendation[] {
    if (message) {
      return this.recommender.getRecommendations(
        message,
        this.state.contexts,
        this.getActiveContext()
      );
    }
    return this.state.recommendations;
  }

  /**
   * Get proactive suggestions
   */
  getProactiveSuggestions(): ProactiveSuggestion[] {
    return this.predictionEngine.generateProactiveSuggestions(
      this.state.contexts,
      this.getActiveContext()
    );
  }

  /**
   * Predict context for message
   */
  predictContext(message: string): PredictedContext | null {
    return this.predictionEngine.predictNextContext(
      message,
      this.state.contexts,
      this.getActiveContext()
    );
  }

  // ==========================================================================
  // METRICS & ANALYTICS
  // ==========================================================================

  /**
   * Get metrics for a context
   */
  getContextMetrics(contextId: string): ContextMetrics | null {
    const context = this.state.contexts.get(contextId);
    if (!context) return null;

    const taskHistory = this.taskTracker.getHistoryForContext(contextId);
    const completedTasks = taskHistory.filter(t => t.status === 'completed').length;
    const failedTasks = taskHistory.filter(t => t.status === 'failed').length;
    const totalTasks = taskHistory.length;

    return {
      contextId,
      messageCount: context.messages.length,
      totalTokens: context.tokenUsage.total,
      averageResponseTime: 0, // Would need timing data
      taskCompletionRate: totalTasks > 0 ? completedTasks / totalTasks : 1,
      errorRate: totalTasks > 0 ? failedTasks / totalTasks : 0,
      modelUsage: { [context.config.modelId]: context.messages.length },
    };
  }

  /**
   * Get system-wide metrics
   */
  getSystemMetrics(): SystemMetrics {
    const contexts = this.getAllContexts();
    const activeContexts = contexts.filter(c => c.status === 'active').length;
    
    let totalMessages = 0;
    let totalTokens = 0;
    const modelUsage: Record<string, number> = {};

    for (const context of contexts) {
      totalMessages += context.messages.length;
      totalTokens += context.tokenUsage.total;
      modelUsage[context.config.modelId] = (modelUsage[context.config.modelId] || 0) + 1;
    }

    const taskStats = this.taskTracker.getStatistics();

    return {
      totalContexts: contexts.length,
      activeContexts,
      totalMessages,
      totalTokensUsed: totalTokens,
      averageContextLength: contexts.length > 0 ? totalMessages / contexts.length : 0,
      mostUsedModels: Object.entries(modelUsage)
        .sort((a, b) => b[1] - a[1])
        .map(([model, usage]) => ({ model, usage })),
      taskCompletionRate: taskStats.successRate,
      averageTaskDuration: taskStats.averageDurationMs,
    };
  }

  // ==========================================================================
  // EVENT HANDLING
  // ==========================================================================

  /**
   * Add event listener
   */
  on(event: string, listener: ContextEventListener): () => void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);

    return () => {
      const current = this.eventListeners.get(event) || [];
      this.eventListeners.set(event, current.filter(l => l !== listener));
    };
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (e) {
        console.error(`Event listener error for ${event}:`, e);
      }
    }
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  /**
   * Export state for persistence
   */
  exportState(): ExportedContextManagerState {
    const contexts: Context[] = [];
    for (const context of this.state.contexts.values()) {
      contexts.push(context);
    }

    return {
      contexts,
      activeContextId: this.state.activeContextId,
      backgroundContextIds: this.state.backgroundContextIds,
      transitionHistory: this.state.transitionHistory,
      taskState: this.taskTracker.exportState(),
      exportedAt: new Date(),
    };
  }

  /**
   * Import state from persistence
   */
  importState(exported: ExportedContextManagerState): void {
    // Clear current state
    this.state.contexts.clear();

    // Import contexts
    for (const context of exported.contexts) {
      // Restore Date objects
      context.createdAt = new Date(context.createdAt);
      context.lastActiveAt = new Date(context.lastActiveAt);
      if (context.lastSummarizedAt) {
        context.lastSummarizedAt = new Date(context.lastSummarizedAt);
      }
      for (const msg of context.messages) {
        msg.timestamp = new Date(msg.timestamp);
      }
      this.state.contexts.set(context.id, context);
    }

    this.state.activeContextId = exported.activeContextId;
    this.state.backgroundContextIds = exported.backgroundContextIds;
    this.state.transitionHistory = exported.transitionHistory.map(t => ({
      ...t,
      timestamp: new Date(t.timestamp),
    }));

    // Import task state
    this.taskTracker.importState(exported.taskState);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private generateId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultModelConfig(): ModelConfig {
    return {
      modelId: this.config.defaultModel,
      thinkingLevel: this.config.defaultThinkingLevel,
      temperature: 0.7,
      maxTokens: 4096,
      capabilities: [],
    };
  }

  private autoArchiveOldest(): void {
    let oldest: Context | null = null;
    let oldestTime = Date.now();

    for (const context of this.state.contexts.values()) {
      if (context.status !== 'active') continue;
      if (context.id === this.state.activeContextId) continue;

      const lastActive = context.lastActiveAt.getTime();
      if (lastActive < oldestTime) {
        oldestTime = lastActive;
        oldest = context;
      }
    }

    if (oldest) {
      this.archiveContext(oldest.id);
    }
  }

  private extractGoalFromMessage(message: string): string {
    // Extract first sentence or first 50 chars
    const firstSentence = message.match(/^[^.!?]+[.!?]?/);
    if (firstSentence && firstSentence[0].length < 100) {
      return firstSentence[0].trim();
    }
    return message.slice(0, 50) + (message.length > 50 ? '...' : '');
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreateContextParams {
  id?: string;
  type?: ContextType;
  goal?: string;
  priority?: number;
  parentContextId?: string;
  modelConfig?: ModelConfig;
  routingHints?: Context['routingHints'];
  setActive?: boolean;
}

export interface HandleMessageOptions {
  contextId?: string;
  skipRouting?: boolean;
  switchOptions?: ContextSwitchOptions;
}

export interface HandleMessageResult {
  contextId: string;
  message: ContextMessage;
  routingDecision: RoutingDecision | null;
  modelRecommendation: ModelRecommendation;
  recommendations: ThreadRecommendation[];
}

export type ContextEventListener = (data: unknown) => void;

export interface ExportedContextManagerState {
  contexts: Context[];
  activeContextId: string | null;
  backgroundContextIds: string[];
  transitionHistory: ContextTransition[];
  taskState: ReturnType<BackgroundTaskTracker['exportState']>;
  exportedAt: Date;
}

// ============================================================================
// SINGLETON & CONVENIENCE
// ============================================================================

let managerInstance: ContextManager | null = null;

export function getContextManager(config?: Partial<ContextManagerConfig>): ContextManager {
  if (!managerInstance) {
    managerInstance = new ContextManager(config);
  }
  return managerInstance;
}

export function createNewContext(params: CreateContextParams): Context {
  return getContextManager().createContext(params);
}

export function switchToContext(contextId: string): Promise<boolean> {
  return getContextManager().switchContext(contextId);
}

export function handleUserMessage(
  message: string,
  options?: HandleMessageOptions
): Promise<HandleMessageResult> {
  return getContextManager().handleMessage(message, options);
}

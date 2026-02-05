/**
 * Advanced AI Context Management System
 * 
 * Export all context management functionality
 */

// Core types
export * from './types';

// Intelligent routing
export {
  IntelligentContextRouter,
  getContextRouter,
  routeMessage,
  classifyMessageIntent,
} from './router';

// Dynamic model selection
export {
  DynamicModelSelector,
  ComplexityAnalyzer,
  getModelSelector,
  selectOptimalModel,
} from './model-selector';

// Background task tracking
export {
  BackgroundTaskTracker,
  getTaskTracker,
  trackTask,
  updateTaskProgress,
  completeTrackedTask,
  failTrackedTask,
  type CreateTaskParams,
  type TaskStatistics,
  type ExportedTaskState,
} from './task-tracker';

// Context summarization
export {
  ContextSummarizer,
  ContextTransitionManager,
  getContextSummarizer,
  getTransitionManager,
  summarizeContext,
  planContextSwitch,
  type SummarizeOptions,
} from './summarizer';

// Predictive recommendations
export {
  ThreadRecommender,
  PredictiveContextEngine,
  getThreadRecommender,
  getPredictiveEngine,
  getThreadRecommendations,
  predictContext,
  type PredictedContext,
  type ProactiveSuggestion,
} from './recommender';

// Central context manager
export {
  ContextManager,
  getContextManager,
  createNewContext,
  switchToContext,
  handleUserMessage,
  type CreateContextParams,
  type HandleMessageOptions,
  type HandleMessageResult,
  type ContextEventListener,
  type ExportedContextManagerState,
} from './manager';

/**
 * AI Integration Framework for Dieter HQ
 * 
 * A comprehensive AI-powered productivity system providing:
 * 
 * 1. **Natural Language Processing** - Create tasks from natural language
 * 2. **Intelligent Prioritization** - Dynamic priority scoring based on multiple factors
 * 3. **Predictive Scheduling** - ML-powered optimal time slot recommendations
 * 4. **Context-Aware Communication** - Smart message drafting
 * 5. **Task Optimization Engine** - Pattern detection and workflow improvements
 * 6. **AI Task Manager** - Unified interface for all AI features
 * 
 * @example
 * ```typescript
 * import { createTaskManager } from '@/lib/ai';
 * 
 * const manager = createTaskManager();
 * 
 * // Create task from natural language
 * const task = manager.createFromNaturalLanguage(
 *   "Review quarterly report by Friday !high #work"
 * );
 * 
 * // Get AI-powered suggestions
 * const suggestions = manager.getTaskSuggestions(task.id);
 * 
 * // Generate optimal schedule
 * const schedule = manager.generateSchedule(new Date());
 * 
 * // Get optimization recommendations
 * const optimizations = manager.getOptimizations();
 * ```
 * 
 * @module ai
 */

// Core Types
export * from './types';

// NLP Module - Natural Language Processing for Task Creation
export {
  TaskNLPParser,
  parseTaskFromText,
  extractDueDate,
  normalizeTaskTitle,
} from './nlp';

// Prioritization Module - Intelligent Task Prioritization
export {
  PrioritizationEngine,
  calculatePriority,
  getNextTask,
  sortByPriority,
} from './prioritization';

// Scheduler Module - Predictive Scheduling Algorithms
export {
  PredictiveScheduler,
  createScheduler,
  generateSchedule,
  findBestTimeForTask,
} from './scheduler';

// Communication Module - Context-Aware Communication Drafting
export {
  CommunicationDrafter,
  createDrafter,
  draftFollowUp,
  draftMeetingRequest,
} from './communication';

// Optimization Module - Machine Learning Task Optimization Engine
export {
  OptimizationEngine,
  createOptimizer,
  analyzeTasksQuick,
  getTopRecommendations,
} from './optimization';

// Tasks Module - AI-Powered Task Management (Unified Interface)
export {
  AITaskManager,
  createTaskManager,
  quickCreateTask,
  parseTask,
  type CreateTaskParams,
  type TaskSuggestions,
} from './tasks';

// ============================================================================
// QUICK START UTILITIES
// ============================================================================

import { AITaskManager } from './tasks';
import type { UserContext, Task, OptimizationResult } from './types';

/**
 * Quick setup with default configuration
 * 
 * @example
 * ```typescript
 * const { manager, context } = quickSetup();
 * const task = manager.createFromNaturalLanguage("Call mom tomorrow");
 * ```
 */
export function quickSetup(): { manager: AITaskManager; context: UserContext } {
  const manager = new AITaskManager();
  const context = manager.getDefaultContext();
  manager.setContext(context);
  return { manager, context };
}

/**
 * Analyze tasks and get a summary of recommendations
 * 
 * @example
 * ```typescript
 * const summary = await analyzeAndSummarize(tasks);
 * console.log(summary.topPriority);
 * console.log(summary.quickWins);
 * console.log(summary.recommendations);
 * ```
 */
export function analyzeAndSummarize(tasks: Task[]): AnalysisSummary {
  const { manager, context } = quickSetup();
  manager.loadTasks(tasks);

  const prioritized = manager.getPrioritizedTasks(5);
  const quickWins = manager.getQuickWins(15);
  const optimizations = manager.getOptimizations();
  const nextTask = manager.getNextTask();

  return {
    topPriority: nextTask?.task ?? null,
    topPriorityReason: nextTask?.score.recommendation ?? '',
    quickWins,
    urgentCount: tasks.filter(t => t.priority === 'critical' || t.priority === 'high').length,
    overdueCount: tasks.filter(t => t.dueAt && t.dueAt < new Date() && t.status !== 'done').length,
    recommendations: optimizations.recommendations.slice(0, 5).map(r => ({
      type: r.type,
      suggestion: r.suggestion,
      impact: r.expectedImprovement,
    })),
    patterns: optimizations.patterns.map(p => ({
      type: p.type,
      description: p.description,
      impact: p.impact,
    })),
    insights: optimizations.insights.slice(0, 3).map(i => ({
      title: i.title,
      description: i.description,
      actionable: i.actionable,
    })),
    overallScore: optimizations.overallScore,
  };
}

/**
 * Analysis summary type
 */
export interface AnalysisSummary {
  topPriority: Task | null;
  topPriorityReason: string;
  quickWins: Task[];
  urgentCount: number;
  overdueCount: number;
  recommendations: Array<{
    type: string;
    suggestion: string;
    impact: number;
  }>;
  patterns: Array<{
    type: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  insights: Array<{
    title: string;
    description: string;
    actionable: boolean;
  }>;
  overallScore: number;
}

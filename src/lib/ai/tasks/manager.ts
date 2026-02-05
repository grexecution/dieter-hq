/**
 * AI-Powered Task Management
 * 
 * High-level task management interface that integrates all AI components
 * for intelligent task creation, scheduling, prioritization, and optimization.
 */

import {
  Task,
  UserContext,
  ParsedTaskIntent,
  PriorityScore,
  ScheduleRecommendation,
  DailySchedule,
  OptimizationResult,
  DraftedCommunication,
  TaskStatus,
  TaskPriority,
  TaskEnergyLevel,
  TaskContextType,
} from '../types';

import { TaskNLPParser, parseTaskFromText } from '../nlp';
import { PrioritizationEngine } from '../prioritization';
import { PredictiveScheduler } from '../scheduler';
import { OptimizationEngine } from '../optimization';
import { CommunicationDrafter } from '../communication';

// ============================================================================
// AI TASK MANAGER
// ============================================================================

export class AITaskManager {
  private nlpParser: TaskNLPParser;
  private prioritizer: PrioritizationEngine;
  private scheduler: PredictiveScheduler;
  private optimizer: OptimizationEngine;
  private drafter: CommunicationDrafter;
  
  private tasks: Map<string, Task>;
  private userContext: UserContext | null;

  constructor() {
    this.nlpParser = new TaskNLPParser();
    this.prioritizer = new PrioritizationEngine();
    this.scheduler = new PredictiveScheduler();
    this.optimizer = new OptimizationEngine();
    this.drafter = new CommunicationDrafter();
    
    this.tasks = new Map();
    this.userContext = null;
  }

  // ==========================================================================
  // CONTEXT MANAGEMENT
  // ==========================================================================

  /**
   * Set the current user context
   */
  setContext(context: UserContext): void {
    this.userContext = context;
  }

  /**
   * Update specific context fields
   */
  updateContext(updates: Partial<UserContext>): void {
    if (this.userContext) {
      this.userContext = { ...this.userContext, ...updates };
    }
  }

  /**
   * Get a default context for testing/development
   */
  getDefaultContext(): UserContext {
    const now = new Date();
    return {
      currentTime: now,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currentEnergyLevel: this.inferCurrentEnergyLevel(now),
      availableMinutes: this.estimateAvailableMinutes(now),
      workHours: { start: '09:00', end: '18:00' },
      focusHours: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '16:00' },
      ],
      breakPatterns: [
        { afterMinutes: 90, durationMinutes: 15 },
        { afterMinutes: 180, durationMinutes: 30 },
      ],
      productivityByHour: this.getDefaultProductivityByHour(),
      productivityByDay: this.getDefaultProductivityByDay(),
      averageTaskCompletion: 1.2, // Tasks take 20% longer than estimated
      recentTags: [],
      upcomingEvents: [],
    };
  }

  // ==========================================================================
  // TASK CREATION
  // ==========================================================================

  /**
   * Create a task from natural language input
   */
  createFromNaturalLanguage(input: string): Task {
    const parsed = this.nlpParser.parse(input);
    return this.createFromParsedIntent(parsed);
  }

  /**
   * Create a task from a parsed intent
   */
  createFromParsedIntent(intent: ParsedTaskIntent): Task {
    const now = new Date();
    const id = this.generateId();

    const task: Task = {
      id,
      title: intent.title,
      description: intent.description,
      status: 'inbox',
      priority: intent.priority ?? 'medium',
      estimatedMinutes: intent.duration,
      dueAt: intent.dueDate,
      context: intent.context ?? [],
      tags: intent.tags ?? [],
      blockedBy: [],
      blocks: [],
      energyRequired: this.inferEnergyRequired(intent),
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    return task;
  }

  /**
   * Create a task with explicit parameters
   */
  createTask(params: CreateTaskParams): Task {
    const now = new Date();
    const id = params.id ?? this.generateId();

    const task: Task = {
      id,
      title: params.title,
      description: params.description,
      status: params.status ?? 'inbox',
      priority: params.priority ?? 'medium',
      estimatedMinutes: params.estimatedMinutes,
      dueAt: params.dueAt,
      context: params.context ?? [],
      tags: params.tags ?? [],
      projectId: params.projectId,
      parentTaskId: params.parentTaskId,
      blockedBy: params.blockedBy ?? [],
      blocks: params.blocks ?? [],
      energyRequired: params.energyRequired ?? 'medium',
      focusTimeMinutes: params.focusTimeMinutes,
      recurrenceRule: params.recurrenceRule,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    return task;
  }

  /**
   * Parse natural language and return intent without creating task
   */
  parseIntent(input: string): ParsedTaskIntent {
    return this.nlpParser.parse(input);
  }

  // ==========================================================================
  // TASK MANAGEMENT
  // ==========================================================================

  /**
   * Get a task by ID
   */
  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.getAllTasks().filter(t => t.status === status);
  }

  /**
   * Update a task
   */
  updateTask(id: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(id);
    if (!task) return null;

    const updated = {
      ...task,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.tasks.set(id, updated);
    return updated;
  }

  /**
   * Complete a task
   */
  completeTask(id: string, actualMinutes?: number): Task | null {
    const task = this.tasks.get(id);
    if (!task) return null;

    const completedAt = new Date();
    
    // Record completion for learning
    if (actualMinutes) {
      this.scheduler.learnFromCompletion(task, actualMinutes, completedAt);
      this.optimizer.recordCompletion(task, actualMinutes, completedAt);
    }

    return this.updateTask(id, {
      status: 'done',
      completedAt,
      actualMinutes: actualMinutes ?? task.estimatedMinutes,
    });
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  /**
   * Load tasks from external source
   */
  loadTasks(tasks: Task[]): void {
    for (const task of tasks) {
      this.tasks.set(task.id, task);
    }
  }

  // ==========================================================================
  // AI-POWERED FEATURES
  // ==========================================================================

  /**
   * Get prioritized task list
   */
  getPrioritizedTasks(limit?: number): PriorityScore[] {
    const context = this.getContext();
    const tasks = this.getAllTasks();
    const ranked = this.prioritizer.rankTasks(tasks, context);
    return limit ? ranked.slice(0, limit) : ranked;
  }

  /**
   * Get the next task to work on
   */
  getNextTask(): { task: Task; score: PriorityScore } | null {
    const context = this.getContext();
    const tasks = this.getAllTasks().filter(
      t => t.status !== 'done' && t.status !== 'archived'
    );

    if (tasks.length === 0) return null;

    const scores = this.prioritizer.getContextualTasks(tasks, context, 1);
    if (scores.length === 0) return null;

    const task = tasks.find(t => t.id === scores[0].taskId);
    return task ? { task, score: scores[0] } : null;
  }

  /**
   * Get tasks that fit the current available time
   */
  getQuickWins(maxMinutes: number = 15): Task[] {
    const context = this.getContext();
    const tasks = this.getAllTasks().filter(
      t => t.status !== 'done' && 
           t.status !== 'archived' &&
           (t.estimatedMinutes ?? 30) <= maxMinutes
    );

    const scores = this.prioritizer.rankTasks(tasks, context);
    return scores
      .slice(0, 5)
      .map(s => tasks.find(t => t.id === s.taskId)!)
      .filter(Boolean);
  }

  /**
   * Generate a daily schedule
   */
  generateSchedule(date: Date = new Date()): DailySchedule {
    const context = this.getContext();
    const tasks = this.getAllTasks().filter(
      t => t.status !== 'done' && t.status !== 'archived'
    );

    return this.scheduler.generateDailySchedule(tasks, context, date);
  }

  /**
   * Find optimal time slot for a specific task
   */
  findOptimalSlot(taskId: string): ScheduleRecommendation | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const context = this.getContext();
    return this.scheduler.findOptimalSlots(task, context);
  }

  /**
   * Get task optimization recommendations
   */
  getOptimizations(): OptimizationResult {
    const context = this.getContext();
    const tasks = this.getAllTasks();
    return this.optimizer.analyze(tasks, context);
  }

  /**
   * Draft a follow-up message for a task
   */
  draftFollowUp(taskId: string, recipientName: string): DraftedCommunication | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    return this.drafter.draftTaskFollowUp(task, {
      id: this.generateId(),
      name: recipientName,
      relationship: 'colleague',
    });
  }

  /**
   * Draft a status update for multiple tasks
   */
  draftStatusUpdate(taskIds: string[], summary: string): DraftedCommunication {
    const tasks = taskIds
      .map(id => this.tasks.get(id))
      .filter((t): t is Task => t !== undefined);

    return this.drafter.draftStatusUpdate(
      [{ id: 'team', name: 'Team', relationship: 'colleague' }],
      tasks,
      summary
    );
  }

  /**
   * Get AI suggestions for a task
   */
  getTaskSuggestions(taskId: string): TaskSuggestions | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const context = this.getContext();
    const allTasks = this.getAllTasks();

    // Get priority score
    const priorityScore = this.prioritizer.scoreTask(task, context, allTasks);

    // Get optimal scheduling
    const scheduling = this.scheduler.findOptimalSlots(task, context);

    // Get duration prediction
    const durationPrediction = this.scheduler.predictDuration(task, context);

    // Get related optimizations
    const optimizations = this.optimizer.analyze([task], context);
    const relevantOptimizations = optimizations.recommendations.filter(
      r => r.taskId === taskId
    );

    return {
      priority: priorityScore,
      scheduling,
      predictedDuration: durationPrediction.value,
      durationConfidence: durationPrediction.confidence,
      optimizations: relevantOptimizations,
      insights: optimizations.insights,
    };
  }

  /**
   * Smart task search with NLP
   */
  searchTasks(query: string): Task[] {
    const queryLower = query.toLowerCase();
    const tasks = this.getAllTasks();

    // Parse the query for any special instructions
    const parsed = this.nlpParser.parse(query);

    // Filter and score tasks
    const scored = tasks.map(task => {
      let score = 0;

      // Title match
      if (task.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Tag match
      for (const tag of task.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 5;
        }
      }

      // Context match
      if (parsed.context) {
        for (const ctx of parsed.context) {
          if (task.context.includes(ctx)) {
            score += 3;
          }
        }
      }

      // Priority match
      if (parsed.priority && task.priority === parsed.priority) {
        score += 2;
      }

      // Date proximity
      if (parsed.dueDate && task.dueAt) {
        const daysDiff = Math.abs(
          (task.dueAt.getTime() - parsed.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 7) {
          score += 5 - Math.floor(daysDiff);
        }
      }

      return { task, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.task);
  }

  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================

  /**
   * Batch create tasks from multi-line input
   */
  batchCreate(input: string): Task[] {
    const lines = input.split('\n').filter(l => l.trim().length > 0);
    return lines.map(line => this.createFromNaturalLanguage(line));
  }

  /**
   * Batch update task status
   */
  batchUpdateStatus(ids: string[], status: TaskStatus): Task[] {
    return ids
      .map(id => this.updateTask(id, { status }))
      .filter((t): t is Task => t !== null);
  }

  /**
   * Auto-prioritize all tasks
   */
  autoPrioritize(): Map<string, TaskPriority> {
    const context = this.getContext();
    const tasks = this.getAllTasks().filter(
      t => t.status !== 'done' && t.status !== 'archived'
    );

    const scores = this.prioritizer.rankTasks(tasks, context);
    const updates = new Map<string, TaskPriority>();

    scores.forEach((score, index) => {
      let newPriority: TaskPriority;
      
      if (index < tasks.length * 0.1) {
        newPriority = 'critical';
      } else if (index < tasks.length * 0.3) {
        newPriority = 'high';
      } else if (index < tasks.length * 0.6) {
        newPriority = 'medium';
      } else if (index < tasks.length * 0.9) {
        newPriority = 'low';
      } else {
        newPriority = 'someday';
      }

      updates.set(score.taskId, newPriority);
      this.updateTask(score.taskId, { priority: newPriority });
    });

    return updates;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private getContext(): UserContext {
    return this.userContext ?? this.getDefaultContext();
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private inferEnergyRequired(intent: ParsedTaskIntent): TaskEnergyLevel {
    const title = intent.title.toLowerCase();

    // High energy keywords
    if (
      title.includes('create') ||
      title.includes('design') ||
      title.includes('write') ||
      title.includes('develop') ||
      title.includes('plan') ||
      title.includes('analyze')
    ) {
      return 'high';
    }

    // Low energy keywords
    if (
      title.includes('review') ||
      title.includes('read') ||
      title.includes('organize') ||
      title.includes('clean') ||
      title.includes('update') ||
      title.includes('check')
    ) {
      return 'low';
    }

    return 'medium';
  }

  private inferCurrentEnergyLevel(now: Date): TaskEnergyLevel {
    const hour = now.getHours();
    
    // Morning: high energy
    if (hour >= 8 && hour <= 11) return 'high';
    
    // After lunch: medium
    if (hour >= 12 && hour <= 14) return 'medium';
    
    // Afternoon: medium to high
    if (hour >= 14 && hour <= 17) return 'medium';
    
    // Evening: low
    return 'low';
  }

  private estimateAvailableMinutes(now: Date): number {
    const hour = now.getHours();
    
    // Assume work day ends at 18:00
    if (hour >= 18 || hour < 9) return 60;
    
    const remainingHours = 18 - hour;
    return remainingHours * 45; // 45 productive minutes per hour
  }

  private getDefaultProductivityByHour(): Record<number, number> {
    return {
      8: 60,
      9: 80,
      10: 90,
      11: 85,
      12: 50,
      13: 55,
      14: 75,
      15: 80,
      16: 70,
      17: 60,
      18: 40,
      19: 30,
      20: 25,
    };
  }

  private getDefaultProductivityByDay(): Record<number, number> {
    return {
      0: 30,  // Sunday
      1: 80,  // Monday
      2: 85,  // Tuesday
      3: 80,  // Wednesday
      4: 75,  // Thursday
      5: 65,  // Friday
      6: 40,  // Saturday
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTaskParams {
  id?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedMinutes?: number;
  dueAt?: Date;
  context?: TaskContextType[];
  tags?: string[];
  projectId?: string;
  parentTaskId?: string;
  blockedBy?: string[];
  blocks?: string[];
  energyRequired?: TaskEnergyLevel;
  focusTimeMinutes?: number;
  recurrenceRule?: Task['recurrenceRule'];
}

export interface TaskSuggestions {
  priority: PriorityScore;
  scheduling: ScheduleRecommendation;
  predictedDuration: number;
  durationConfidence: number;
  optimizations: Array<{
    taskId: string;
    type: string;
    suggestion: string;
    expectedImprovement: number;
    confidence: number;
    implementation: string;
  }>;
  insights: Array<{
    category: string;
    title: string;
    description: string;
    actionable: boolean;
    suggestedAction?: string;
    dataPoints: number;
    confidence: number;
  }>;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a new AI task manager instance
 */
export function createTaskManager(): AITaskManager {
  return new AITaskManager();
}

/**
 * Quick task creation from natural language
 */
export function quickCreateTask(input: string): Task {
  const manager = new AITaskManager();
  return manager.createFromNaturalLanguage(input);
}

/**
 * Parse task intent without creating
 */
export function parseTask(input: string): ParsedTaskIntent {
  return parseTaskFromText(input);
}

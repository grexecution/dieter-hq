/**
 * Intelligent Prioritization Engine
 * 
 * Uses multiple factors to compute dynamic priority scores for tasks,
 * enabling smart task ordering and focus recommendations.
 */

import {
  Task,
  UserContext,
  PriorityScore,
  PriorityFactor,
  PriorityConfig,
  TaskPriority,
  TaskContextType,
} from '../types';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  weights: {
    urgency: 0.25,
    importance: 0.20,
    effort: 0.15,
    contextFit: 0.15,
    dependency: 0.15,
    momentum: 0.10,
  },
  urgencyDecayDays: 7,
  importanceHalfLifeDays: 30,
};

// Priority base scores
const PRIORITY_BASE_SCORES: Record<TaskPriority, number> = {
  critical: 95,
  high: 75,
  medium: 50,
  low: 30,
  someday: 10,
};

// ============================================================================
// PRIORITIZATION ENGINE
// ============================================================================

export class PrioritizationEngine {
  private config: PriorityConfig;

  constructor(config: Partial<PriorityConfig> = {}) {
    this.config = {
      ...DEFAULT_PRIORITY_CONFIG,
      ...config,
      weights: {
        ...DEFAULT_PRIORITY_CONFIG.weights,
        ...config.weights,
      },
    };
  }

  /**
   * Calculate priority score for a single task
   */
  scoreTask(task: Task, context: UserContext, allTasks: Task[]): PriorityScore {
    const factors: PriorityFactor[] = [];

    // Calculate each component score
    const urgencyScore = this.calculateUrgency(task, context.currentTime);
    factors.push(this.createFactor('urgency', urgencyScore, task, context));

    const importanceScore = this.calculateImportance(task);
    factors.push(this.createFactor('importance', importanceScore, task, context));

    const effortScore = this.calculateEffort(task, context);
    factors.push(this.createFactor('effort', effortScore, task, context));

    const contextFitScore = this.calculateContextFit(task, context);
    factors.push(this.createFactor('contextFit', contextFitScore, task, context));

    const dependencyScore = this.calculateDependency(task, allTasks);
    factors.push(this.createFactor('dependency', dependencyScore, task, context));

    const momentumScore = this.calculateMomentum(task, context);
    factors.push(this.createFactor('momentum', momentumScore, task, context));

    // Calculate weighted total
    const totalScore = factors.reduce(
      (sum, f) => sum + f.normalizedValue * f.weight,
      0
    );

    // Generate recommendation
    const recommendation = this.generateRecommendation(task, factors, totalScore, context);

    return {
      taskId: task.id,
      totalScore: Math.round(totalScore * 100) / 100,
      urgencyScore,
      importanceScore,
      effortScore,
      contextFitScore,
      dependencyScore,
      momentumScore,
      factors,
      recommendation,
    };
  }

  /**
   * Score and rank all tasks
   */
  rankTasks(tasks: Task[], context: UserContext): PriorityScore[] {
    const scores = tasks
      .filter(t => t.status !== 'done' && t.status !== 'archived')
      .map(task => this.scoreTask(task, context, tasks));

    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Get the top N tasks to focus on right now
   */
  getTopPriorities(tasks: Task[], context: UserContext, count: number = 3): PriorityScore[] {
    const ranked = this.rankTasks(tasks, context);
    return ranked.slice(0, count);
  }

  /**
   * Get tasks that fit the current context and available time
   */
  getContextualTasks(
    tasks: Task[],
    context: UserContext,
    maxTasks: number = 5
  ): PriorityScore[] {
    const ranked = this.rankTasks(tasks, context);

    // Filter by available time
    const fittingTasks = ranked.filter(score => {
      const task = tasks.find(t => t.id === score.taskId);
      if (!task) return false;

      // Task must fit in available time (with some buffer)
      const estimatedTime = task.estimatedMinutes ?? 30;
      return estimatedTime <= context.availableMinutes * 1.2;
    });

    // Boost tasks that match current context
    const boosted = fittingTasks.map(score => {
      const task = tasks.find(t => t.id === score.taskId)!;
      let boost = 0;

      // Boost for matching active project
      if (context.activeProject && task.projectId === context.activeProject) {
        boost += 10;
      }

      // Boost for matching recent tags
      const matchingTags = task.tags.filter(t => context.recentTags.includes(t));
      boost += matchingTags.length * 3;

      return {
        ...score,
        totalScore: score.totalScore + boost,
      };
    });

    return boosted
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, maxTasks);
  }

  // ==========================================================================
  // SCORING COMPONENTS
  // ==========================================================================

  /**
   * Calculate urgency based on due date and decay function
   */
  private calculateUrgency(task: Task, now: Date): number {
    // No due date = low urgency (base priority only)
    if (!task.dueAt) {
      return PRIORITY_BASE_SCORES[task.priority] * 0.3;
    }

    const daysUntilDue = Math.max(0, 
      (task.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Overdue tasks get maximum urgency
    if (daysUntilDue <= 0) {
      return 100;
    }

    // Calculate urgency with exponential decay
    const decayFactor = this.config.urgencyDecayDays;
    const urgencyFromDueDate = 100 * Math.exp(-daysUntilDue / decayFactor);

    // Combine with base priority
    const basePriority = PRIORITY_BASE_SCORES[task.priority];
    return Math.min(100, urgencyFromDueDate + basePriority * 0.3);
  }

  /**
   * Calculate importance based on task metadata and relationships
   */
  private calculateImportance(task: Task): number {
    let importance = PRIORITY_BASE_SCORES[task.priority];

    // Boost for blocking other tasks
    importance += task.blocks.length * 10;

    // Boost for AI importance score if available
    if (task.aiImportanceScore !== undefined) {
      importance = (importance + task.aiImportanceScore) / 2;
    }

    // Boost for recurring tasks (maintaining habits is important)
    if (task.recurrenceRule) {
      importance += 10;
    }

    return Math.min(100, importance);
  }

  /**
   * Calculate effort score (inverse - quick wins score higher)
   */
  private calculateEffort(task: Task, context: UserContext): number {
    const estimatedMinutes = task.estimatedMinutes ?? 30;

    // Match energy requirements
    let energyMatch = 50;
    if (task.energyRequired === context.currentEnergyLevel) {
      energyMatch = 80;
    } else if (
      (task.energyRequired === 'low' && context.currentEnergyLevel !== 'low') ||
      (task.energyRequired === 'high' && context.currentEnergyLevel === 'high')
    ) {
      energyMatch = 70;
    } else if (
      task.energyRequired === 'high' && context.currentEnergyLevel === 'low'
    ) {
      energyMatch = 20;
    }

    // Quick tasks get a boost (2-minute rule)
    let quickWinBonus = 0;
    if (estimatedMinutes <= 5) {
      quickWinBonus = 30;
    } else if (estimatedMinutes <= 15) {
      quickWinBonus = 15;
    }

    // Penalize tasks that need focus time when none is available
    let focusPenalty = 0;
    if (task.focusTimeMinutes && task.focusTimeMinutes > context.availableMinutes) {
      focusPenalty = 30;
    }

    return Math.max(0, Math.min(100, energyMatch + quickWinBonus - focusPenalty));
  }

  /**
   * Calculate how well the task fits the current context
   */
  private calculateContextFit(task: Task, context: UserContext): number {
    let fit = 50; // Base score

    // Check time of day appropriateness
    const hour = context.currentTime.getHours();
    const isWorkHours = this.isWithinTimeRange(hour, context.workHours);
    const isFocusHours = context.focusHours.some(range => 
      this.isWithinTimeRange(hour, range)
    );

    // Work tasks during work hours
    if (task.context.includes('work')) {
      fit += isWorkHours ? 20 : -20;
    }

    // Personal tasks outside work hours
    if (task.context.includes('personal')) {
      fit += !isWorkHours ? 20 : -10;
    }

    // Deep work during focus hours
    if (task.focusTimeMinutes && task.focusTimeMinutes > 30) {
      fit += isFocusHours ? 25 : -15;
    }

    // Check against upcoming events
    const nextEvent = context.upcomingEvents.find(e => e.isBlocking);
    if (nextEvent) {
      const minutesUntilEvent = 
        (nextEvent.startAt.getTime() - context.currentTime.getTime()) / (1000 * 60);
      
      // Don't start deep work if there's a meeting soon
      if (task.focusTimeMinutes && task.focusTimeMinutes > minutesUntilEvent) {
        fit -= 30;
      }
    }

    // Match productivity patterns
    const hourProductivity = context.productivityByHour[hour] ?? 50;
    if (task.energyRequired === 'high' && hourProductivity > 70) {
      fit += 15;
    } else if (task.energyRequired === 'low' && hourProductivity < 40) {
      fit += 10;
    }

    return Math.max(0, Math.min(100, fit));
  }

  /**
   * Calculate dependency score - tasks blocking others should be prioritized
   */
  private calculateDependency(task: Task, allTasks: Task[]): number {
    let score = 50;

    // Boost for each task this blocks
    score += task.blocks.length * 15;

    // Check if blocked tasks are urgent
    for (const blockedId of task.blocks) {
      const blockedTask = allTasks.find(t => t.id === blockedId);
      if (blockedTask?.dueAt) {
        const daysUntilDue = 
          (blockedTask.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilDue < 3) {
          score += 20; // Urgent dependency
        }
      }
    }

    // Penalty if blocked by incomplete tasks
    const blockedByIncomplete = task.blockedBy.filter(id => {
      const blocker = allTasks.find(t => t.id === id);
      return blocker && blocker.status !== 'done';
    });
    
    if (blockedByIncomplete.length > 0) {
      score -= 40; // Can't work on it anyway
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate momentum score - continuation of recent work
   */
  private calculateMomentum(task: Task, context: UserContext): number {
    let momentum = 50;

    // Boost for matching active project
    if (context.activeProject && task.projectId === context.activeProject) {
      momentum += 25;
    }

    // Boost for recently touched tags
    const recentTagMatches = task.tags.filter(t => 
      context.recentTags.includes(t)
    ).length;
    momentum += recentTagMatches * 10;

    // Boost for in-progress tasks
    if (task.status === 'in_progress') {
      momentum += 20;
    }

    // Boost for tasks started today
    if (task.startedAt) {
      const startedToday = 
        task.startedAt.toDateString() === context.currentTime.toDateString();
      if (startedToday) {
        momentum += 15;
      }
    }

    return Math.min(100, momentum);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private createFactor(
    name: string,
    rawValue: number,
    task: Task,
    context: UserContext
  ): PriorityFactor {
    const weight = this.config.weights[name as keyof typeof this.config.weights];
    const normalizedValue = rawValue / 100;

    return {
      name,
      weight,
      rawValue,
      normalizedValue,
      explanation: this.explainFactor(name, rawValue, task, context),
    };
  }

  private explainFactor(
    name: string,
    value: number,
    task: Task,
    context: UserContext
  ): string {
    switch (name) {
      case 'urgency':
        if (value >= 90) return 'Due very soon or overdue';
        if (value >= 70) return 'Due within a few days';
        if (value >= 50) return 'Due date approaching';
        return task.dueAt ? 'Plenty of time remaining' : 'No due date set';

      case 'importance':
        if (value >= 80) return `${task.priority} priority, blocks ${task.blocks.length} tasks`;
        if (value >= 60) return `${task.priority} priority task`;
        return 'Lower importance task';

      case 'effort':
        if (value >= 80) return 'Quick win that matches current energy';
        if (value >= 60) return 'Manageable effort level';
        if (value >= 40) return 'Moderate effort required';
        return 'High effort, may not fit current energy';

      case 'contextFit':
        if (value >= 80) return 'Perfect fit for current context';
        if (value >= 60) return 'Good fit for now';
        if (value >= 40) return 'Acceptable timing';
        return 'Not ideal for current context';

      case 'dependency':
        if (task.blockedBy.length > 0) return `Blocked by ${task.blockedBy.length} tasks`;
        if (task.blocks.length > 0) return `Blocking ${task.blocks.length} other tasks`;
        return 'No dependencies';

      case 'momentum':
        if (value >= 80) return 'Continues recent work flow';
        if (value >= 60) return 'Related to recent activity';
        return 'Fresh context switch needed';

      default:
        return '';
    }
  }

  private generateRecommendation(
    task: Task,
    factors: PriorityFactor[],
    totalScore: number,
    context: UserContext
  ): string {
    // Find the dominant factor
    const sortedFactors = [...factors].sort(
      (a, b) => b.normalizedValue * b.weight - a.normalizedValue * a.weight
    );
    const topFactor = sortedFactors[0];
    const bottomFactor = sortedFactors[sortedFactors.length - 1];

    if (totalScore >= 80) {
      return `High priority - ${topFactor.explanation.toLowerCase()}. Do this now.`;
    }

    if (totalScore >= 60) {
      return `Good candidate - ${topFactor.explanation.toLowerCase()}. Consider tackling soon.`;
    }

    if (totalScore >= 40) {
      if (bottomFactor.normalizedValue < 0.3) {
        return `Moderate priority but ${bottomFactor.name} is concerning. ${bottomFactor.explanation}`;
      }
      return `Moderate priority. Can be scheduled for later.`;
    }

    return `Lower priority for now. ${bottomFactor.explanation}`;
  }

  private isWithinTimeRange(hour: number, range: { start: string; end: string }): boolean {
    const [startHour] = range.start.split(':').map(Number);
    const [endHour] = range.end.split(':').map(Number);
    return hour >= startHour && hour < endHour;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick priority calculation with default settings
 */
export function calculatePriority(task: Task, context: UserContext, allTasks: Task[]): number {
  const engine = new PrioritizationEngine();
  return engine.scoreTask(task, context, allTasks).totalScore;
}

/**
 * Get a quick recommendation for what to work on next
 */
export function getNextTask(tasks: Task[], context: UserContext): Task | null {
  const engine = new PrioritizationEngine();
  const top = engine.getTopPriorities(tasks, context, 1);
  
  if (top.length === 0) return null;
  return tasks.find(t => t.id === top[0].taskId) ?? null;
}

/**
 * Sort tasks by priority
 */
export function sortByPriority(tasks: Task[], context: UserContext): Task[] {
  const engine = new PrioritizationEngine();
  const scores = engine.rankTasks(tasks, context);
  const scoreMap = new Map(scores.map(s => [s.taskId, s.totalScore]));
  
  return [...tasks].sort((a, b) => {
    const scoreA = scoreMap.get(a.id) ?? 0;
    const scoreB = scoreMap.get(b.id) ?? 0;
    return scoreB - scoreA;
  });
}

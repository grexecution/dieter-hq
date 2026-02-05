/**
 * Machine Learning Task Optimization Engine
 * 
 * Analyzes task patterns, detects inefficiencies, and provides
 * data-driven recommendations for workflow optimization.
 */

import {
  Task,
  UserContext,
  OptimizationResult,
  TaskOptimization,
  OptimizationType,
  DetectedPattern,
  PatternType,
  Insight,
  CompletionRecord,
  MLFeatures,
  ModelMetrics,
} from '../types';

// ============================================================================
// OPTIMIZATION THRESHOLDS
// ============================================================================

const THRESHOLDS = {
  // Pattern detection thresholds
  procrastinationDays: 7,          // Days without progress before flagging
  overcommitmentRatio: 1.5,        // Tasks vs capacity ratio
  contextSwitchesPerHour: 3,       // Max context switches before flagging
  estimationBiasThreshold: 0.3,    // 30% estimation error threshold
  
  // Optimization thresholds
  batchingMinTasks: 3,             // Minimum tasks to suggest batching
  batchingSimilarityThreshold: 0.7,
  splitThresholdMinutes: 120,      // Split tasks longer than 2 hours
  mergeThresholdMinutes: 10,       // Merge tasks shorter than 10 minutes
  
  // Insight thresholds
  minDataPointsForInsight: 5,      // Minimum data points for insights
  confidenceThreshold: 0.6,        // Minimum confidence for recommendations
};

// ============================================================================
// OPTIMIZATION ENGINE
// ============================================================================

export class OptimizationEngine {
  private completionHistory: Map<string, CompletionRecord[]>;
  private contextSwitches: Array<{ timestamp: Date; fromContext: string; toContext: string }>;
  private dailyMetrics: Map<string, DailyMetrics>;

  constructor() {
    this.completionHistory = new Map();
    this.contextSwitches = [];
    this.dailyMetrics = new Map();
  }

  /**
   * Run full optimization analysis
   */
  analyze(tasks: Task[], context: UserContext): OptimizationResult {
    const patterns = this.detectPatterns(tasks, context);
    const recommendations = this.generateRecommendations(tasks, context, patterns);
    const insights = this.generateInsights(tasks, context);

    // Calculate overall score (higher = more room for optimization)
    const overallScore = this.calculateOverallScore(patterns, recommendations);

    return {
      recommendations,
      patterns,
      insights,
      overallScore,
    };
  }

  /**
   * Track task completion for learning
   */
  recordCompletion(
    task: Task,
    actualMinutes: number,
    completedAt: Date,
    contextBeforeCompletion?: string
  ): void {
    // Store completion
    const history = this.completionHistory.get(task.id) ?? [];
    history.push({
      completedAt,
      actualMinutes,
      energyAfter: task.energyRequired,
    });
    this.completionHistory.set(task.id, history);

    // Update daily metrics
    const dateKey = completedAt.toISOString().split('T')[0];
    const dailyMetric = this.dailyMetrics.get(dateKey) ?? {
      tasksCompleted: 0,
      totalMinutes: 0,
      contextSwitches: 0,
      estimationErrors: [],
    };
    
    dailyMetric.tasksCompleted++;
    dailyMetric.totalMinutes += actualMinutes;
    
    if (task.estimatedMinutes) {
      const error = (actualMinutes - task.estimatedMinutes) / task.estimatedMinutes;
      dailyMetric.estimationErrors.push(error);
    }
    
    this.dailyMetrics.set(dateKey, dailyMetric);
  }

  /**
   * Track context switches for pattern detection
   */
  recordContextSwitch(fromContext: string, toContext: string): void {
    if (fromContext !== toContext) {
      this.contextSwitches.push({
        timestamp: new Date(),
        fromContext,
        toContext,
      });
    }
  }

  // ==========================================================================
  // PATTERN DETECTION
  // ==========================================================================

  private detectPatterns(tasks: Task[], context: UserContext): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Detect procrastination
    const procrastinationPattern = this.detectProcrastination(tasks);
    if (procrastinationPattern) patterns.push(procrastinationPattern);

    // Detect overcommitment
    const overcommitmentPattern = this.detectOvercommitment(tasks, context);
    if (overcommitmentPattern) patterns.push(overcommitmentPattern);

    // Detect energy mismatches
    const energyPattern = this.detectEnergyMismatch(tasks, context);
    if (energyPattern) patterns.push(energyPattern);

    // Detect context switching
    const contextSwitchPattern = this.detectContextSwitching();
    if (contextSwitchPattern) patterns.push(contextSwitchPattern);

    // Detect estimation bias
    const estimationPattern = this.detectEstimationBias(tasks);
    if (estimationPattern) patterns.push(estimationPattern);

    // Detect peak productivity windows
    const productivityPattern = this.detectPeakProductivity(context);
    if (productivityPattern) patterns.push(productivityPattern);

    // Detect recurring delays
    const delayPattern = this.detectRecurringDelays(tasks);
    if (delayPattern) patterns.push(delayPattern);

    return patterns;
  }

  private detectProcrastination(tasks: Task[]): DetectedPattern | null {
    const now = new Date();
    const staleTasks = tasks.filter(task => {
      if (task.status === 'done' || task.status === 'archived') return false;
      const age = (now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return age > THRESHOLDS.procrastinationDays && !task.startedAt;
    });

    if (staleTasks.length >= 3) {
      return {
        type: 'procrastination',
        description: `${staleTasks.length} tasks haven't been started in over a week`,
        frequency: staleTasks.length,
        impact: 'negative',
        tasks: staleTasks.map(t => t.id),
        suggestion: 'Consider reviewing these tasks. Some may need to be broken down or delegated.',
      };
    }

    return null;
  }

  private detectOvercommitment(tasks: Task[], context: UserContext): DetectedPattern | null {
    const activeTasks = tasks.filter(t => 
      t.status === 'todo' || t.status === 'in_progress'
    );

    // Estimate total hours needed
    const totalMinutesNeeded = activeTasks.reduce(
      (sum, t) => sum + (t.estimatedMinutes ?? 30),
      0
    );

    // Estimate available hours (assuming 6 productive hours per day)
    const availableMinutesPerDay = 6 * 60;
    const daysNeeded = totalMinutesNeeded / availableMinutesPerDay;

    // Check if any tasks have due dates that make this impossible
    const impossibleTasks = activeTasks.filter(task => {
      if (!task.dueAt) return false;
      const daysUntilDue = (task.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilDue < daysNeeded * 0.5; // Less than half the time needed
    });

    if (impossibleTasks.length > 0 || daysNeeded > 10) {
      return {
        type: 'overcommitment',
        description: `Workload requires ~${Math.ceil(daysNeeded)} days, but deadlines are tighter`,
        frequency: impossibleTasks.length,
        impact: 'negative',
        tasks: impossibleTasks.map(t => t.id),
        suggestion: 'Consider renegotiating deadlines, delegating tasks, or removing lower-priority items.',
      };
    }

    return null;
  }

  private detectEnergyMismatch(tasks: Task[], context: UserContext): DetectedPattern | null {
    // Find high-energy tasks scheduled during low-energy times
    const mismatched = tasks.filter(task => {
      if (task.status === 'done' || task.status === 'archived') return false;
      if (!task.scheduledAt) return false;

      const hour = task.scheduledAt.getHours();
      const productivity = context.productivityByHour[hour] ?? 50;

      return (
        (task.energyRequired === 'high' && productivity < 40) ||
        (task.energyRequired === 'low' && productivity > 70)
      );
    });

    if (mismatched.length >= 2) {
      return {
        type: 'energy_mismatch',
        description: `${mismatched.length} tasks scheduled at suboptimal times for their energy requirements`,
        frequency: mismatched.length,
        impact: 'negative',
        tasks: mismatched.map(t => t.id),
        suggestion: 'Try to match high-energy tasks with your peak productivity hours.',
      };
    }

    return null;
  }

  private detectContextSwitching(): DetectedPattern | null {
    const recentSwitches = this.contextSwitches.filter(
      s => Date.now() - s.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    if (recentSwitches.length > THRESHOLDS.contextSwitchesPerHour) {
      // Group by context
      const contexts = new Set(recentSwitches.flatMap(s => [s.fromContext, s.toContext]));
      
      return {
        type: 'context_switching',
        description: `${recentSwitches.length} context switches in the last hour across ${contexts.size} different contexts`,
        frequency: recentSwitches.length,
        impact: 'negative',
        tasks: [],
        suggestion: 'Try batching similar tasks together to reduce context switching overhead.',
      };
    }

    return null;
  }

  private detectEstimationBias(tasks: Task[]): DetectedPattern | null {
    // Analyze completed tasks with estimates
    const completed = tasks.filter(
      t => t.status === 'done' && t.estimatedMinutes && t.actualMinutes
    );

    if (completed.length < THRESHOLDS.minDataPointsForInsight) return null;

    // Calculate estimation errors
    const errors = completed.map(t => 
      (t.actualMinutes! - t.estimatedMinutes!) / t.estimatedMinutes!
    );
    const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
    const underestimated = errors.filter(e => e > THRESHOLDS.estimationBiasThreshold).length;
    const overestimated = errors.filter(e => e < -THRESHOLDS.estimationBiasThreshold).length;

    if (Math.abs(avgError) > THRESHOLDS.estimationBiasThreshold) {
      return {
        type: 'estimation_bias',
        description: avgError > 0 
          ? `Tasks consistently take ${Math.round(avgError * 100)}% longer than estimated`
          : `Tasks consistently take ${Math.round(-avgError * 100)}% less time than estimated`,
        frequency: Math.max(underestimated, overestimated),
        impact: 'neutral',
        tasks: completed.map(t => t.id),
        suggestion: avgError > 0
          ? 'Consider adding a buffer to your estimates or breaking tasks into smaller pieces.'
          : 'You might be able to take on more tasks - your estimates are conservative.',
      };
    }

    return null;
  }

  private detectPeakProductivity(context: UserContext): DetectedPattern | null {
    const peakHours = Object.entries(context.productivityByHour)
      .filter(([_, score]) => score > 70)
      .map(([hour]) => parseInt(hour));

    if (peakHours.length >= 2) {
      const peakRange = `${Math.min(...peakHours)}:00 - ${Math.max(...peakHours) + 1}:00`;
      
      return {
        type: 'peak_productivity',
        description: `Your peak productivity window is ${peakRange}`,
        frequency: peakHours.length,
        impact: 'positive',
        tasks: [],
        suggestion: 'Protect this time for deep work and your most important tasks.',
      };
    }

    return null;
  }

  private detectRecurringDelays(tasks: Task[]): DetectedPattern | null {
    // Find tasks with recurring rules that are often completed late
    const recurringTasks = tasks.filter(t => t.recurrenceRule);
    const lateRecurring = recurringTasks.filter(t => {
      const history = this.completionHistory.get(t.id) ?? [];
      if (history.length < 3) return false;

      // Check if typically completed after due date
      // This is simplified - in practice would need to track due dates
      return history.every(h => h.actualMinutes > (t.estimatedMinutes ?? 30) * 1.5);
    });

    if (lateRecurring.length >= 2) {
      return {
        type: 'recurring_delay',
        description: `${lateRecurring.length} recurring tasks are consistently delayed`,
        frequency: lateRecurring.length,
        impact: 'negative',
        tasks: lateRecurring.map(t => t.id),
        suggestion: 'Consider adjusting the schedule for these recurring tasks or automating them.',
      };
    }

    return null;
  }

  // ==========================================================================
  // RECOMMENDATION GENERATION
  // ==========================================================================

  private generateRecommendations(
    tasks: Task[],
    context: UserContext,
    patterns: DetectedPattern[]
  ): TaskOptimization[] {
    const recommendations: TaskOptimization[] = [];

    // Batching recommendations
    recommendations.push(...this.recommendBatching(tasks));

    // Time boxing recommendations
    recommendations.push(...this.recommendTimeBoxing(tasks));

    // Task splitting recommendations
    recommendations.push(...this.recommendSplitting(tasks));

    // Task merging recommendations
    recommendations.push(...this.recommendMerging(tasks));

    // Reordering recommendations based on patterns
    recommendations.push(...this.recommendReordering(tasks, patterns));

    // Automation recommendations
    recommendations.push(...this.recommendAutomation(tasks));

    // Delegation recommendations
    recommendations.push(...this.recommendDelegation(tasks));

    // Elimination recommendations
    recommendations.push(...this.recommendElimination(tasks, context));

    // Sort by expected improvement
    return recommendations
      .filter(r => r.confidence >= THRESHOLDS.confidenceThreshold)
      .sort((a, b) => b.expectedImprovement - a.expectedImprovement);
  }

  private recommendBatching(tasks: Task[]): TaskOptimization[] {
    const recommendations: TaskOptimization[] = [];
    const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'archived');

    // Group by context
    const contextGroups = this.groupBy(activeTasks, t => t.context.join(','));
    
    for (const [contextKey, group] of Object.entries(contextGroups)) {
      if (group.length >= THRESHOLDS.batchingMinTasks) {
        recommendations.push({
          taskId: group[0].id,
          type: 'batching',
          suggestion: `Batch these ${group.length} ${contextKey || 'similar'} tasks together`,
          expectedImprovement: 15 + group.length * 3,
          confidence: 0.8,
          implementation: `Process ${group.map(t => `"${t.title}"`).slice(0, 3).join(', ')}${group.length > 3 ? ` and ${group.length - 3} more` : ''} in a single session`,
        });
      }
    }

    // Group by tags
    const tagGroups = new Map<string, Task[]>();
    for (const task of activeTasks) {
      for (const tag of task.tags) {
        const existing = tagGroups.get(tag) ?? [];
        existing.push(task);
        tagGroups.set(tag, existing);
      }
    }

    for (const [tag, group] of Array.from(tagGroups.entries())) {
      if (group.length >= THRESHOLDS.batchingMinTasks) {
        recommendations.push({
          taskId: group[0].id,
          type: 'batching',
          suggestion: `Batch ${group.length} tasks tagged #${tag}`,
          expectedImprovement: 10 + group.length * 2,
          confidence: 0.75,
          implementation: `Schedule a dedicated session for all #${tag} tasks`,
        });
      }
    }

    return recommendations;
  }

  private recommendTimeBoxing(tasks: Task[]): TaskOptimization[] {
    const recommendations: TaskOptimization[] = [];

    // Find tasks without estimates or with vague estimates
    const vagueTask = tasks.filter(t => 
      t.status !== 'done' && 
      t.status !== 'archived' && 
      (!t.estimatedMinutes || t.estimatedMinutes > THRESHOLDS.splitThresholdMinutes)
    );

    for (const task of vagueTask.slice(0, 5)) { // Limit recommendations
      recommendations.push({
        taskId: task.id,
        type: 'time_boxing',
        suggestion: `Set a strict time limit for "${task.title}"`,
        expectedImprovement: 20,
        confidence: 0.7,
        implementation: task.estimatedMinutes 
          ? `Break into ${Math.ceil(task.estimatedMinutes / 45)}-minute focused sessions with breaks`
          : 'Set a 45-minute time box to prevent scope creep',
      });
    }

    return recommendations;
  }

  private recommendSplitting(tasks: Task[]): TaskOptimization[] {
    const recommendations: TaskOptimization[] = [];

    const largeTasks = tasks.filter(t =>
      t.status !== 'done' &&
      t.status !== 'archived' &&
      t.estimatedMinutes &&
      t.estimatedMinutes >= THRESHOLDS.splitThresholdMinutes
    );

    for (const task of largeTasks) {
      const subTaskCount = Math.ceil(task.estimatedMinutes! / 45);
      recommendations.push({
        taskId: task.id,
        type: 'splitting',
        suggestion: `Break "${task.title}" into ${subTaskCount} smaller tasks`,
        expectedImprovement: 25,
        confidence: 0.85,
        implementation: `Create ${subTaskCount} subtasks of ~45 minutes each with clear deliverables`,
      });
    }

    return recommendations;
  }

  private recommendMerging(tasks: Task[]): TaskOptimization[] {
    const recommendations: TaskOptimization[] = [];

    const tinyTasks = tasks.filter(t =>
      t.status !== 'done' &&
      t.status !== 'archived' &&
      t.estimatedMinutes &&
      t.estimatedMinutes <= THRESHOLDS.mergeThresholdMinutes
    );

    // Group tiny tasks by context or project
    if (tinyTasks.length >= 3) {
      const contextGroups = this.groupBy(tinyTasks, t => t.projectId ?? t.context.join(','));
      
      for (const [_, group] of Object.entries(contextGroups)) {
        if (group.length >= 3) {
          const totalMinutes = group.reduce((sum, t) => sum + (t.estimatedMinutes ?? 5), 0);
          recommendations.push({
            taskId: group[0].id,
            type: 'merging',
            suggestion: `Combine ${group.length} quick tasks into one ${totalMinutes}-minute batch`,
            expectedImprovement: 15,
            confidence: 0.7,
            implementation: `Create a single "Quick tasks" item: ${group.map(t => t.title).slice(0, 3).join(', ')}`,
          });
        }
      }
    }

    return recommendations;
  }

  private recommendReordering(tasks: Task[], patterns: DetectedPattern[]): TaskOptimization[] {
    const recommendations: TaskOptimization[] = [];

    // Check for procrastination pattern
    const procrastination = patterns.find(p => p.type === 'procrastination');
    if (procrastination && procrastination.tasks.length > 0) {
      const staleTask = tasks.find(t => t.id === procrastination.tasks[0]);
      if (staleTask) {
        recommendations.push({
          taskId: staleTask.id,
          type: 'reordering',
          suggestion: `Move "${staleTask.title}" to the top of your list`,
          expectedImprovement: 30,
          confidence: 0.75,
          implementation: 'Start with just 5 minutes on this task to break the procrastination cycle',
        });
      }
    }

    // Check for energy mismatch pattern
    const energyMismatch = patterns.find(p => p.type === 'energy_mismatch');
    if (energyMismatch) {
      recommendations.push({
        taskId: energyMismatch.tasks[0] ?? tasks[0].id,
        type: 'reordering',
        suggestion: 'Reschedule tasks to match energy levels',
        expectedImprovement: 20,
        confidence: 0.8,
        implementation: 'Move high-energy tasks to morning, routine tasks to afternoon',
      });
    }

    return recommendations;
  }

  private recommendAutomation(tasks: Task[]): TaskOptimization[] {
    const recommendations: TaskOptimization[] = [];

    // Find recurring tasks that might be automatable
    const recurring = tasks.filter(t => 
      t.recurrenceRule && 
      t.status !== 'done' &&
      t.status !== 'archived'
    );

    // Look for patterns suggesting automation potential
    const automatable = recurring.filter(t => {
      const title = t.title.toLowerCase();
      return (
        title.includes('report') ||
        title.includes('backup') ||
        title.includes('sync') ||
        title.includes('update') ||
        title.includes('check') ||
        title.includes('review')
      );
    });

    for (const task of automatable.slice(0, 3)) {
      recommendations.push({
        taskId: task.id,
        type: 'automation',
        suggestion: `Automate "${task.title}"`,
        expectedImprovement: 40,
        confidence: 0.6,
        implementation: 'Consider setting up a script, integration, or scheduled job to handle this automatically',
      });
    }

    return recommendations;
  }

  private recommendDelegation(tasks: Task[]): TaskOptimization[] {
    const recommendations: TaskOptimization[] = [];

    // Find tasks that might be delegatable
    const delegatable = tasks.filter(t => {
      if (t.status === 'done' || t.status === 'archived') return false;
      
      const title = t.title.toLowerCase();
      const isDelegatable = 
        t.energyRequired === 'low' ||
        title.includes('coordinate') ||
        title.includes('organize') ||
        title.includes('schedule') ||
        title.includes('book') ||
        title.includes('arrange');
      
      return isDelegatable && (t.estimatedMinutes ?? 30) > 30;
    });

    for (const task of delegatable.slice(0, 2)) {
      recommendations.push({
        taskId: task.id,
        type: 'delegation',
        suggestion: `Consider delegating "${task.title}"`,
        expectedImprovement: 35,
        confidence: 0.5, // Lower confidence as this depends on resources
        implementation: 'This task might be suitable for delegation to free up your time for higher-impact work',
      });
    }

    return recommendations;
  }

  private recommendElimination(tasks: Task[], context: UserContext): TaskOptimization[] {
    const recommendations: TaskOptimization[] = [];

    // Find tasks that might be eliminable
    const eliminable = tasks.filter(t => {
      if (t.status === 'done' || t.status === 'archived') return false;
      
      // Old tasks with no due date and low priority
      const age = (Date.now() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return (
        age > 30 &&
        !t.dueAt &&
        (t.priority === 'someday' || t.priority === 'low') &&
        t.blocks.length === 0
      );
    });

    for (const task of eliminable.slice(0, 3)) {
      recommendations.push({
        taskId: task.id,
        type: 'elimination',
        suggestion: `Consider removing "${task.title}"`,
        expectedImprovement: 5,
        confidence: 0.65,
        implementation: 'This task has been on your list for over a month with no progress. Is it still relevant?',
      });
    }

    return recommendations;
  }

  // ==========================================================================
  // INSIGHT GENERATION
  // ==========================================================================

  private generateInsights(tasks: Task[], context: UserContext): Insight[] {
    const insights: Insight[] = [];

    // Productivity insights
    insights.push(...this.generateProductivityInsights(tasks, context));

    // Time management insights
    insights.push(...this.generateTimeInsights(tasks));

    // Workload insights
    insights.push(...this.generateWorkloadInsights(tasks));

    // Habit insights
    insights.push(...this.generateHabitInsights(tasks));

    return insights.filter(i => i.confidence >= THRESHOLDS.confidenceThreshold);
  }

  private generateProductivityInsights(tasks: Task[], context: UserContext): Insight[] {
    const insights: Insight[] = [];

    // Best day of week
    const dayScores = Object.entries(context.productivityByDay);
    if (dayScores.length >= 5) {
      const bestDay = dayScores.reduce((a, b) => a[1] > b[1] ? a : b);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      insights.push({
        category: 'productivity',
        title: 'Best Day',
        description: `Your most productive day is ${days[parseInt(bestDay[0])]} with a productivity score of ${bestDay[1]}`,
        actionable: true,
        suggestedAction: `Schedule your most important tasks for ${days[parseInt(bestDay[0])]}`,
        dataPoints: dayScores.length,
        confidence: 0.8,
      });
    }

    // Completion rate trend
    const completedTasks = tasks.filter(t => t.status === 'done');
    if (completedTasks.length >= 10) {
      const recent = completedTasks.filter(t => 
        t.completedAt && Date.now() - t.completedAt.getTime() < 7 * 24 * 60 * 60 * 1000
      );
      const older = completedTasks.filter(t =>
        t.completedAt && Date.now() - t.completedAt.getTime() >= 7 * 24 * 60 * 60 * 1000
      );

      if (recent.length > older.length / 4) {
        insights.push({
          category: 'productivity',
          title: 'Momentum Building',
          description: 'Your task completion rate has increased this week!',
          actionable: false,
          dataPoints: completedTasks.length,
          confidence: 0.75,
        });
      }
    }

    return insights;
  }

  private generateTimeInsights(tasks: Task[]): Insight[] {
    const insights: Insight[] = [];

    // Average estimation accuracy
    const withEstimates = tasks.filter(t => 
      t.status === 'done' && t.estimatedMinutes && t.actualMinutes
    );

    if (withEstimates.length >= THRESHOLDS.minDataPointsForInsight) {
      const avgRatio = withEstimates.reduce(
        (sum, t) => sum + (t.actualMinutes! / t.estimatedMinutes!),
        0
      ) / withEstimates.length;

      insights.push({
        category: 'time_management',
        title: 'Estimation Accuracy',
        description: avgRatio > 1.2
          ? `Tasks typically take ${Math.round((avgRatio - 1) * 100)}% longer than estimated`
          : avgRatio < 0.8
          ? `You consistently overestimate - tasks take ${Math.round((1 - avgRatio) * 100)}% less time`
          : 'Your time estimates are fairly accurate',
        actionable: avgRatio > 1.2,
        suggestedAction: avgRatio > 1.2
          ? 'Try multiplying your estimates by 1.5 for better accuracy'
          : undefined,
        dataPoints: withEstimates.length,
        confidence: Math.min(0.9, 0.5 + withEstimates.length * 0.05),
      });
    }

    return insights;
  }

  private generateWorkloadInsights(tasks: Task[]): Insight[] {
    const insights: Insight[] = [];

    // Task distribution by context
    const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'archived');
    const contextCounts = new Map<string, number>();
    
    for (const task of activeTasks) {
      for (const ctx of task.context) {
        contextCounts.set(ctx, (contextCounts.get(ctx) ?? 0) + 1);
      }
    }

    if (contextCounts.size >= 2) {
      const total = activeTasks.length;
      const dominant = [...contextCounts.entries()].sort((a, b) => b[1] - a[1])[0];
      
      if (dominant && dominant[1] / total > 0.6) {
        insights.push({
          category: 'workload',
          title: 'Workload Imbalance',
          description: `${Math.round(dominant[1] / total * 100)}% of your tasks are in the "${dominant[0]}" context`,
          actionable: true,
          suggestedAction: 'Consider if other life areas need attention',
          dataPoints: activeTasks.length,
          confidence: 0.7,
        });
      }
    }

    return insights;
  }

  private generateHabitInsights(tasks: Task[]): Insight[] {
    const insights: Insight[] = [];

    // Recurring task completion patterns
    const recurring = tasks.filter(t => t.recurrenceRule);
    const completedRecurring = recurring.filter(t => t.status === 'done');

    if (recurring.length >= 3 && completedRecurring.length >= 3) {
      const completionRate = completedRecurring.length / recurring.length;
      
      insights.push({
        category: 'habits',
        title: 'Habit Tracking',
        description: completionRate > 0.7
          ? `Great job! You're completing ${Math.round(completionRate * 100)}% of your recurring tasks`
          : `Only ${Math.round(completionRate * 100)}% of recurring tasks are being completed`,
        actionable: completionRate <= 0.7,
        suggestedAction: completionRate <= 0.7
          ? 'Consider reducing the frequency of some recurring tasks or removing those you consistently skip'
          : undefined,
        dataPoints: recurring.length,
        confidence: 0.75,
      });
    }

    return insights;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  private calculateOverallScore(patterns: DetectedPattern[], recommendations: TaskOptimization[]): number {
    let score = 50; // Base score

    // Negative patterns increase the score (more room for improvement)
    const negativePatterns = patterns.filter(p => p.impact === 'negative');
    score += negativePatterns.length * 10;

    // High-impact recommendations increase the score
    const highImpactRecs = recommendations.filter(r => r.expectedImprovement > 25);
    score += highImpactRecs.length * 5;

    // Positive patterns decrease the score (less room for improvement)
    const positivePatterns = patterns.filter(p => p.impact === 'positive');
    score -= positivePatterns.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  private groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface DailyMetrics {
  tasksCompleted: number;
  totalMinutes: number;
  contextSwitches: number;
  estimationErrors: number[];
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a new optimization engine
 */
export function createOptimizer(): OptimizationEngine {
  return new OptimizationEngine();
}

/**
 * Quick analysis of tasks
 */
export function analyzeTasksQuick(tasks: Task[], context: UserContext): OptimizationResult {
  const engine = new OptimizationEngine();
  return engine.analyze(tasks, context);
}

/**
 * Get top recommendations
 */
export function getTopRecommendations(
  tasks: Task[],
  context: UserContext,
  count: number = 5
): TaskOptimization[] {
  const engine = new OptimizationEngine();
  const result = engine.analyze(tasks, context);
  return result.recommendations.slice(0, count);
}

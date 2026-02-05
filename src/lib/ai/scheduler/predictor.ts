/**
 * Predictive Scheduling Algorithms
 * 
 * Uses historical patterns, machine learning features, and contextual
 * awareness to predict optimal task scheduling and completion times.
 */

import {
  Task,
  UserContext,
  ScheduleSlot,
  ScheduleRecommendation,
  DailySchedule,
  SchedulePrediction,
  CalendarEvent,
  TimeRange,
  MLFeatures,
  MLPrediction,
  CompletionRecord,
} from '../types';

// ============================================================================
// SCHEDULING CONSTANTS
// ============================================================================

const DEFAULT_SLOT_DURATION = 30; // minutes
const BUFFER_BETWEEN_TASKS = 5; // minutes
const MIN_FOCUS_BLOCK = 45; // minutes
const MAX_CONTINUOUS_WORK = 90; // minutes before suggesting break

// ============================================================================
// PREDICTIVE SCHEDULER
// ============================================================================

export class PredictiveScheduler {
  private completionHistory: Map<string, CompletionRecord[]>;
  private taskTypePatterns: Map<string, TaskPattern>;

  constructor() {
    this.completionHistory = new Map();
    this.taskTypePatterns = new Map();
  }

  /**
   * Learn from task completion data
   */
  learnFromCompletion(task: Task, actualMinutes: number, completedAt: Date): void {
    // Store completion record
    const history = this.completionHistory.get(task.id) ?? [];
    history.push({
      completedAt,
      actualMinutes,
      energyAfter: task.energyRequired,
    });
    this.completionHistory.set(task.id, history);

    // Update patterns for similar tasks
    const patternKey = this.getTaskPatternKey(task);
    const pattern = this.taskTypePatterns.get(patternKey) ?? {
      samples: [],
      averageDuration: 0,
      standardDeviation: 0,
      completionRate: 0,
    };

    pattern.samples.push({
      estimated: task.estimatedMinutes ?? 30,
      actual: actualMinutes,
      dayOfWeek: completedAt.getDay(),
      hourOfDay: completedAt.getHours(),
    });

    // Recalculate statistics
    const durations = pattern.samples.map(s => s.actual);
    pattern.averageDuration = this.mean(durations);
    pattern.standardDeviation = this.standardDeviation(durations);
    pattern.completionRate = pattern.samples.filter(
      s => s.actual <= s.estimated * 1.2
    ).length / pattern.samples.length;

    this.taskTypePatterns.set(patternKey, pattern);
  }

  /**
   * Predict how long a task will take
   */
  predictDuration(task: Task, context: UserContext): MLPrediction {
    const features = this.extractFeatures(task, context);
    const patternKey = this.getTaskPatternKey(task);
    const pattern = this.taskTypePatterns.get(patternKey);

    // Base prediction
    let predictedMinutes = task.estimatedMinutes ?? 30;
    let confidence = 0.5;
    const explanation: string[] = [];

    // Adjust based on historical patterns
    if (pattern && pattern.samples.length >= 3) {
      // Use weighted average favoring recent samples
      const recentSamples = pattern.samples.slice(-10);
      const weights = recentSamples.map((_, i) => Math.pow(0.9, recentSamples.length - i - 1));
      const weightedSum = recentSamples.reduce((sum, s, i) => sum + s.actual * weights[i], 0);
      const weightSum = weights.reduce((a, b) => a + b, 0);
      
      predictedMinutes = weightedSum / weightSum;
      confidence = Math.min(0.9, 0.5 + pattern.samples.length * 0.05);
      explanation.push(`Based on ${pattern.samples.length} similar task completions`);
    }

    // Adjust for time of day
    const hourProductivity = context.productivityByHour[context.currentTime.getHours()] ?? 50;
    if (hourProductivity < 40) {
      predictedMinutes *= 1.2;
      explanation.push('Adjusted for lower productivity time');
    } else if (hourProductivity > 70) {
      predictedMinutes *= 0.9;
      explanation.push('Adjusted for peak productivity time');
    }

    // Adjust for energy level mismatch
    if (task.energyRequired === 'high' && context.currentEnergyLevel === 'low') {
      predictedMinutes *= 1.3;
      explanation.push('Energy level mismatch may slow progress');
    }

    // Adjust for context switching
    if (features.recentTaskCount > 5) {
      predictedMinutes *= 1.1;
      explanation.push('Many recent tasks may cause fatigue');
    }

    return {
      value: Math.round(predictedMinutes),
      confidence,
      features: this.getTopFeatures(features),
      explanation: explanation.join('. '),
    };
  }

  /**
   * Find optimal time slots for a task
   */
  findOptimalSlots(
    task: Task,
    context: UserContext,
    daysAhead: number = 7
  ): ScheduleRecommendation {
    const prediction = this.predictDuration(task, context);
    const slots: ScheduleSlot[] = [];
    const reasoning: string[] = [];

    // Get available time blocks
    const availableBlocks = this.getAvailableBlocks(context, daysAhead);

    // Score each block
    const scoredBlocks = availableBlocks.map(block => ({
      block,
      score: this.scoreSlotForTask(task, block, context),
    }));

    // Sort by score
    scoredBlocks.sort((a, b) => b.score - a.score);

    // Get best slot
    const bestBlock = scoredBlocks[0];
    if (!bestBlock) {
      return {
        task,
        suggestedSlot: {
          startAt: new Date(),
          endAt: new Date(Date.now() + prediction.value * 60 * 1000),
          type: 'task',
          taskId: task.id,
        },
        score: 0,
        reasoning: ['No available time slots found'],
        alternatives: [],
      };
    }

    const suggestedSlot: ScheduleSlot = {
      startAt: bestBlock.block.startAt,
      endAt: new Date(bestBlock.block.startAt.getTime() + prediction.value * 60 * 1000),
      type: 'task',
      taskId: task.id,
      score: bestBlock.score,
    };

    // Explain the recommendation
    reasoning.push(this.explainSlotChoice(task, suggestedSlot, context));

    // Get alternatives
    const alternatives = scoredBlocks.slice(1, 4).map(sb => ({
      startAt: sb.block.startAt,
      endAt: new Date(sb.block.startAt.getTime() + prediction.value * 60 * 1000),
      type: 'task' as const,
      taskId: task.id,
      score: sb.score,
    }));

    return {
      task,
      suggestedSlot,
      score: bestBlock.score,
      reasoning,
      alternatives,
    };
  }

  /**
   * Generate a full daily schedule
   */
  generateDailySchedule(
    tasks: Task[],
    context: UserContext,
    targetDate: Date
  ): DailySchedule {
    const slots: ScheduleSlot[] = [];
    const scheduledTasks = new Set<string>();
    const overflowTasks: Task[] = [];

    // Get available time for the day
    const dayStart = this.getWorkDayStart(targetDate, context);
    const dayEnd = this.getWorkDayEnd(targetDate, context);

    // Block out calendar events
    const blockedSlots = context.upcomingEvents
      .filter(e => this.isSameDay(e.startAt, targetDate))
      .map(e => ({
        startAt: e.startAt,
        endAt: e.endAt,
        type: 'blocked' as const,
      }));
    slots.push(...blockedSlots);

    // Sort tasks by priority (using simple heuristic)
    const sortedTasks = [...tasks].sort((a, b) => {
      const urgencyA = a.dueAt ? (a.dueAt.getTime() - Date.now()) : Infinity;
      const urgencyB = b.dueAt ? (b.dueAt.getTime() - Date.now()) : Infinity;
      return urgencyA - urgencyB;
    });

    // Schedule tasks
    let currentTime = dayStart;
    let continuousWorkMinutes = 0;

    for (const task of sortedTasks) {
      if (scheduledTasks.has(task.id)) continue;
      if (task.status === 'done' || task.status === 'archived') continue;

      const prediction = this.predictDuration(task, context);
      const duration = prediction.value;

      // Find next available slot
      const slot = this.findNextAvailableSlot(
        currentTime,
        duration,
        dayEnd,
        slots
      );

      if (!slot) {
        overflowTasks.push(task);
        continue;
      }

      // Check if we need a break
      if (continuousWorkMinutes >= MAX_CONTINUOUS_WORK) {
        const breakSlot: ScheduleSlot = {
          startAt: new Date(slot.getTime()),
          endAt: new Date(slot.getTime() + 15 * 60 * 1000),
          type: 'break',
        };
        slots.push(breakSlot);
        currentTime = breakSlot.endAt;
        continuousWorkMinutes = 0;

        // Recalculate slot after break
        const newSlot = this.findNextAvailableSlot(
          currentTime,
          duration,
          dayEnd,
          slots
        );
        if (!newSlot) {
          overflowTasks.push(task);
          continue;
        }
      }

      // Schedule the task
      const taskSlot: ScheduleSlot = {
        startAt: slot,
        endAt: new Date(slot.getTime() + duration * 60 * 1000),
        type: 'task',
        taskId: task.id,
        score: this.scoreSlotForTask(task, { startAt: slot, endAt: new Date(slot.getTime() + duration * 60 * 1000), type: 'task' }, context),
      };
      slots.push(taskSlot);
      scheduledTasks.add(task.id);

      // Add buffer
      const bufferSlot: ScheduleSlot = {
        startAt: taskSlot.endAt,
        endAt: new Date(taskSlot.endAt.getTime() + BUFFER_BETWEEN_TASKS * 60 * 1000),
        type: 'buffer',
      };
      slots.push(bufferSlot);

      currentTime = bufferSlot.endAt;
      continuousWorkMinutes += duration + BUFFER_BETWEEN_TASKS;
    }

    // Sort slots chronologically
    slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    // Calculate totals
    const totalProductiveMinutes = slots
      .filter(s => s.type === 'task')
      .reduce((sum, s) => sum + (s.endAt.getTime() - s.startAt.getTime()) / (60 * 1000), 0);

    const totalBreakMinutes = slots
      .filter(s => s.type === 'break')
      .reduce((sum, s) => sum + (s.endAt.getTime() - s.startAt.getTime()) / (60 * 1000), 0);

    const unscheduledTasks = tasks.filter(
      t => !scheduledTasks.has(t.id) && 
           !overflowTasks.includes(t) &&
           t.status !== 'done' && 
           t.status !== 'archived'
    );

    return {
      date: targetDate,
      slots,
      totalProductiveMinutes: Math.round(totalProductiveMinutes),
      totalBreakMinutes: Math.round(totalBreakMinutes),
      unscheduledTasks,
      overflowTasks,
    };
  }

  /**
   * Predict completion probability for a scheduled task
   */
  predictCompletion(task: Task, slot: ScheduleSlot, context: UserContext): SchedulePrediction {
    const duration = this.predictDuration(task, context);
    const slotDuration = (slot.endAt.getTime() - slot.startAt.getTime()) / (60 * 1000);

    // Base probability
    let probability = 0.7;
    const riskFactors: string[] = [];

    // Adjust for time fit
    if (duration.value > slotDuration) {
      probability -= (duration.value - slotDuration) / duration.value * 0.3;
      riskFactors.push('Task may exceed allocated time');
    }

    // Adjust for time of day
    const hour = slot.startAt.getHours();
    const productivity = context.productivityByHour[hour] ?? 50;
    if (productivity < 40) {
      probability -= 0.15;
      riskFactors.push('Scheduled during low-productivity hours');
    } else if (productivity > 70) {
      probability += 0.1;
    }

    // Adjust for energy match
    if (task.energyRequired === 'high' && context.currentEnergyLevel === 'low') {
      probability -= 0.2;
      riskFactors.push('Energy level mismatch');
    }

    // Adjust for confidence in prediction
    probability *= duration.confidence;

    // Find optimal alternative times
    const optimalSlots = this.findPeakProductivitySlots(context, slot.startAt);

    return {
      completionProbability: Math.max(0.1, Math.min(0.95, probability)),
      predictedDuration: duration.value,
      optimalTimeSlots: optimalSlots,
      riskFactors,
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private extractFeatures(task: Task, context: UserContext): MLFeatures {
    const now = context.currentTime;
    const completionHistory = this.completionHistory.get(task.id) ?? [];
    const patternKey = this.getTaskPatternKey(task);
    const pattern = this.taskTypePatterns.get(patternKey);

    return {
      taskAge: task.createdAt ? 
        (now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24) : 0,
      estimatedDuration: task.estimatedMinutes ?? 30,
      actualDurationHistory: completionHistory.map(c => c.actualMinutes),
      completionRateForSimilar: pattern?.completionRate ?? 0.7,
      hourOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      daysUntilDue: task.dueAt ? 
        (task.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : 365,
      energyLevel: this.energyToNumber(context.currentEnergyLevel),
      recentTaskCount: context.recentTags.length, // Proxy for recent activity
      similarTasksCompleted: pattern?.samples.length ?? 0,
      averageDelayForType: pattern ? 
        this.mean(pattern.samples.map(s => s.actual - s.estimated)) : 0,
      userProductivityScore: this.mean(Object.values(context.productivityByHour)),
    };
  }

  private getTaskPatternKey(task: Task): string {
    // Create a key based on task characteristics for pattern matching
    const contextKey = task.context.sort().join('_') || 'general';
    const energyKey = task.energyRequired;
    const durationBucket = task.estimatedMinutes ? 
      Math.floor(task.estimatedMinutes / 30) * 30 : 30;
    
    return `${contextKey}:${energyKey}:${durationBucket}`;
  }

  private getAvailableBlocks(context: UserContext, daysAhead: number): ScheduleSlot[] {
    const blocks: ScheduleSlot[] = [];
    const now = context.currentTime;

    for (let day = 0; day < daysAhead; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);

      const dayStart = this.getWorkDayStart(date, context);
      const dayEnd = this.getWorkDayEnd(date, context);

      // Get blocked times for this day
      const blockedEvents = context.upcomingEvents.filter(e => 
        this.isSameDay(e.startAt, date) && e.isBlocking
      );

      // Create available blocks around blocked events
      let currentStart = dayStart;
      
      for (const event of blockedEvents.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())) {
        if (event.startAt > currentStart) {
          blocks.push({
            startAt: currentStart,
            endAt: event.startAt,
            type: 'task',
          });
        }
        currentStart = event.endAt;
      }

      // Add remaining time after last event
      if (currentStart < dayEnd) {
        blocks.push({
          startAt: currentStart,
          endAt: dayEnd,
          type: 'task',
        });
      }
    }

    return blocks;
  }

  private scoreSlotForTask(task: Task, slot: ScheduleSlot, context: UserContext): number {
    let score = 50;
    const hour = slot.startAt.getHours();

    // Productivity match
    const productivity = context.productivityByHour[hour] ?? 50;
    score += (productivity - 50) * 0.3;

    // Energy match for time of day
    if (task.energyRequired === 'high') {
      // High energy tasks: morning is usually better
      if (hour >= 9 && hour <= 11) score += 15;
      else if (hour >= 14 && hour <= 16) score += 5;
    } else if (task.energyRequired === 'low') {
      // Low energy tasks: afternoon is fine
      if (hour >= 14 && hour <= 17) score += 10;
    }

    // Work context during work hours
    if (task.context.includes('work')) {
      const isWorkHours = this.isWithinTimeRange(hour, context.workHours);
      score += isWorkHours ? 15 : -10;
    }

    // Personal context outside work hours
    if (task.context.includes('personal')) {
      const isWorkHours = this.isWithinTimeRange(hour, context.workHours);
      score += !isWorkHours ? 15 : -5;
    }

    // Focus time match
    if (task.focusTimeMinutes && task.focusTimeMinutes > 30) {
      const isFocusTime = context.focusHours.some(range => 
        this.isWithinTimeRange(hour, range)
      );
      score += isFocusTime ? 20 : -10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private explainSlotChoice(task: Task, slot: ScheduleSlot, context: UserContext): string {
    const hour = slot.startAt.getHours();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot.startAt.getDay()];
    const productivity = context.productivityByHour[hour] ?? 50;

    const reasons: string[] = [];

    if (productivity > 70) {
      reasons.push('high productivity period');
    }

    if (task.energyRequired === 'high' && hour >= 9 && hour <= 11) {
      reasons.push('morning energy alignment');
    }

    if (task.focusTimeMinutes) {
      const isFocusTime = context.focusHours.some(range => 
        this.isWithinTimeRange(hour, range)
      );
      if (isFocusTime) reasons.push('focus time block');
    }

    const timeStr = slot.startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const baseReason = reasons.length > 0 ? reasons.join(', ') : 'available slot';

    return `${dayName} at ${timeStr}: ${baseReason}`;
  }

  private findNextAvailableSlot(
    from: Date,
    durationMinutes: number,
    dayEnd: Date,
    existingSlots: ScheduleSlot[]
  ): Date | null {
    let candidate = new Date(from);

    while (candidate.getTime() + durationMinutes * 60 * 1000 <= dayEnd.getTime()) {
      const candidateEnd = new Date(candidate.getTime() + durationMinutes * 60 * 1000);

      // Check for conflicts
      const hasConflict = existingSlots.some(slot => 
        this.slotsOverlap(
          { startAt: candidate, endAt: candidateEnd, type: 'task' },
          slot
        )
      );

      if (!hasConflict) {
        return candidate;
      }

      // Move to end of conflicting slot
      const conflictingSlot = existingSlots.find(slot =>
        this.slotsOverlap({ startAt: candidate, endAt: candidateEnd, type: 'task' }, slot)
      );
      
      if (conflictingSlot) {
        candidate = new Date(conflictingSlot.endAt.getTime() + BUFFER_BETWEEN_TASKS * 60 * 1000);
      } else {
        candidate = new Date(candidate.getTime() + DEFAULT_SLOT_DURATION * 60 * 1000);
      }
    }

    return null;
  }

  private findPeakProductivitySlots(context: UserContext, targetDate: Date): TimeRange[] {
    const slots: TimeRange[] = [];
    
    // Find hours with productivity > 70
    const peakHours = Object.entries(context.productivityByHour)
      .filter(([_, productivity]) => productivity > 70)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => a - b);

    // Group consecutive hours
    let currentGroup: number[] = [];
    for (const hour of peakHours) {
      if (currentGroup.length === 0 || hour === currentGroup[currentGroup.length - 1] + 1) {
        currentGroup.push(hour);
      } else {
        if (currentGroup.length > 0) {
          slots.push({
            start: `${String(currentGroup[0]).padStart(2, '0')}:00`,
            end: `${String(currentGroup[currentGroup.length - 1] + 1).padStart(2, '0')}:00`,
          });
        }
        currentGroup = [hour];
      }
    }

    if (currentGroup.length > 0) {
      slots.push({
        start: `${String(currentGroup[0]).padStart(2, '0')}:00`,
        end: `${String(currentGroup[currentGroup.length - 1] + 1).padStart(2, '0')}:00`,
      });
    }

    return slots;
  }

  private slotsOverlap(a: ScheduleSlot, b: ScheduleSlot): boolean {
    return a.startAt < b.endAt && a.endAt > b.startAt;
  }

  private getWorkDayStart(date: Date, context: UserContext): Date {
    const [hours, minutes] = context.workHours.start.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private getWorkDayEnd(date: Date, context: UserContext): Date {
    const [hours, minutes] = context.workHours.end.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
  }

  private isWithinTimeRange(hour: number, range: TimeRange): boolean {
    const [startHour] = range.start.split(':').map(Number);
    const [endHour] = range.end.split(':').map(Number);
    return hour >= startHour && hour < endHour;
  }

  private energyToNumber(energy: 'high' | 'medium' | 'low'): number {
    switch (energy) {
      case 'high': return 1;
      case 'medium': return 0.5;
      case 'low': return 0;
    }
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  private getTopFeatures(features: MLFeatures): string[] {
    const featureImportance: [string, number][] = [
      ['hourOfDay', features.hourOfDay > 9 && features.hourOfDay < 11 ? 1 : 0.5],
      ['energyLevel', features.energyLevel],
      ['taskAge', features.taskAge > 7 ? 1 : 0.3],
      ['daysUntilDue', features.daysUntilDue < 3 ? 1 : 0.2],
      ['completionRate', features.completionRateForSimilar],
    ];

    return featureImportance
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface TaskPattern {
  samples: Array<{
    estimated: number;
    actual: number;
    dayOfWeek: number;
    hourOfDay: number;
  }>;
  averageDuration: number;
  standardDeviation: number;
  completionRate: number;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a new scheduler instance
 */
export function createScheduler(): PredictiveScheduler {
  return new PredictiveScheduler();
}

/**
 * Quick schedule generation
 */
export function generateSchedule(
  tasks: Task[],
  context: UserContext,
  date: Date = new Date()
): DailySchedule {
  const scheduler = new PredictiveScheduler();
  return scheduler.generateDailySchedule(tasks, context, date);
}

/**
 * Get optimal time for a single task
 */
export function findBestTimeForTask(
  task: Task,
  context: UserContext
): ScheduleRecommendation {
  const scheduler = new PredictiveScheduler();
  return scheduler.findOptimalSlots(task, context);
}

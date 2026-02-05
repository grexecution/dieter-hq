/**
 * Background Task Tracking Mechanism
 * 
 * Tracks and manages background tasks across contexts:
 * - Subagent executions
 * - Tool operations
 * - Scheduled tasks
 * - Monitoring operations
 */

import {
  BackgroundTaskState,
  TrackedTask,
  TaskListener,
  TaskEvent,
  TaskHistoryEntry,
  TaskType,
  TaskStatus,
  TaskUpdate,
} from './types';

// ============================================================================
// TASK TRACKER
// ============================================================================

export class BackgroundTaskTracker {
  private state: BackgroundTaskState;
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 1000) {
    this.maxHistorySize = maxHistorySize;
    this.state = {
      tasks: new Map(),
      listeners: new Map(),
      history: [],
    };
  }

  // ==========================================================================
  // TASK LIFECYCLE
  // ==========================================================================

  /**
   * Create and start tracking a new task
   */
  createTask(params: CreateTaskParams): TrackedTask {
    const id = params.id || this.generateId();
    const now = new Date();

    const task: TrackedTask = {
      id,
      contextId: params.contextId,
      type: params.type,
      description: params.description,
      status: 'queued',
      progress: 0,
      startedAt: now,
      lastUpdate: now,
      updates: [{
        timestamp: now,
        message: 'Task created',
        progress: 0,
        type: 'info',
      }],
      metadata: params.metadata || {},
    };

    if (params.estimatedDurationMs) {
      task.estimatedCompletion = new Date(now.getTime() + params.estimatedDurationMs);
    }

    this.state.tasks.set(id, task);
    this.emit(task, { type: 'started', task, timestamp: now });

    return task;
  }

  /**
   * Start a queued task
   */
  startTask(taskId: string): TrackedTask | null {
    const task = this.state.tasks.get(taskId);
    if (!task || task.status !== 'queued') return null;

    task.status = 'running';
    task.startedAt = new Date();
    task.lastUpdate = task.startedAt;

    this.addUpdate(task, 'Task started', 0, 'info');
    this.emit(task, { type: 'started', task, timestamp: task.startedAt });

    return task;
  }

  /**
   * Update task progress
   */
  updateProgress(
    taskId: string,
    progress: number,
    message?: string
  ): TrackedTask | null {
    const task = this.state.tasks.get(taskId);
    if (!task) return null;

    const normalizedProgress = Math.max(0, Math.min(100, progress));
    task.progress = normalizedProgress;
    task.lastUpdate = new Date();

    if (message) {
      this.addUpdate(task, message, normalizedProgress, 'info');
    }

    this.emit(task, { type: 'progress', task, timestamp: task.lastUpdate });

    return task;
  }

  /**
   * Add a status update to a task
   */
  addTaskUpdate(
    taskId: string,
    message: string,
    type: TaskUpdate['type'] = 'info'
  ): TrackedTask | null {
    const task = this.state.tasks.get(taskId);
    if (!task) return null;

    this.addUpdate(task, message, task.progress, type);
    return task;
  }

  /**
   * Complete a task successfully
   */
  completeTask(taskId: string, result?: unknown): TrackedTask | null {
    const task = this.state.tasks.get(taskId);
    if (!task) return null;

    const now = new Date();
    task.status = 'completed';
    task.progress = 100;
    task.lastUpdate = now;

    this.addUpdate(task, 'Task completed successfully', 100, 'success');

    // Move to history
    this.addToHistory(task, result);

    this.emit(task, { type: 'completed', task, timestamp: now, data: result });

    return task;
  }

  /**
   * Mark a task as failed
   */
  failTask(taskId: string, error: string): TrackedTask | null {
    const task = this.state.tasks.get(taskId);
    if (!task) return null;

    const now = new Date();
    task.status = 'failed';
    task.lastUpdate = now;

    this.addUpdate(task, `Task failed: ${error}`, task.progress, 'error');

    // Move to history
    this.addToHistory(task, undefined, error);

    this.emit(task, { type: 'failed', task, timestamp: now, data: error });

    return task;
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string, reason?: string): TrackedTask | null {
    const task = this.state.tasks.get(taskId);
    if (!task) return null;

    if (task.status === 'completed' || task.status === 'failed') {
      return null; // Cannot cancel finished tasks
    }

    const now = new Date();
    task.status = 'cancelled';
    task.lastUpdate = now;

    const message = reason ? `Task cancelled: ${reason}` : 'Task cancelled';
    this.addUpdate(task, message, task.progress, 'warning');

    // Move to history
    this.addToHistory(task);

    this.emit(task, { type: 'cancelled', task, timestamp: now });

    return task;
  }

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  /**
   * Get a task by ID
   */
  getTask(taskId: string): TrackedTask | null {
    return this.state.tasks.get(taskId) || null;
  }

  /**
   * Get all active tasks
   */
  getActiveTasks(): TrackedTask[] {
    return Array.from(this.state.tasks.values()).filter(
      t => t.status === 'running' || t.status === 'queued'
    );
  }

  /**
   * Get all tasks for a context
   */
  getTasksForContext(contextId: string): TrackedTask[] {
    return Array.from(this.state.tasks.values()).filter(
      t => t.contextId === contextId
    );
  }

  /**
   * Get tasks by type
   */
  getTasksByType(type: TaskType): TrackedTask[] {
    return Array.from(this.state.tasks.values()).filter(t => t.type === type);
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): TrackedTask[] {
    return Array.from(this.state.tasks.values()).filter(t => t.status === status);
  }

  /**
   * Get running tasks count
   */
  getRunningCount(): number {
    return this.getTasksByStatus('running').length;
  }

  /**
   * Get task history
   */
  getHistory(limit?: number): TaskHistoryEntry[] {
    const history = this.state.history;
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get history for a context
   */
  getHistoryForContext(contextId: string, limit?: number): TaskHistoryEntry[] {
    const filtered = this.state.history.filter(h => h.contextId === contextId);
    return limit ? filtered.slice(-limit) : filtered;
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Get task statistics
   */
  getStatistics(): TaskStatistics {
    const tasks = Array.from(this.state.tasks.values());
    const history = this.state.history;

    // Current status counts
    const byStatus: Record<TaskStatus, number> = {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const task of tasks) {
      byStatus[task.status]++;
    }

    // Type distribution
    const byType: Record<string, number> = {};
    for (const task of tasks) {
      byType[task.type] = (byType[task.type] || 0) + 1;
    }

    // Success rate from history
    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;

    for (const entry of history) {
      if (entry.status === 'completed') {
        successCount++;
        totalDuration += entry.durationMs;
      } else if (entry.status === 'failed') {
        failureCount++;
      }
    }

    const successRate = successCount + failureCount > 0
      ? successCount / (successCount + failureCount)
      : 1;

    const avgDuration = successCount > 0 ? totalDuration / successCount : 0;

    return {
      active: byStatus.queued + byStatus.running,
      queued: byStatus.queued,
      running: byStatus.running,
      completed: byStatus.completed,
      failed: byStatus.failed,
      cancelled: byStatus.cancelled,
      total: tasks.length,
      historySize: history.length,
      successRate,
      averageDurationMs: avgDuration,
      byType,
    };
  }

  /**
   * Get estimated completion for all running tasks
   */
  getEstimatedCompletion(): Date | null {
    const running = this.getTasksByStatus('running');
    if (running.length === 0) return null;

    let maxTime = 0;
    for (const task of running) {
      if (task.estimatedCompletion) {
        maxTime = Math.max(maxTime, task.estimatedCompletion.getTime());
      }
    }

    return maxTime > 0 ? new Date(maxTime) : null;
  }

  // ==========================================================================
  // LISTENERS
  // ==========================================================================

  /**
   * Add a listener for task events
   */
  addListener(
    taskId: string | '*',
    callback: (task: TrackedTask, event: TaskEvent) => void
  ): string {
    const listenerId = this.generateId();
    const listeners = this.state.listeners.get(taskId) || [];
    listeners.push({ id: listenerId, callback });
    this.state.listeners.set(taskId, listeners);
    return listenerId;
  }

  /**
   * Remove a listener
   */
  removeListener(listenerId: string): boolean {
    for (const [key, listeners] of this.state.listeners) {
      const index = listeners.findIndex(l => l.id === listenerId);
      if (index !== -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.state.listeners.delete(key);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all listeners for a task
   */
  clearListeners(taskId: string): void {
    this.state.listeners.delete(taskId);
  }

  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================

  /**
   * Cancel all tasks for a context
   */
  cancelContextTasks(contextId: string, reason?: string): number {
    let cancelled = 0;
    for (const task of this.state.tasks.values()) {
      if (task.contextId === contextId && 
          (task.status === 'running' || task.status === 'queued')) {
        this.cancelTask(task.id, reason);
        cancelled++;
      }
    }
    return cancelled;
  }

  /**
   * Clean up old tasks
   */
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, task] of this.state.tasks) {
      const age = now - task.lastUpdate.getTime();
      if (age > maxAgeMs && task.status !== 'running') {
        this.state.tasks.delete(id);
        this.state.listeners.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Prune history to max size
   */
  pruneHistory(): number {
    if (this.state.history.length <= this.maxHistorySize) {
      return 0;
    }

    const toRemove = this.state.history.length - this.maxHistorySize;
    this.state.history.splice(0, toRemove);
    return toRemove;
  }

  // ==========================================================================
  // SERIALIZATION
  // ==========================================================================

  /**
   * Export state for persistence
   */
  exportState(): ExportedTaskState {
    const tasks: TrackedTask[] = [];
    for (const task of this.state.tasks.values()) {
      tasks.push(task);
    }

    return {
      tasks,
      history: this.state.history,
      exportedAt: new Date(),
    };
  }

  /**
   * Import state from persistence
   */
  importState(exported: ExportedTaskState): void {
    this.state.tasks.clear();
    for (const task of exported.tasks) {
      // Restore Date objects
      task.startedAt = new Date(task.startedAt);
      task.lastUpdate = new Date(task.lastUpdate);
      if (task.estimatedCompletion) {
        task.estimatedCompletion = new Date(task.estimatedCompletion);
      }
      for (const update of task.updates) {
        update.timestamp = new Date(update.timestamp);
      }
      this.state.tasks.set(task.id, task);
    }

    this.state.history = exported.history.map(entry => ({
      ...entry,
      startedAt: new Date(entry.startedAt),
      completedAt: new Date(entry.completedAt),
    }));
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addUpdate(
    task: TrackedTask,
    message: string,
    progress: number,
    type: TaskUpdate['type']
  ): void {
    task.updates.push({
      timestamp: new Date(),
      message,
      progress,
      type,
    });

    // Keep updates limited
    if (task.updates.length > 50) {
      task.updates = task.updates.slice(-50);
    }
  }

  private addToHistory(task: TrackedTask, result?: unknown, error?: string): void {
    const entry: TaskHistoryEntry = {
      taskId: task.id,
      contextId: task.contextId,
      type: task.type,
      description: task.description,
      startedAt: task.startedAt,
      completedAt: task.lastUpdate,
      status: task.status === 'completed' ? 'completed' 
            : task.status === 'failed' ? 'failed' 
            : 'cancelled',
      durationMs: task.lastUpdate.getTime() - task.startedAt.getTime(),
      result,
      error,
    };

    this.state.history.push(entry);

    // Remove from active tasks after a delay
    setTimeout(() => {
      this.state.tasks.delete(task.id);
    }, 5000);

    // Prune history if needed
    this.pruneHistory();
  }

  private emit(task: TrackedTask, event: TaskEvent): void {
    // Notify task-specific listeners
    const taskListeners = this.state.listeners.get(task.id) || [];
    for (const listener of taskListeners) {
      try {
        listener.callback(task, event);
      } catch (e) {
        console.error('Task listener error:', e);
      }
    }

    // Notify global listeners
    const globalListeners = this.state.listeners.get('*') || [];
    for (const listener of globalListeners) {
      try {
        listener.callback(task, event);
      } catch (e) {
        console.error('Global task listener error:', e);
      }
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTaskParams {
  id?: string;
  contextId: string;
  type: TaskType;
  description: string;
  estimatedDurationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface TaskStatistics {
  active: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
  historySize: number;
  successRate: number;
  averageDurationMs: number;
  byType: Record<string, number>;
}

export interface ExportedTaskState {
  tasks: TrackedTask[];
  history: TaskHistoryEntry[];
  exportedAt: Date;
}

// ============================================================================
// SINGLETON & CONVENIENCE
// ============================================================================

let trackerInstance: BackgroundTaskTracker | null = null;

export function getTaskTracker(): BackgroundTaskTracker {
  if (!trackerInstance) {
    trackerInstance = new BackgroundTaskTracker();
  }
  return trackerInstance;
}

export function trackTask(params: CreateTaskParams): TrackedTask {
  return getTaskTracker().createTask(params);
}

export function updateTaskProgress(taskId: string, progress: number, message?: string): void {
  getTaskTracker().updateProgress(taskId, progress, message);
}

export function completeTrackedTask(taskId: string, result?: unknown): void {
  getTaskTracker().completeTask(taskId, result);
}

export function failTrackedTask(taskId: string, error: string): void {
  getTaskTracker().failTask(taskId, error);
}

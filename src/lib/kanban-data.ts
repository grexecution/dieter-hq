/**
 * Kanban Data Models & Demo Data
 * Provides types, state management, and demo content for the Life Kanban board
 */

// ============================================
// Types & Interfaces
// ============================================

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "inbox" | "today" | "next" | "waiting" | "someday" | "done";

export type LifeArea = 
  | "work" 
  | "personal" 
  | "health" 
  | "finance" 
  | "learning" 
  | "relationships" 
  | "home";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  area: LifeArea;
  dueDate?: number; // timestamp
  estimatedMinutes?: number;
  tags: string[];
  subtasks: Subtask[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  order: number; // for ordering within a column
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  description: string;
  icon: string;
  color: string;
  limit?: number; // WIP limit
}

// ============================================
// Constants
// ============================================

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-green-600 dark:text-green-400" },
  { value: "medium", label: "Medium", color: "text-blue-600 dark:text-blue-400" },
  { value: "high", label: "High", color: "text-orange-600 dark:text-orange-400" },
  { value: "urgent", label: "Urgent", color: "text-red-600 dark:text-red-400" },
];

export const LIFE_AREAS: { value: LifeArea; label: string; emoji: string; color: string }[] = [
  { value: "work", label: "Work", emoji: "💼", color: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  { value: "personal", label: "Personal", emoji: "🌟", color: "bg-purple-500/20 text-purple-700 dark:text-purple-300" },
  { value: "health", label: "Health", emoji: "🏃", color: "bg-green-500/20 text-green-700 dark:text-green-300" },
  { value: "finance", label: "Finance", emoji: "💰", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" },
  { value: "learning", label: "Learning", emoji: "📚", color: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" },
  { value: "relationships", label: "Relationships", emoji: "❤️", color: "bg-pink-500/20 text-pink-700 dark:text-pink-300" },
  { value: "home", label: "Home", emoji: "🏠", color: "bg-orange-500/20 text-orange-700 dark:text-orange-300" },
];

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "inbox",
    title: "Inbox",
    description: "Capture everything here",
    icon: "📥",
    color: "border-t-slate-400",
  },
  {
    id: "today",
    title: "Today",
    description: "Focus on these",
    icon: "🎯",
    color: "border-t-blue-500",
    limit: 5,
  },
  {
    id: "next",
    title: "Next",
    description: "Coming up soon",
    icon: "📋",
    color: "border-t-purple-500",
    limit: 10,
  },
  {
    id: "waiting",
    title: "Waiting",
    description: "Blocked or delegated",
    icon: "⏳",
    color: "border-t-yellow-500",
  },
  {
    id: "someday",
    title: "Someday",
    description: "Maybe later",
    icon: "🌙",
    color: "border-t-slate-500",
  },
  {
    id: "done",
    title: "Done",
    description: "Completed tasks",
    icon: "✅",
    color: "border-t-green-500",
  },
];

// ============================================
// Demo Data Generator
// ============================================

function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateSubtaskId(): string {
  return `subtask_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const DEMO_TASKS: Task[] = [
  // Inbox tasks
  {
    id: generateId(),
    title: "Review weekly goals",
    description: "Take 10 minutes to review and adjust weekly priorities",
    status: "inbox",
    priority: "medium",
    area: "personal",
    tags: ["planning", "weekly"],
    subtasks: [],
    createdAt: now - 2 * day,
    updatedAt: now - 2 * day,
    order: 0,
  },
  {
    id: generateId(),
    title: "Book dentist appointment",
    status: "inbox",
    priority: "low",
    area: "health",
    tags: ["appointment"],
    subtasks: [],
    createdAt: now - day,
    updatedAt: now - day,
    order: 1,
  },
  {
    id: generateId(),
    title: "Research new standing desk",
    description: "Look for ergonomic options under €500",
    status: "inbox",
    priority: "low",
    area: "home",
    tags: ["purchase", "ergonomics"],
    subtasks: [],
    createdAt: now - day,
    updatedAt: now - day,
    order: 2,
  },

  // Today tasks
  {
    id: generateId(),
    title: "Finish project proposal",
    description: "Complete the Q1 project proposal document",
    status: "today",
    priority: "high",
    area: "work",
    dueDate: now,
    estimatedMinutes: 120,
    tags: ["project", "deadline"],
    subtasks: [
      { id: generateSubtaskId(), title: "Draft executive summary", completed: true },
      { id: generateSubtaskId(), title: "Add budget breakdown", completed: true },
      { id: generateSubtaskId(), title: "Final review", completed: false },
    ],
    createdAt: now - 5 * day,
    updatedAt: now - day,
    order: 0,
  },
  {
    id: generateId(),
    title: "Morning workout",
    description: "30 min cardio + stretching",
    status: "today",
    priority: "medium",
    area: "health",
    estimatedMinutes: 45,
    tags: ["exercise", "routine"],
    subtasks: [],
    createdAt: now - 3 * day,
    updatedAt: now,
    order: 1,
  },
  {
    id: generateId(),
    title: "Reply to important emails",
    status: "today",
    priority: "high",
    area: "work",
    estimatedMinutes: 30,
    tags: ["communication"],
    subtasks: [],
    createdAt: now,
    updatedAt: now,
    order: 2,
  },

  // Next tasks
  {
    id: generateId(),
    title: "Plan weekend trip",
    description: "Research destinations and accommodation",
    status: "next",
    priority: "medium",
    area: "personal",
    dueDate: now + 3 * day,
    tags: ["travel", "planning"],
    subtasks: [
      { id: generateSubtaskId(), title: "Choose destination", completed: false },
      { id: generateSubtaskId(), title: "Book accommodation", completed: false },
      { id: generateSubtaskId(), title: "Create packing list", completed: false },
    ],
    createdAt: now - 2 * day,
    updatedAt: now - day,
    order: 0,
  },
  {
    id: generateId(),
    title: "Review monthly budget",
    description: "Check spending vs. planned budget",
    status: "next",
    priority: "medium",
    area: "finance",
    dueDate: now + 5 * day,
    estimatedMinutes: 45,
    tags: ["budget", "monthly"],
    subtasks: [],
    createdAt: now - 4 * day,
    updatedAt: now - 2 * day,
    order: 1,
  },
  {
    id: generateId(),
    title: "Prepare presentation slides",
    status: "next",
    priority: "high",
    area: "work",
    dueDate: now + 2 * day,
    estimatedMinutes: 90,
    tags: ["presentation", "meeting"],
    subtasks: [],
    createdAt: now - day,
    updatedAt: now - day,
    order: 2,
  },

  // Waiting tasks
  {
    id: generateId(),
    title: "Waiting for client feedback",
    description: "Follow up if no response by Friday",
    status: "waiting",
    priority: "medium",
    area: "work",
    tags: ["client", "feedback"],
    subtasks: [],
    createdAt: now - 3 * day,
    updatedAt: now - 2 * day,
    order: 0,
  },
  {
    id: generateId(),
    title: "Package delivery expected",
    description: "Tracking: XYZ123456789",
    status: "waiting",
    priority: "low",
    area: "home",
    tags: ["delivery"],
    subtasks: [],
    createdAt: now - 2 * day,
    updatedAt: now - 2 * day,
    order: 1,
  },

  // Someday tasks
  {
    id: generateId(),
    title: "Learn Spanish",
    description: "Start with Duolingo, then consider classes",
    status: "someday",
    priority: "low",
    area: "learning",
    tags: ["language", "skill"],
    subtasks: [
      { id: generateSubtaskId(), title: "Download app", completed: false },
      { id: generateSubtaskId(), title: "Complete basics", completed: false },
    ],
    createdAt: now - 10 * day,
    updatedAt: now - 5 * day,
    order: 0,
  },
  {
    id: generateId(),
    title: "Organize photo library",
    description: "Sort and backup all photos from past 2 years",
    status: "someday",
    priority: "low",
    area: "personal",
    tags: ["organization", "photos"],
    subtasks: [],
    createdAt: now - 14 * day,
    updatedAt: now - 10 * day,
    order: 1,
  },
  {
    id: generateId(),
    title: "Take a cooking class",
    status: "someday",
    priority: "low",
    area: "personal",
    tags: ["hobby", "cooking"],
    subtasks: [],
    createdAt: now - 20 * day,
    updatedAt: now - 15 * day,
    order: 2,
  },

  // Done tasks
  {
    id: generateId(),
    title: "Update resume",
    status: "done",
    priority: "medium",
    area: "work",
    tags: ["career"],
    subtasks: [],
    createdAt: now - 7 * day,
    updatedAt: now - 2 * day,
    completedAt: now - 2 * day,
    order: 0,
  },
  {
    id: generateId(),
    title: "Schedule annual checkup",
    status: "done",
    priority: "medium",
    area: "health",
    tags: ["appointment", "health"],
    subtasks: [],
    createdAt: now - 5 * day,
    updatedAt: now - 3 * day,
    completedAt: now - 3 * day,
    order: 1,
  },
];

// ============================================
// Helper Functions
// ============================================

export function getAreaInfo(area: LifeArea) {
  return LIFE_AREAS.find((a) => a.value === area) ?? LIFE_AREAS[0];
}

export function getPriorityInfo(priority: TaskPriority) {
  return TASK_PRIORITIES.find((p) => p.value === priority) ?? TASK_PRIORITIES[0];
}

export function getColumnInfo(status: TaskStatus) {
  return KANBAN_COLUMNS.find((c) => c.id === status) ?? KANBAN_COLUMNS[0];
}

export function createEmptyTask(status: TaskStatus = "inbox"): Task {
  const timestamp = Date.now();
  return {
    id: generateId(),
    title: "",
    status,
    priority: "medium",
    area: "personal",
    tags: [],
    subtasks: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    order: 0,
  };
}

export function formatDueDate(timestamp?: number): string {
  if (!timestamp) return "";
  
  const now = new Date();
  const date = new Date(timestamp);
  const diff = Math.floor((timestamp - now.getTime()) / day);
  
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < -1) return `${Math.abs(diff)} days ago`;
  if (diff < 7) return `In ${diff} days`;
  
  return date.toLocaleDateString("de-AT", { month: "short", day: "numeric" });
}

export function formatEstimate(minutes?: number): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function getCompletionPercentage(task: Task): number {
  if (task.subtasks.length === 0) return task.status === "done" ? 100 : 0;
  const completed = task.subtasks.filter((s) => s.completed).length;
  return Math.round((completed / task.subtasks.length) * 100);
}

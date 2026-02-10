/**
 * Kanban State Management Hook
 * Provides state management for the Life Kanban board
 */

"use client";

import * as React from "react";
import {
  Task,
  TaskStatus,
  TaskPriority,
  LifeArea,
  Department,
  Subtask,
  Question,
  DEMO_TASKS,
  KANBAN_COLUMNS,
  createEmptyTask,
  generateQuestionId,
} from "./kanban-data";

// ============================================
// Types
// ============================================

export interface KanbanState {
  tasks: Task[];
  selectedTaskId: string | null;
  filterArea: LifeArea | null;
  filterPriority: TaskPriority | null;
  filterDepartment: Department | null;
  searchQuery: string;
  isCreating: boolean;
  isDragging: boolean;
}

export interface KanbanActions {
  // Task CRUD
  addTask: (task: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, toStatus: TaskStatus, toIndex?: number) => void;
  
  // Subtasks
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  
  // Questions
  addQuestion: (taskId: string, question: Omit<Question, "id" | "askedAt">) => void;
  answerQuestion: (taskId: string, questionId: string, answer: string) => void;
  deleteQuestion: (taskId: string, questionId: string) => void;
  
  // Selection & UI
  selectTask: (id: string | null) => void;
  setFilterArea: (area: LifeArea | null) => void;
  setFilterPriority: (priority: TaskPriority | null) => void;
  setFilterDepartment: (department: Department | null) => void;
  setSearchQuery: (query: string) => void;
  setIsCreating: (value: boolean) => void;
  setIsDragging: (value: boolean) => void;
  
  // Quick actions
  markComplete: (id: string) => void;
  moveToToday: (id: string) => void;
  moveToInbox: (id: string) => void;
  
  // Derived data
  getTasksByStatus: (status: TaskStatus) => Task[];
  getFilteredTasks: () => Task[];
  getSelectedTask: () => Task | null;
  getTaskStats: () => TaskStats;
}

export interface TaskStats {
  total: number;
  inbox: number;
  today: number;
  completedToday: number;
  overdue: number;
}

// ============================================
// Initial State
// ============================================

const initialState: KanbanState = {
  tasks: DEMO_TASKS,
  selectedTaskId: null,
  filterArea: null,
  filterPriority: null,
  filterDepartment: null,
  searchQuery: "",
  isCreating: false,
  isDragging: false,
};

// ============================================
// Hook Implementation
// ============================================

export function useKanbanState(): [KanbanState, KanbanActions] {
  const [state, setState] = React.useState<KanbanState>(initialState);

  const actions = React.useMemo<KanbanActions>(() => {
    // Helper to generate IDs
    const generateId = () => 
      `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const generateSubtaskId = () =>
      `subtask_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    return {
      // Task CRUD
      addTask: (partial) => {
        const timestamp = Date.now();
        const maxOrder = Math.max(
          0,
          ...state.tasks
            .filter((t) => t.status === (partial.status ?? "inbox"))
            .map((t) => t.order)
        );
        
        const newTask: Task = {
          id: generateId(),
          title: partial.title,
          description: partial.description,
          status: partial.status ?? "inbox",
          priority: partial.priority ?? "medium",
          area: partial.area ?? "personal",
          department: partial.department,
          dueDate: partial.dueDate,
          estimatedMinutes: partial.estimatedMinutes,
          tags: partial.tags ?? [],
          subtasks: partial.subtasks ?? [],
          questions: partial.questions ?? [],
          createdAt: timestamp,
          updatedAt: timestamp,
          order: maxOrder + 1,
        };

        setState((prev) => ({
          ...prev,
          tasks: [...prev.tasks, newTask],
          isCreating: false,
        }));

        return newTask;
      },

      updateTask: (id, updates) => {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: Date.now() }
              : t
          ),
        }));
      },

      deleteTask: (id) => {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id),
          selectedTaskId: prev.selectedTaskId === id ? null : prev.selectedTaskId,
        }));
      },

      moveTask: (id, toStatus, toIndex) => {
        setState((prev) => {
          const task = prev.tasks.find((t) => t.id === id);
          if (!task) return prev;

          // Get tasks in target column
          const targetTasks = prev.tasks
            .filter((t) => t.status === toStatus && t.id !== id)
            .sort((a, b) => a.order - b.order);

          // Calculate new order
          let newOrder: number;
          if (toIndex === undefined || toIndex >= targetTasks.length) {
            // Add to end
            newOrder = targetTasks.length > 0 
              ? targetTasks[targetTasks.length - 1].order + 1 
              : 0;
          } else if (toIndex === 0) {
            // Add to beginning
            newOrder = targetTasks.length > 0 
              ? targetTasks[0].order - 1 
              : 0;
          } else {
            // Insert between
            newOrder = (targetTasks[toIndex - 1].order + targetTasks[toIndex].order) / 2;
          }

          const completedAt = toStatus === "done" ? Date.now() : undefined;

          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === id
                ? { ...t, status: toStatus, order: newOrder, updatedAt: Date.now(), completedAt }
                : t
            ),
          };
        });
      },

      // Subtasks
      addSubtask: (taskId, title) => {
        const newSubtask: Subtask = {
          id: generateSubtaskId(),
          title,
          completed: false,
        };

        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...t.subtasks, newSubtask], updatedAt: Date.now() }
              : t
          ),
        }));
      },

      toggleSubtask: (taskId, subtaskId) => {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                  ),
                  updatedAt: Date.now(),
                }
              : t
          ),
        }));
      },

      deleteSubtask: (taskId, subtaskId) => {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
                  updatedAt: Date.now(),
                }
              : t
          ),
        }));
      },

      // Questions
      addQuestion: (taskId, questionData) => {
        const newQuestion: Question = {
          id: generateQuestionId(),
          ...questionData,
          askedAt: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, questions: [...t.questions, newQuestion], updatedAt: Date.now() }
              : t
          ),
        }));
      },

      answerQuestion: (taskId, questionId, answer) => {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  questions: t.questions.map((q) =>
                    q.id === questionId
                      ? { ...q, answer, answeredAt: Date.now() }
                      : q
                  ),
                  updatedAt: Date.now(),
                }
              : t
          ),
        }));
      },

      deleteQuestion: (taskId, questionId) => {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  questions: t.questions.filter((q) => q.id !== questionId),
                  updatedAt: Date.now(),
                }
              : t
          ),
        }));
      },

      // Selection & UI
      selectTask: (id) => {
        setState((prev) => ({ ...prev, selectedTaskId: id }));
      },

      setFilterArea: (area) => {
        setState((prev) => ({ ...prev, filterArea: area }));
      },

      setFilterPriority: (priority) => {
        setState((prev) => ({ ...prev, filterPriority: priority }));
      },

      setFilterDepartment: (department) => {
        setState((prev) => ({ ...prev, filterDepartment: department }));
      },

      setSearchQuery: (query) => {
        setState((prev) => ({ ...prev, searchQuery: query }));
      },

      setIsCreating: (value) => {
        setState((prev) => ({ ...prev, isCreating: value }));
      },

      setIsDragging: (value) => {
        setState((prev) => ({ ...prev, isDragging: value }));
      },

      // Quick actions
      markComplete: (id) => {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === id
              ? { ...t, status: "done", completedAt: Date.now(), updatedAt: Date.now() }
              : t
          ),
        }));
      },

      moveToToday: (id) => {
        setState((prev) => {
          const maxOrder = Math.max(
            0,
            ...prev.tasks.filter((t) => t.status === "today").map((t) => t.order)
          );
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === id
                ? { ...t, status: "today", order: maxOrder + 1, updatedAt: Date.now() }
                : t
            ),
          };
        });
      },

      moveToInbox: (id) => {
        setState((prev) => {
          const maxOrder = Math.max(
            0,
            ...prev.tasks.filter((t) => t.status === "inbox").map((t) => t.order)
          );
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === id
                ? { ...t, status: "inbox", order: maxOrder + 1, updatedAt: Date.now() }
                : t
            ),
          };
        });
      },

      // Derived data
      getTasksByStatus: (status) => {
        return state.tasks
          .filter((t) => t.status === status)
          .sort((a, b) => a.order - b.order);
      },

      getFilteredTasks: () => {
        let filtered = state.tasks;

        if (state.filterArea) {
          filtered = filtered.filter((t) => t.area === state.filterArea);
        }

        if (state.filterPriority) {
          filtered = filtered.filter((t) => t.priority === state.filterPriority);
        }

        if (state.filterDepartment) {
          filtered = filtered.filter((t) => t.department === state.filterDepartment);
        }

        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(query) ||
              t.description?.toLowerCase().includes(query) ||
              t.tags.some((tag) => tag.toLowerCase().includes(query))
          );
        }

        return filtered;
      },

      getSelectedTask: () => {
        if (!state.selectedTaskId) return null;
        return state.tasks.find((t) => t.id === state.selectedTaskId) ?? null;
      },

      getTaskStats: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        const todayEnd = todayStart + 24 * 60 * 60 * 1000;

        return {
          total: state.tasks.length,
          inbox: state.tasks.filter((t) => t.status === "inbox").length,
          today: state.tasks.filter((t) => t.status === "today").length,
          completedToday: state.tasks.filter(
            (t) =>
              t.status === "done" &&
              t.completedAt &&
              t.completedAt >= todayStart &&
              t.completedAt < todayEnd
          ).length,
          overdue: state.tasks.filter(
            (t) =>
              t.status !== "done" &&
              t.dueDate &&
              t.dueDate < todayStart
          ).length,
        };
      },
    };
  }, [state.tasks, state.filterArea, state.filterPriority, state.filterDepartment, state.searchQuery, state.selectedTaskId]);

  return [state, actions];
}

// ============================================
// Context for sharing state across components
// ============================================

export const KanbanContext = React.createContext<
  [KanbanState, KanbanActions] | null
>(null);

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const kanbanState = useKanbanState();

  return (
    <KanbanContext.Provider value={kanbanState}>
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban(): [KanbanState, KanbanActions] {
  const context = React.useContext(KanbanContext);
  if (!context) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
}

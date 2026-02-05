/**
 * Unified State Management for Dieter HQ
 * 
 * Central store that orchestrates:
 * - AI Context Management
 * - Kanban Tasks
 * - Calendar Events  
 * - Cross-component communication
 * - View transitions
 * - Offline sync queue
 */

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { 
  ContextManager, 
  getContextManager,
  CreateContextParams,
  HandleMessageResult,
} from '@/lib/ai/context/manager';

import {
  Context,
  ContextType,
  RoutingDecision,
  ThreadRecommendation,
} from '@/lib/ai/context/types';

import { Task, TaskStatus, DEMO_TASKS } from '@/lib/kanban-data';
import { CalendarEvent, DEMO_EVENTS } from '@/lib/calendar-data';

// ============================================================================
// TYPES
// ============================================================================

export type ViewType = 'chat' | 'kanban' | 'calendar' | 'events' | 'home';

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface ViewTransition {
  from: ViewType;
  to: ViewType;
  timestamp: Date;
  reason?: string;
  aiSuggested?: boolean;
}

export interface UnifiedState {
  // View state
  currentView: ViewType;
  viewHistory: ViewTransition[];
  
  // AI Context
  aiContexts: Context[];
  activeAiContextId: string | null;
  contextRecommendations: ThreadRecommendation[];
  lastRoutingDecision: RoutingDecision | null;
  
  // Kanban
  tasks: Task[];
  selectedTaskId: string | null;
  kanbanFilters: {
    area: string | null;
    priority: string | null;
    search: string;
  };
  
  // Calendar
  events: CalendarEvent[];
  selectedEventId: string | null;
  calendarView: 'day' | 'week' | 'month';
  selectedDate: Date;
  
  // App-wide
  notifications: AppNotification[];
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncAt: Date | null;
  
  // UI
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  isLoading: boolean;
}

// ============================================================================
// ACTIONS
// ============================================================================

type UnifiedAction =
  // View actions
  | { type: 'SET_VIEW'; payload: ViewType; reason?: string; aiSuggested?: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_COMMAND_PALETTE' }
  | { type: 'SET_LOADING'; payload: boolean }
  
  // AI Context actions
  | { type: 'SET_AI_CONTEXTS'; payload: Context[] }
  | { type: 'SET_ACTIVE_AI_CONTEXT'; payload: string | null }
  | { type: 'SET_CONTEXT_RECOMMENDATIONS'; payload: ThreadRecommendation[] }
  | { type: 'SET_ROUTING_DECISION'; payload: RoutingDecision }
  | { type: 'CREATE_AI_CONTEXT'; payload: Context }
  | { type: 'UPDATE_AI_CONTEXT'; payload: { id: string; updates: Partial<Context> } }
  | { type: 'ARCHIVE_AI_CONTEXT'; payload: string }
  
  // Kanban actions
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TASK'; payload: { id: string; status: TaskStatus; order?: number } }
  | { type: 'SELECT_TASK'; payload: string | null }
  | { type: 'SET_KANBAN_FILTERS'; payload: Partial<UnifiedState['kanbanFilters']> }
  
  // Calendar actions
  | { type: 'SET_EVENTS'; payload: CalendarEvent[] }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<CalendarEvent> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'SET_CALENDAR_VIEW'; payload: 'day' | 'week' | 'month' }
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  
  // Notifications
  | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  
  // Sync
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_PENDING_SYNC'; payload: number }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  
  // Batch
  | { type: 'HYDRATE_STATE'; payload: Partial<UnifiedState> };

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: UnifiedState = {
  currentView: 'chat',
  viewHistory: [],
  
  aiContexts: [],
  activeAiContextId: null,
  contextRecommendations: [],
  lastRoutingDecision: null,
  
  tasks: DEMO_TASKS,
  selectedTaskId: null,
  kanbanFilters: {
    area: null,
    priority: null,
    search: '',
  },
  
  events: DEMO_EVENTS,
  selectedEventId: null,
  calendarView: 'week',
  selectedDate: new Date(),
  
  notifications: [],
  isOnline: true,
  pendingSyncCount: 0,
  lastSyncAt: null,
  
  sidebarOpen: true,
  commandPaletteOpen: false,
  isLoading: false,
};

// ============================================================================
// REDUCER
// ============================================================================

function unifiedReducer(state: UnifiedState, action: UnifiedAction): UnifiedState {
  switch (action.type) {
    // View
    case 'SET_VIEW': {
      const transition: ViewTransition = {
        from: state.currentView,
        to: action.payload,
        timestamp: new Date(),
        reason: action.reason,
        aiSuggested: action.aiSuggested,
      };
      return {
        ...state,
        currentView: action.payload,
        viewHistory: [...state.viewHistory.slice(-50), transition],
      };
    }
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
      
    case 'TOGGLE_COMMAND_PALETTE':
      return { ...state, commandPaletteOpen: !state.commandPaletteOpen };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    // AI Context
    case 'SET_AI_CONTEXTS':
      return { ...state, aiContexts: action.payload };
      
    case 'SET_ACTIVE_AI_CONTEXT':
      return { ...state, activeAiContextId: action.payload };
      
    case 'SET_CONTEXT_RECOMMENDATIONS':
      return { ...state, contextRecommendations: action.payload };
      
    case 'SET_ROUTING_DECISION':
      return { ...state, lastRoutingDecision: action.payload };
      
    case 'CREATE_AI_CONTEXT':
      return { ...state, aiContexts: [...state.aiContexts, action.payload] };
      
    case 'UPDATE_AI_CONTEXT':
      return {
        ...state,
        aiContexts: state.aiContexts.map(ctx =>
          ctx.id === action.payload.id
            ? { ...ctx, ...action.payload.updates, lastActiveAt: new Date() }
            : ctx
        ),
      };
      
    case 'ARCHIVE_AI_CONTEXT':
      return {
        ...state,
        aiContexts: state.aiContexts.map(ctx =>
          ctx.id === action.payload ? { ...ctx, status: 'archived' as const } : ctx
        ),
        activeAiContextId: state.activeAiContextId === action.payload
          ? null
          : state.activeAiContextId,
      };
    
    // Kanban
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
      
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
      
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id
            ? { ...t, ...action.payload.updates, updatedAt: Date.now() }
            : t
        ),
      };
      
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
        selectedTaskId: state.selectedTaskId === action.payload ? null : state.selectedTaskId,
      };
      
    case 'MOVE_TASK': {
      const { id, status, order } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === id
            ? {
                ...t,
                status,
                order: order ?? t.order,
                updatedAt: Date.now(),
                completedAt: status === 'done' ? Date.now() : t.completedAt,
              }
            : t
        ),
      };
    }
    
    case 'SELECT_TASK':
      return { ...state, selectedTaskId: action.payload };
      
    case 'SET_KANBAN_FILTERS':
      return {
        ...state,
        kanbanFilters: { ...state.kanbanFilters, ...action.payload },
      };
    
    // Calendar
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
      
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
      
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e =>
          e.id === action.payload.id
            ? { ...e, ...action.payload.updates, updatedAt: Date.now() }
            : e
        ),
      };
      
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload),
        selectedEventId: state.selectedEventId === action.payload ? null : state.selectedEventId,
      };
      
    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.payload };
      
    case 'SET_CALENDAR_VIEW':
      return { ...state, calendarView: action.payload };
      
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    
    // Notifications
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50),
      };
      
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
      
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    
    // Sync
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
      
    case 'SET_PENDING_SYNC':
      return { ...state, pendingSyncCount: action.payload };
      
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncAt: action.payload };
    
    // Hydration
    case 'HYDRATE_STATE':
      return { ...state, ...action.payload };
      
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface UnifiedStoreContextValue {
  state: UnifiedState;
  dispatch: React.Dispatch<UnifiedAction>;
  
  // AI Context Manager
  contextManager: ContextManager;
  
  // View navigation with AI routing
  navigateToView: (view: ViewType, options?: { reason?: string }) => void;
  navigateWithAI: (message: string) => Promise<HandleMessageResult | null>;
  
  // Kanban helpers
  addTask: (task: Partial<Task> & { title: string }) => Task;
  completeTask: (id: string) => void;
  
  // Calendar helpers
  addEvent: (event: Partial<CalendarEvent> & { title: string; startAt: number; endAt: number }) => CalendarEvent;
  
  // Notifications
  notify: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  
  // Cross-component communication
  createTaskFromChat: (title: string, description?: string) => Task;
  createEventFromChat: (title: string, startAt: Date, endAt: Date) => CalendarEvent;
  linkTaskToEvent: (taskId: string, eventId: string) => void;
}

const UnifiedStoreContext = createContext<UnifiedStoreContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function UnifiedStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(unifiedReducer, initialState);
  const contextManagerRef = useRef<ContextManager | null>(null);
  
  // Initialize context manager once
  if (!contextManagerRef.current) {
    contextManagerRef.current = getContextManager({
      defaultModel: 'anthropic/claude-3-5-haiku-20241022',
      enableAutoRouting: true,
      enablePredictiveRecommendations: true,
    });
  }
  
  const contextManager = contextManagerRef.current;
  
  // Sync AI contexts to state
  useEffect(() => {
    const syncContexts = () => {
      const contexts = contextManager.getAllContexts();
      dispatch({ type: 'SET_AI_CONTEXTS', payload: contexts });
      
      const active = contextManager.getActiveContext();
      if (active && active.id !== state.activeAiContextId) {
        dispatch({ type: 'SET_ACTIVE_AI_CONTEXT', payload: active.id });
      }
    };
    
    // Initial sync
    syncContexts();
    
    // Subscribe to changes
    const unsubCreated = contextManager.on('context:created', syncContexts);
    const unsubUpdated = contextManager.on('context:updated', syncContexts);
    const unsubArchived = contextManager.on('context:archived', syncContexts);
    const unsubSwitched = contextManager.on('context:switched', syncContexts);
    
    return () => {
      unsubCreated();
      unsubUpdated();
      unsubArchived();
      unsubSwitched();
    };
  }, [contextManager, state.activeAiContextId]);
  
  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    dispatch({ type: 'SET_ONLINE', payload: navigator.onLine });
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Navigation with AI routing
  const navigateWithAI = useCallback(async (message: string): Promise<HandleMessageResult | null> => {
    try {
      const result = await contextManager.handleMessage(message);
      
      dispatch({ type: 'SET_CONTEXT_RECOMMENDATIONS', payload: result.recommendations });
      
      if (result.routingDecision) {
        dispatch({ type: 'SET_ROUTING_DECISION', payload: result.routingDecision });
        
        // Check if routing suggests a view change
        const viewHints: Record<string, ViewType> = {
          'task': 'kanban',
          'calendar': 'calendar',
          'event': 'calendar',
          'schedule': 'calendar',
          'board': 'kanban',
          'todo': 'kanban',
        };
        
        const lowerMessage = message.toLowerCase();
        for (const [hint, view] of Object.entries(viewHints)) {
          if (lowerMessage.includes(hint) && state.currentView !== view) {
            dispatch({
              type: 'SET_VIEW',
              payload: view,
              reason: `AI detected ${hint} intent`,
              aiSuggested: true,
            });
            break;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('AI routing error:', error);
      return null;
    }
  }, [contextManager, state.currentView]);
  
  const navigateToView = useCallback((view: ViewType, options?: { reason?: string }) => {
    if (view !== state.currentView) {
      dispatch({
        type: 'SET_VIEW',
        payload: view,
        reason: options?.reason,
        aiSuggested: false,
      });
    }
  }, [state.currentView]);
  
  // Task helpers
  const addTask = useCallback((partial: Partial<Task> & { title: string }): Task => {
    const timestamp = Date.now();
    const maxOrder = Math.max(0, ...state.tasks.filter(t => t.status === (partial.status ?? 'inbox')).map(t => t.order));
    
    const newTask: Task = {
      id: `task_${timestamp}_${Math.random().toString(36).slice(2, 9)}`,
      title: partial.title,
      description: partial.description,
      status: partial.status ?? 'inbox',
      priority: partial.priority ?? 'medium',
      area: partial.area ?? 'personal',
      dueDate: partial.dueDate,
      estimatedMinutes: partial.estimatedMinutes,
      tags: partial.tags ?? [],
      subtasks: partial.subtasks ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
      order: maxOrder + 1,
    };
    
    dispatch({ type: 'ADD_TASK', payload: newTask });
    return newTask;
  }, [state.tasks]);
  
  const completeTask = useCallback((id: string) => {
    dispatch({ type: 'MOVE_TASK', payload: { id, status: 'done' } });
  }, []);
  
  // Event helpers
  const addEvent = useCallback((partial: Partial<CalendarEvent> & { title: string; startAt: number; endAt: number }): CalendarEvent => {
    const timestamp = Date.now();
    
    const newEvent: CalendarEvent = {
      id: `event_${timestamp}_${Math.random().toString(36).slice(2, 9)}`,
      title: partial.title,
      description: partial.description,
      startAt: partial.startAt,
      endAt: partial.endAt,
      allDay: partial.allDay ?? false,
      color: partial.color ?? 'blue',
      location: partial.location,
      reminders: partial.reminders ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    dispatch({ type: 'ADD_EVENT', payload: newEvent });
    return newEvent;
  }, []);
  
  // Notification helper
  const notify = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const fullNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
  }, []);
  
  // Cross-component communication
  const createTaskFromChat = useCallback((title: string, description?: string): Task => {
    const task = addTask({ title, description, status: 'inbox' });
    notify({
      type: 'success',
      title: 'Task Created',
      message: `"${title}" added to inbox`,
      actionUrl: '/kanban',
    });
    return task;
  }, [addTask, notify]);
  
  const createEventFromChat = useCallback((title: string, startAt: Date, endAt: Date): CalendarEvent => {
    const event = addEvent({
      title,
      startAt: startAt.getTime(),
      endAt: endAt.getTime(),
    });
    notify({
      type: 'success',
      title: 'Event Created',
      message: `"${title}" scheduled`,
      actionUrl: '/calendar',
    });
    return event;
  }, [addEvent, notify]);
  
  const linkTaskToEvent = useCallback((taskId: string, eventId: string) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        id: taskId,
        updates: {
          tags: [...(state.tasks.find(t => t.id === taskId)?.tags || []), `event:${eventId}`],
        },
      },
    });
    
    dispatch({
      type: 'UPDATE_EVENT',
      payload: {
        id: eventId,
        updates: {
          description: `${state.events.find(e => e.id === eventId)?.description || ''}\n\nLinked task: ${taskId}`.trim(),
        },
      },
    });
  }, [state.tasks, state.events]);
  
  const value = useMemo<UnifiedStoreContextValue>(() => ({
    state,
    dispatch,
    contextManager,
    navigateToView,
    navigateWithAI,
    addTask,
    completeTask,
    addEvent,
    notify,
    createTaskFromChat,
    createEventFromChat,
    linkTaskToEvent,
  }), [
    state,
    dispatch,
    contextManager,
    navigateToView,
    navigateWithAI,
    addTask,
    completeTask,
    addEvent,
    notify,
    createTaskFromChat,
    createEventFromChat,
    linkTaskToEvent,
  ]);
  
  return (
    <UnifiedStoreContext.Provider value={value}>
      {children}
    </UnifiedStoreContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useUnifiedStore(): UnifiedStoreContextValue {
  const context = useContext(UnifiedStoreContext);
  if (!context) {
    throw new Error('useUnifiedStore must be used within UnifiedStoreProvider');
  }
  return context;
}

// Specialized hooks for common patterns
export function useCurrentView() {
  const { state, navigateToView } = useUnifiedStore();
  return {
    view: state.currentView,
    navigate: navigateToView,
    history: state.viewHistory,
  };
}

export function useAIContext() {
  const { state, contextManager } = useUnifiedStore();
  return {
    contexts: state.aiContexts,
    activeContextId: state.activeAiContextId,
    recommendations: state.contextRecommendations,
    lastRouting: state.lastRoutingDecision,
    manager: contextManager,
  };
}

export function useKanbanStore() {
  const { state, dispatch, addTask, completeTask } = useUnifiedStore();
  
  const filteredTasks = useMemo(() => {
    let tasks = state.tasks;
    
    if (state.kanbanFilters.area) {
      tasks = tasks.filter(t => t.area === state.kanbanFilters.area);
    }
    if (state.kanbanFilters.priority) {
      tasks = tasks.filter(t => t.priority === state.kanbanFilters.priority);
    }
    if (state.kanbanFilters.search) {
      const query = state.kanbanFilters.search.toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    
    return tasks;
  }, [state.tasks, state.kanbanFilters]);
  
  return {
    tasks: filteredTasks,
    allTasks: state.tasks,
    selectedTaskId: state.selectedTaskId,
    filters: state.kanbanFilters,
    addTask,
    completeTask,
    updateTask: (id: string, updates: Partial<Task>) =>
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates } }),
    deleteTask: (id: string) =>
      dispatch({ type: 'DELETE_TASK', payload: id }),
    moveTask: (id: string, status: TaskStatus, order?: number) =>
      dispatch({ type: 'MOVE_TASK', payload: { id, status, order } }),
    selectTask: (id: string | null) =>
      dispatch({ type: 'SELECT_TASK', payload: id }),
    setFilters: (filters: Partial<UnifiedState['kanbanFilters']>) =>
      dispatch({ type: 'SET_KANBAN_FILTERS', payload: filters }),
  };
}

export function useCalendarStore() {
  const { state, dispatch, addEvent } = useUnifiedStore();
  
  return {
    events: state.events,
    selectedEventId: state.selectedEventId,
    view: state.calendarView,
    selectedDate: state.selectedDate,
    addEvent,
    updateEvent: (id: string, updates: Partial<CalendarEvent>) =>
      dispatch({ type: 'UPDATE_EVENT', payload: { id, updates } }),
    deleteEvent: (id: string) =>
      dispatch({ type: 'DELETE_EVENT', payload: id }),
    selectEvent: (id: string | null) =>
      dispatch({ type: 'SELECT_EVENT', payload: id }),
    setView: (view: 'day' | 'week' | 'month') =>
      dispatch({ type: 'SET_CALENDAR_VIEW', payload: view }),
    setDate: (date: Date) =>
      dispatch({ type: 'SET_SELECTED_DATE', payload: date }),
  };
}

export function useNotifications() {
  const { state, dispatch, notify } = useUnifiedStore();
  
  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.read).length,
    notify,
    markRead: (id: string) =>
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id }),
    clearAll: () =>
      dispatch({ type: 'CLEAR_NOTIFICATIONS' }),
  };
}

export function useSyncStatus() {
  const { state } = useUnifiedStore();
  
  return {
    isOnline: state.isOnline,
    pendingSync: state.pendingSyncCount,
    lastSync: state.lastSyncAt,
  };
}

'use client';

/**
 * Global Activity Hook
 * 
 * Subscribes to ALL agent events across all sessions via WebSocket.
 * Shows what Dieter/Subagents are doing in real-time.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getOpenClawClient, OpenClawClient, type ConnectionState } from './client';

// ============================================================================
// Types
// ============================================================================

export type GlobalActivityType = 
  | 'idle'           // Nothing happening
  | 'thinking'       // Agent is thinking/reasoning  
  | 'streaming'      // Agent is streaming text
  | 'tool'           // Agent is executing a tool
  | 'queued';        // Message queued, waiting

export interface SessionActivity {
  sessionKey: string;
  runId: string;
  type: GlobalActivityType;
  toolName?: string;
  content?: string;
  timestamp: number;
  label?: string;  // e.g. "gyn-portale", "main"
}

export interface GlobalActivityState {
  // All active sessions
  sessions: Map<string, SessionActivity>;
  // Convenience
  activeCount: number;
  isAnyActive: boolean;
  // Main session status
  mainSession: SessionActivity | null;
  // Subagent sessions  
  subagents: SessionActivity[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function getActivityType(stream: string): GlobalActivityType {
  switch (stream) {
    case 'thinking':
    case 'thinking_delta':
      return 'thinking';
    case 'tool':
    case 'tool_use':
    case 'toolCall':
      return 'tool';
    case 'text':
    case 'delta':
    case 'content_block_delta':
      return 'streaming';
    case 'end':
    case 'done':
    case 'message_stop':
      return 'idle';
    default:
      return 'thinking'; // Default to thinking for unknown events
  }
}

function extractLabel(sessionKey: string): string {
  // agent:main:dieter-hq:main → "main"
  // agent:coder:subagent:gyn-portale → "gyn-portale"
  const parts = sessionKey.split(':');
  if (parts.includes('subagent') && parts.length > 3) {
    return parts[parts.length - 1];
  }
  if (parts.length >= 2) {
    return parts[1]; // agent:main → "main"
  }
  return sessionKey;
}

function isSubagent(sessionKey: string): boolean {
  return sessionKey.includes('subagent');
}

// ============================================================================
// Hook
// ============================================================================

export function useGlobalActivity(): GlobalActivityState & {
  connected: boolean;
  connecting: boolean;
} {
  const clientRef = useRef<OpenClawClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [sessions, setSessions] = useState<Map<string, SessionActivity>>(new Map());
  const cleanupTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Initialize client and subscribe to events
  useEffect(() => {
    const client = getOpenClawClient();
    clientRef.current = client;

    // Track connection state
    const unsubConnection = client.onConnectionChange((state) => {
      setConnectionState(state);
      
      // Clear all sessions on disconnect
      if (state === 'disconnected') {
        setSessions(new Map());
        cleanupTimersRef.current.forEach(timer => clearTimeout(timer));
        cleanupTimersRef.current.clear();
      }
    });

    // Set initial state
    setConnectionState(client.state);

    // Auto-connect if needed
    if (client.state === 'disconnected') {
      client.connect().catch(console.error);
    }

    // Subscribe to ALL agent events (global, not session-specific)
    const unsubAgent = client.on<{
      runId: string;
      seq: number;
      stream: string;
      ts: number;
      sessionKey?: string;
      session?: string;
      data?: {
        toolName?: string;
        toolId?: string;
        name?: string;
        content?: string;
        delta?: string;
        [key: string]: unknown;
      };
    }>('agent', (event) => {
      const sessionKey = event.sessionKey || event.session || `run:${event.runId}`;
      const now = Date.now();
      const activityType = getActivityType(event.stream);
      
      console.log('[GlobalActivity] Agent event:', {
        sessionKey,
        stream: event.stream,
        type: activityType,
        toolName: event.data?.toolName || event.data?.name,
      });

      setSessions(prev => {
        const next = new Map(prev);
        
        if (activityType === 'idle') {
          // Session finished - schedule cleanup after 5s
          const existingTimer = cleanupTimersRef.current.get(sessionKey);
          if (existingTimer) clearTimeout(existingTimer);
          
          const timer = setTimeout(() => {
            setSessions(current => {
              const updated = new Map(current);
              updated.delete(sessionKey);
              return updated;
            });
            cleanupTimersRef.current.delete(sessionKey);
          }, 5000);
          
          cleanupTimersRef.current.set(sessionKey, timer);
          
          // Mark as idle but keep for now
          next.set(sessionKey, {
            sessionKey,
            runId: event.runId,
            type: 'idle',
            timestamp: now,
            label: extractLabel(sessionKey),
          });
        } else {
          // Clear any pending cleanup
          const existingTimer = cleanupTimersRef.current.get(sessionKey);
          if (existingTimer) {
            clearTimeout(existingTimer);
            cleanupTimersRef.current.delete(sessionKey);
          }
          
          next.set(sessionKey, {
            sessionKey,
            runId: event.runId,
            type: activityType,
            toolName: event.data?.toolName || event.data?.name,
            content: event.data?.delta || event.data?.content,
            timestamp: now,
            label: extractLabel(sessionKey),
          });
        }
        
        return next;
      });
    });

    // Cleanup
    return () => {
      unsubConnection();
      unsubAgent();
      cleanupTimersRef.current.forEach(timer => clearTimeout(timer));
      cleanupTimersRef.current.clear();
    };
  }, []);

  // Compute derived state
  const sessionsArray = Array.from(sessions.values());
  const activeSessions = sessionsArray.filter(s => s.type !== 'idle');
  const mainSession = sessionsArray.find(s => !isSubagent(s.sessionKey)) || null;
  const subagents = sessionsArray.filter(s => isSubagent(s.sessionKey));

  return {
    sessions,
    activeCount: activeSessions.length,
    isAnyActive: activeSessions.length > 0,
    mainSession,
    subagents,
    connected: connectionState === 'connected',
    connecting: connectionState === 'connecting',
  };
}

// ============================================================================
// Activity Label Helper
// ============================================================================

export function getActivityLabel(activity: SessionActivity | null): string {
  if (!activity) return '';
  
  switch (activity.type) {
    case 'thinking':
      return 'Denkt nach...';
    case 'streaming':
      return 'Schreibt...';
    case 'tool':
      return activity.toolName 
        ? `${activity.toolName}...`
        : 'Führt Aktion aus...';
    case 'queued':
      return 'Wartet...';
    case 'idle':
    default:
      return '';
  }
}

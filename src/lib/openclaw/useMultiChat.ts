'use client';

/**
 * Multi-Chat Hook for DieterHQ
 * 
 * Handles thread → session mapping and provides WebSocket-based chat
 * with HTTP fallback.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getOpenClawClient, OpenClawClient, type AgentActivity } from './client';

// Thread to Agent mapping (same as server-side)
const THREAD_TO_AGENT: Record<string, string> = {
  'life': 'main',
  'dev': 'coder',
  'sport': 'sport',
  'work': 'work',
};

// Workspace prefix for dev threads
const WORKSPACE_PREFIX = 'dev:';

/**
 * Maps a DieterHQ threadId to an OpenClaw sessionKey
 */
export function threadIdToSessionKey(threadId: string): string {
  const isWorkspaceThread = threadId.startsWith(WORKSPACE_PREFIX);
  const baseThreadId = isWorkspaceThread ? 'dev' : threadId;
  const agentId = isWorkspaceThread ? 'coder' : (THREAD_TO_AGENT[threadId] || 'main');
  return `agent:${agentId}:dieter-hq:${threadId}`;
}

/**
 * Extracts a readable name from a session key
 */
export function sessionKeyToDisplayName(sessionKey: string): string {
  const parts = sessionKey.split(':');
  if (parts[0] === 'agent' && parts.length >= 4) {
    const agentType = parts[1];
    const threadParts = parts.slice(3);
    const threadName = threadParts.join(':')
      .split(/[-_]/)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
    
    if (agentType === 'main') {
      return threadName || 'Main';
    }
    return `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} · ${threadName}`;
  }
  return sessionKey;
}

// Message type matching DieterHQ's format
export interface ChatMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  createdAtLabel: string;
  audioUrl?: string | null;
  audioDurationMs?: number | null;
  transcription?: string | null;
}

interface UseMultiChatResult {
  // Connection state
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  
  // Send a message (uses WebSocket if connected, HTTP fallback otherwise)
  sendMessage: (threadId: string, content: string, attachmentIds?: string[]) => Promise<void>;
  
  // Abort current streaming
  abort: (threadId: string) => Promise<void>;
  
  // Current activity per thread
  activities: Map<string, AgentActivity>;
  
  // Global activity (all sessions)
  globalActivities: Map<string, AgentActivity>;
  
  // Whether a thread is currently streaming
  isStreaming: (threadId: string) => boolean;
  
  // HTTP fallback mode
  isUsingHttpFallback: boolean;
}

export function useMultiChat(): UseMultiChatResult {
  const clientRef = useRef<OpenClawClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activities, setActivities] = useState<Map<string, AgentActivity>>(new Map());
  const [globalActivities, setGlobalActivities] = useState<Map<string, AgentActivity>>(new Map());
  const [streamingThreads, setStreamingThreads] = useState<Set<string>>(new Set());
  const [isUsingHttpFallback, setIsUsingHttpFallback] = useState(false);
  const mountedRef = useRef(true);

  // Initialize client and connect
  useEffect(() => {
    mountedRef.current = true;
    
    const client = getOpenClawClient();
    clientRef.current = client;

    // Subscribe to connection state
    const unsubConnection = client.onConnectionChange((state, err) => {
      if (!mountedRef.current) return;
      
      setConnected(state === 'connected');
      setConnecting(state === 'connecting' || state === 'reconnecting');
      if (err) setError(err);
      
      // If we can't connect, use HTTP fallback
      if (state === 'disconnected' && err) {
        console.log('[useMultiChat] WebSocket failed, using HTTP fallback');
        setIsUsingHttpFallback(true);
      } else if (state === 'connected') {
        console.log('[useMultiChat] WebSocket connected');
        setIsUsingHttpFallback(false);
      }
    });

    // Subscribe to agent events for activity tracking
    const unsubAgent = client.on<{
      runId: string;
      seq: number;
      stream: string;
      ts: number;
      sessionKey?: string;
      data?: {
        toolName?: string;
        name?: string;
        content?: string;
        delta?: string;
      };
    }>('agent', (event) => {
      if (!mountedRef.current) return;
      
      const sessionKey = event.sessionKey;
      const now = Date.now();
      
      let activityType: AgentActivity['type'] = 'idle';
      let toolName: string | undefined;
      
      switch (event.stream) {
        case 'thinking':
        case 'thinking_delta':
          activityType = 'thinking';
          break;
        case 'tool':
        case 'tool_use':
        case 'toolCall':
          activityType = 'tool';
          toolName = event.data?.toolName || event.data?.name;
          break;
        case 'text':
        case 'delta':
        case 'content_block_delta':
          activityType = 'streaming';
          break;
        case 'end':
        case 'done':
        case 'message_stop':
          activityType = 'idle';
          break;
      }

      const activity: AgentActivity = {
        type: activityType,
        sessionKey,
        runId: event.runId,
        toolName,
        timestamp: now,
      };

      // Update global activities
      setGlobalActivities(prev => {
        const next = new Map(prev);
        if (activityType === 'idle') {
          // Remove after a short delay
          setTimeout(() => {
            setGlobalActivities(p => {
              const n = new Map(p);
              n.delete(sessionKey || event.runId);
              return n;
            });
          }, 3000);
        }
        next.set(sessionKey || event.runId, activity);
        return next;
      });

      // Update per-thread activities if we can map it
      if (sessionKey) {
        setActivities(prev => {
          const next = new Map(prev);
          next.set(sessionKey, activity);
          return next;
        });
      }
    });

    // Subscribe to chat events for streaming state
    const unsubChat = client.on<{
      sessionKey: string;
      runId?: string;
      state: 'delta' | 'final' | 'error' | 'aborted';
    }>('chat', (event) => {
      if (!mountedRef.current) return;
      
      const sessionKey = event.sessionKey;
      
      if (event.state === 'delta') {
        setStreamingThreads(prev => new Set(prev).add(sessionKey));
      } else if (event.state === 'final' || event.state === 'error' || event.state === 'aborted') {
        setStreamingThreads(prev => {
          const next = new Set(prev);
          next.delete(sessionKey);
          return next;
        });
      }
    });

    // Initial state
    setConnected(client.connected);
    setConnecting(client.state === 'connecting');

    // Try to connect if not already
    if (client.state === 'disconnected') {
      client.connect().catch(err => {
        if (mountedRef.current) {
          console.error('[useMultiChat] Connection failed:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsUsingHttpFallback(true);
        }
      });
    }

    return () => {
      mountedRef.current = false;
      unsubConnection();
      unsubAgent();
      unsubChat();
    };
  }, []);

  // Send message - WebSocket or HTTP fallback
  const sendMessage = useCallback(async (
    threadId: string, 
    content: string, 
    attachmentIds?: string[]
  ): Promise<void> => {
    const client = clientRef.current;
    const sessionKey = threadIdToSessionKey(threadId);

    // If connected via WebSocket, use it
    if (client?.connected && !isUsingHttpFallback) {
      console.log('[useMultiChat] Sending via WebSocket:', sessionKey);
      try {
        await client.chatSend(sessionKey, content);
        return;
      } catch (err) {
        console.error('[useMultiChat] WebSocket send failed, falling back to HTTP:', err);
        // Fall through to HTTP
      }
    }

    // HTTP fallback
    console.log('[useMultiChat] Sending via HTTP fallback:', threadId);
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId,
        content,
        attachmentIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Send failed: ${response.status}`);
    }

    // Note: HTTP fallback returns SSE stream, caller needs to handle it
    // This is why we still need HTTP handling in MultiChatView for the response
  }, [isUsingHttpFallback]);

  // Abort
  const abort = useCallback(async (threadId: string): Promise<void> => {
    const client = clientRef.current;
    const sessionKey = threadIdToSessionKey(threadId);

    if (client?.connected) {
      try {
        await client.chatAbort(sessionKey);
      } catch (err) {
        console.error('[useMultiChat] Abort failed:', err);
      }
    }
  }, []);

  // Check if thread is streaming
  const isStreaming = useCallback((threadId: string): boolean => {
    const sessionKey = threadIdToSessionKey(threadId);
    return streamingThreads.has(sessionKey);
  }, [streamingThreads]);

  return {
    connected,
    connecting,
    error,
    sendMessage,
    abort,
    activities,
    globalActivities,
    isStreaming,
    isUsingHttpFallback,
  };
}

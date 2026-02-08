'use client';

/**
 * React Hooks for OpenClaw WebSocket Client
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { 
  getOpenClawClient,
  OpenClawClient,
  type ConnectionState,
  type Message,
  type StreamChunkEvent,
  type StreamCompleteEvent,
  type StreamErrorEvent,
} from './client';

// ===========================================================================
// useOpenClawConnection
// ===========================================================================

interface UseOpenClawConnectionResult {
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  state: ConnectionState;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useOpenClawConnection(): UseOpenClawConnectionResult {
  const clientRef = useRef<OpenClawClient | null>(null);
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  // Get or create client
  useEffect(() => {
    clientRef.current = getOpenClawClient();
    
    // Subscribe to connection state changes
    const unsubscribe = clientRef.current.onConnectionChange((newState, err) => {
      setState(newState);
      if (err) setError(err);
    });

    // Set initial state
    setState(clientRef.current.state);

    // Auto-connect on mount
    if (clientRef.current.state === 'disconnected') {
      clientRef.current.connect().catch(setError);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    try {
      await clientRef.current?.connect();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    setError(null);
  }, []);

  return {
    connected: state === 'connected',
    connecting: state === 'connecting',
    reconnecting: state === 'reconnecting',
    state,
    error,
    connect,
    disconnect,
  };
}

// ===========================================================================
// useOpenClawChat
// ===========================================================================

interface UseOpenClawChatResult {
  messages: Message[];
  send: (content: string) => Promise<void>;
  abort: () => Promise<void>;
  isStreaming: boolean;
  streamingContent: string | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export function useOpenClawChat(sessionKey: string): UseOpenClawChatResult {
  const clientRef = useRef<OpenClawClient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get client and load initial history
  useEffect(() => {
    clientRef.current = getOpenClawClient();
    
    const loadHistory = async () => {
      if (!clientRef.current?.connected) {
        // Wait for connection
        const unsubscribe = clientRef.current?.onConnectionChange((state) => {
          if (state === 'connected') {
            unsubscribe?.();
            loadHistory();
          }
        });
        return;
      }

      try {
        setIsLoading(true);
        const history = await clientRef.current.chatHistory(sessionKey);
        setMessages(history);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [sessionKey]);

  // Subscribe to streaming events
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    // Handle streaming chunks
    const unsubChunk = client.onStreamChunk((event: StreamChunkEvent) => {
      if (event.sessionKey !== sessionKey) return;
      if (currentRunId && event.runId !== currentRunId) return;

      setStreamingContent(event.content);
      setIsStreaming(true);
    });

    // Handle stream completion
    const unsubComplete = client.onStreamComplete((event: StreamCompleteEvent) => {
      if (event.sessionKey !== sessionKey) return;
      if (currentRunId && event.runId !== currentRunId) return;

      setMessages((prev) => [...prev, event.message]);
      setStreamingContent(null);
      setIsStreaming(false);
      setCurrentRunId(null);
    });

    // Handle stream errors
    const unsubError = client.onStreamError((event: StreamErrorEvent) => {
      if (event.sessionKey !== sessionKey) return;
      if (currentRunId && event.runId !== currentRunId) return;

      setError(new Error(event.error.message));
      setStreamingContent(null);
      setIsStreaming(false);
      setCurrentRunId(null);
    });

    return () => {
      unsubChunk();
      unsubComplete();
      unsubError();
    };
  }, [sessionKey, currentRunId]);

  const send = useCallback(async (content: string) => {
    const client = clientRef.current;
    if (!client?.connected) {
      throw new Error('Not connected to OpenClaw');
    }

    setError(null);

    // Optimistically add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const { runId } = await client.chatSend(sessionKey, content);
      setCurrentRunId(runId);
      setIsStreaming(true);
      setStreamingContent('');
    } catch (e) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    }
  }, [sessionKey]);

  const abort = useCallback(async () => {
    const client = clientRef.current;
    if (!client?.connected) return;

    try {
      await client.chatAbort(sessionKey);
      setIsStreaming(false);
      setStreamingContent(null);
      setCurrentRunId(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, [sessionKey]);

  const reload = useCallback(async () => {
    const client = clientRef.current;
    if (!client?.connected) return;

    try {
      setIsLoading(true);
      const history = await client.chatHistory(sessionKey);
      setMessages(history);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [sessionKey]);

  return {
    messages,
    send,
    abort,
    isStreaming,
    streamingContent,
    error,
    isLoading,
    reload,
  };
}

// ===========================================================================
// useOpenClawEvent
// ===========================================================================

/**
 * Subscribe to a specific OpenClaw event
 */
export function useOpenClawEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const client = getOpenClawClient();
    
    const unsubscribe = client.on<T>(event, (payload) => {
      handlerRef.current(payload);
    });

    return unsubscribe;
  }, [event]);
}

// ===========================================================================
// useOpenClawRequest
// ===========================================================================

interface UseOpenClawRequestResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Make a request to the OpenClaw gateway
 */
export function useOpenClawRequest<T = unknown>(
  method: string,
  params: object = {},
  options: { enabled?: boolean } = {}
): UseOpenClawRequestResult<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const paramsRef = useRef(params);

  // Update params ref when params change
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const fetch = useCallback(async () => {
    const client = getOpenClawClient();
    if (!client.connected) {
      setError(new Error('Not connected'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.request<T>(method, paramsRef.current);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [method]);

  useEffect(() => {
    if (enabled) {
      fetch();
    }
  }, [enabled, fetch]);

  return {
    data,
    error,
    isLoading,
    refetch: fetch,
  };
}

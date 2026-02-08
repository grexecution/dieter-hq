'use client';

/**
 * React Hooks for OpenClaw WebSocket Client
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  getOpenClawClient,
  OpenClawClient,
  type ConnectionState,
  type Message,
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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    console.log('[useOpenClawConnection] Hook mounted');
    
    clientRef.current = getOpenClawClient();
    
    // Subscribe to connection state changes
    const unsubscribe = clientRef.current.onConnectionChange((newState, err) => {
      if (mountedRef.current) {
        console.log('[useOpenClawConnection] State changed:', newState);
        setState(newState);
        if (err) setError(err);
      }
    });

    // Set initial state
    setState(clientRef.current.state);

    // Auto-connect on mount
    if (clientRef.current.state === 'disconnected') {
      console.log('[useOpenClawConnection] Auto-connecting...');
      clientRef.current.connect().catch(err => {
        console.error('[useOpenClawConnection] Connect error:', err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    }

    return () => {
      mountedRef.current = false;
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
        console.log('[useOpenClawChat] Loading history for:', sessionKey);
        const history = await clientRef.current.chatHistory(sessionKey);
        setMessages(history);
        setError(null);
      } catch (e) {
        console.error('[useOpenClawChat] History error:', e);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [sessionKey]);

  // Subscribe to chat events
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    // Handle chat events for streaming
    const unsubChat = client.on<{
      sessionKey: string;
      runId?: string;
      state: 'delta' | 'final' | 'error' | 'aborted';
      message?: { role: string; content: unknown };
      errorMessage?: string;
    }>('chat', (event) => {
      if (event.sessionKey !== sessionKey) return;

      if (event.state === 'delta' && event.message) {
        // Extract text from message content
        const content = event.message.content;
        let text = '';
        if (typeof content === 'string') {
          text = content;
        } else if (Array.isArray(content)) {
          text = content
            .filter((c: { type: string; text?: string }) => c.type === 'text')
            .map((c: { text?: string }) => c.text || '')
            .join('');
        }
        setStreamingContent(text);
        setIsStreaming(true);
      } else if (event.state === 'final') {
        setStreamingContent(null);
        setIsStreaming(false);
        // Reload history to get final message
        client.chatHistory(sessionKey).then(setMessages).catch(console.error);
      } else if (event.state === 'error') {
        setError(new Error(event.errorMessage || 'Chat error'));
        setStreamingContent(null);
        setIsStreaming(false);
      } else if (event.state === 'aborted') {
        setStreamingContent(null);
        setIsStreaming(false);
      }
    });

    return () => {
      unsubChat();
    };
  }, [sessionKey]);

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
      await client.chatSend(sessionKey, content);
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

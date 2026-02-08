/**
 * OpenClaw WebSocket Client
 * 
 * Features:
 * - Connect with auth (token or password)
 * - Auto-reconnect with exponential backoff
 * - Request/Response pattern (id-based)
 * - Event subscription
 * - Chat-specific methods
 */

import type {
  AuthParams,
  ChatHistoryResponse,
  ChatSendResponse,
  ConnectParams,
  ConnectResponse,
  ConnectionState,
  EventFrame,
  Message,
  OpenClawClientConfig,
  ProtocolError,
  ProtocolFrame,
  RequestFrame,
  ResponseFrame,
  StreamChunkEvent,
  StreamCompleteEvent,
  StreamErrorEvent,
  DEFAULT_CONFIG,
} from './types';

// Re-export types for convenience
export * from './types';

type EventHandler<T = unknown> = (payload: T) => void;

interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export class OpenClawClient {
  private ws: WebSocket | null = null;
  private config: Required<Omit<OpenClawClientConfig, 'auth'>> & { auth?: AuthParams };
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private connectionHandlers = new Set<(state: ConnectionState, error?: Error) => void>();
  private sessionId: string | null = null;

  constructor(config: OpenClawClientConfig = {}) {
    // Merge with defaults
    this.config = {
      url: config.url ?? 'ws://localhost:18789',
      autoReconnect: config.autoReconnect ?? true,
      reconnectMaxAttempts: config.reconnectMaxAttempts ?? 10,
      reconnectBaseDelay: config.reconnectBaseDelay ?? 1000,
      reconnectMaxDelay: config.reconnectMaxDelay ?? 30000,
      requestTimeout: config.requestTimeout ?? 60000,
      clientInfo: {
        id: config.clientInfo?.id ?? 'dieter-hq',
        version: config.clientInfo?.version ?? '1.0.0',
        platform: config.clientInfo?.platform ?? 'web',
        mode: config.clientInfo?.mode ?? 'operator',
      },
      auth: config.auth,
    };
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  get state(): ConnectionState {
    return this.connectionState;
  }

  get connected(): boolean {
    return this.connectionState === 'connected';
  }

  async connect(url?: string, auth?: AuthParams): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }

    const wsUrl = url ?? this.config.url;
    const wsAuth = auth ?? this.config.auth;

    this.setConnectionState('connecting');
    this.clearReconnectTimer();

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = async () => {
          try {
            await this.authenticate(wsAuth);
            this.reconnectAttempts = 0;
            this.setConnectionState('connected');
            resolve();
          } catch (error) {
            this.ws?.close();
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = () => {
          // Error details are in onclose
        };

        this.ws.onclose = (event) => {
          const wasConnected = this.connectionState === 'connected';
          this.setConnectionState('disconnected');
          
          if (wasConnected && this.config.autoReconnect) {
            this.scheduleReconnect();
          }

          if (this.connectionState === 'connecting') {
            reject(new Error(`Connection closed: ${event.code} ${event.reason}`));
          }
        };
      } catch (error) {
        this.setConnectionState('disconnected');
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.config.autoReconnect = false; // Prevent auto-reconnect on manual disconnect
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client disconnected'));
    }
    this.pendingRequests.clear();
    
    this.setConnectionState('disconnected');
  }

  onConnectionChange(handler: (state: ConnectionState, error?: Error) => void): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  private setConnectionState(state: ConnectionState, error?: Error): void {
    this.connectionState = state;
    for (const handler of this.connectionHandlers) {
      try {
        handler(state, error);
      } catch (e) {
        console.error('[OpenClaw] Connection handler error:', e);
      }
    }
  }

  private async authenticate(auth?: AuthParams): Promise<ConnectResponse> {
    const params: ConnectParams = {
      minProtocol: 3,
      maxProtocol: 3,
      client: this.config.clientInfo as ConnectParams['client'],
      role: 'operator',
      scopes: ['operator.read', 'operator.write'],
      auth,
    };

    const response = await this.request<ConnectResponse>('connect', params);
    this.sessionId = response.sessionId;
    return response;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectMaxAttempts) {
      console.error('[OpenClaw] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      this.config.reconnectMaxDelay
    );

    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');

    console.log(`[OpenClaw] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[OpenClaw] Reconnection failed:', error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ===========================================================================
  // Request/Response Pattern
  // ===========================================================================

  async request<T = unknown>(method: string, params: object = {}): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // For connect method, we're still setting up
      if (method !== 'connect') {
        throw new Error('Not connected to OpenClaw gateway');
      }
    }

    const id = crypto.randomUUID();
    const frame: RequestFrame = {
      type: 'req',
      id,
      method,
      params,
    };

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.config.requestTimeout);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      this.ws!.send(JSON.stringify(frame));
    });
  }

  // ===========================================================================
  // Event Handling
  // ===========================================================================

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    const handlers = this.eventHandlers.get(event)!;
    handlers.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    };
  }

  private handleMessage(data: string): void {
    let frame: ProtocolFrame;
    
    try {
      frame = JSON.parse(data);
    } catch (error) {
      console.error('[OpenClaw] Failed to parse message:', error);
      return;
    }

    switch (frame.type) {
      case 'res':
        this.handleResponse(frame as ResponseFrame);
        break;
      case 'event':
        this.handleEvent(frame as EventFrame);
        break;
      case 'req':
        // Server-initiated requests (not common in this protocol)
        console.warn('[OpenClaw] Received unexpected request from server');
        break;
    }
  }

  private handleResponse(frame: ResponseFrame): void {
    const pending = this.pendingRequests.get(frame.id);
    if (!pending) {
      console.warn('[OpenClaw] Received response for unknown request:', frame.id);
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(frame.id);

    if (frame.ok) {
      pending.resolve(frame.payload);
    } else {
      const error = new Error(frame.error?.message ?? 'Unknown error');
      (error as Error & { code?: string }).code = frame.error?.code;
      pending.reject(error);
    }
  }

  private handleEvent(frame: EventFrame): void {
    const handlers = this.eventHandlers.get(frame.event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    for (const handler of handlers) {
      try {
        handler(frame.payload);
      } catch (error) {
        console.error(`[OpenClaw] Event handler error for ${frame.event}:`, error);
      }
    }
  }

  // ===========================================================================
  // Chat-Specific Methods
  // ===========================================================================

  async chatHistory(sessionKey: string, limit = 50): Promise<Message[]> {
    const response = await this.request<ChatHistoryResponse>('chat.history', {
      sessionKey,
      limit,
    });
    return response.messages;
  }

  async chatSend(sessionKey: string, content: string): Promise<{ runId: string }> {
    const response = await this.request<ChatSendResponse>('chat.send', {
      sessionKey,
      content,
    });
    return { runId: response.runId };
  }

  async chatAbort(sessionKey: string): Promise<void> {
    await this.request('chat.abort', { sessionKey });
  }

  // Convenience event subscriptions for streaming
  onStreamChunk(handler: (event: StreamChunkEvent) => void): () => void {
    return this.on('chat.chunk', handler);
  }

  onStreamComplete(handler: (event: StreamCompleteEvent) => void): () => void {
    return this.on('chat.complete', handler);
  }

  onStreamError(handler: (event: StreamErrorEvent) => void): () => void {
    return this.on('chat.error', handler);
  }
}

// ===========================================================================
// Singleton Instance
// ===========================================================================

let defaultClient: OpenClawClient | null = null;

export function getOpenClawClient(): OpenClawClient {
  if (!defaultClient) {
    const url = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_OPENCLAW_WS_URL ?? 'ws://localhost:18789')
      : 'ws://localhost:18789';
    
    const token = typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_OPENCLAW_TOKEN
      : undefined;

    defaultClient = new OpenClawClient({
      url,
      auth: token ? { token } : undefined,
    });
  }
  return defaultClient;
}

export function resetOpenClawClient(): void {
  if (defaultClient) {
    defaultClient.disconnect();
    defaultClient = null;
  }
}

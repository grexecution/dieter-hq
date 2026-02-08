/**
 * OpenClaw WebSocket Client
 * 
 * Based on the official OpenClaw Gateway Protocol:
 * - Waits for connect.challenge event before sending connect request
 * - Uses password auth (not token) for webchat-ui mode
 * - Proper client.id and client.mode values
 */

// ===========================================================================
// Types
// ===========================================================================

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface OpenClawClientConfig {
  url: string;
  password?: string;
  autoReconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectBaseDelay?: number;
  reconnectMaxDelay?: number;
  requestTimeout?: number;
}

interface RequestFrame {
  type: 'req';
  id: string;
  method: string;
  params: object;
}

interface ResponseFrame {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: string; message: string };
}

interface EventFrame {
  type: 'event';
  event: string;
  payload?: unknown;
}

type ProtocolFrame = RequestFrame | ResponseFrame | EventFrame;

type EventHandler<T = unknown> = (payload: T) => void;

interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ===========================================================================
// OpenClaw Client
// ===========================================================================

export class OpenClawClient {
  private ws: WebSocket | null = null;
  private config: Required<Omit<OpenClawClientConfig, 'password'>> & { password?: string };
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private connectionHandlers = new Set<(state: ConnectionState, error?: Error) => void>();
  private connectPromise: { resolve: () => void; reject: (e: Error) => void } | null = null;

  constructor(config: OpenClawClientConfig) {
    this.config = {
      url: config.url,
      password: config.password,
      autoReconnect: config.autoReconnect ?? true,
      reconnectMaxAttempts: config.reconnectMaxAttempts ?? 10,
      reconnectBaseDelay: config.reconnectBaseDelay ?? 1000,
      reconnectMaxDelay: config.reconnectMaxDelay ?? 30000,
      requestTimeout: config.requestTimeout ?? 60000,
    };
    
    console.log('[OpenClaw] Client created:', { 
      url: this.config.url, 
      hasPassword: !!this.config.password 
    });
  }

  get state(): ConnectionState {
    return this.connectionState;
  }

  get connected(): boolean {
    return this.connectionState === 'connected';
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      console.log('[OpenClaw] Already connected/connecting');
      return;
    }

    this.setConnectionState('connecting');
    this.clearReconnectTimer();

    return new Promise((resolve, reject) => {
      this.connectPromise = { resolve, reject };
      
      try {
        console.log('[OpenClaw] Connecting to:', this.config.url);
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('[OpenClaw] WebSocket opened, waiting for challenge...');
          // Don't resolve yet - wait for connect.challenge and auth
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[OpenClaw] WebSocket error:', error);
        };

        this.ws.onclose = (event) => {
          console.log('[OpenClaw] WebSocket closed:', event.code, event.reason);
          const wasConnected = this.connectionState === 'connected';
          const wasConnecting = this.connectionState === 'connecting';
          
          this.setConnectionState('disconnected');
          
          if (wasConnecting && this.connectPromise) {
            this.connectPromise.reject(new Error(`Connection closed: ${event.code} ${event.reason}`));
            this.connectPromise = null;
          }
          
          if (wasConnected && this.config.autoReconnect) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        console.error('[OpenClaw] Connection error:', error);
        this.setConnectionState('disconnected');
        reject(error);
      }
    });
  }

  disconnect(): void {
    console.log('[OpenClaw] Disconnecting...');
    this.clearReconnectTimer();
    this.config.autoReconnect = false;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

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
    console.log('[OpenClaw] State:', state);
    this.connectionState = state;
    for (const handler of this.connectionHandlers) {
      try {
        handler(state, error);
      } catch (e) {
        console.error('[OpenClaw] Connection handler error:', e);
      }
    }
  }

  private async sendConnectRequest(): Promise<void> {
    console.log('[OpenClaw] Sending connect request...');
    
    const connectReq: RequestFrame = {
      type: 'req',
      id: crypto.randomUUID(),
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'webchat-ui',
          version: '1.0.0',
          platform: 'web',
          mode: 'webchat'
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        caps: [],
        auth: this.config.password ? { password: this.config.password } : undefined
      }
    };

    // Store the request ID to match the response
    const requestId = connectReq.id;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Connect timeout'));
      }, 10000);

      this.pendingRequests.set(requestId, {
        resolve: () => {
          console.log('[OpenClaw] ✅ Authenticated!');
          this.reconnectAttempts = 0;
          this.setConnectionState('connected');
          if (this.connectPromise) {
            this.connectPromise.resolve();
            this.connectPromise = null;
          }
          resolve();
        },
        reject: (error) => {
          console.error('[OpenClaw] ❌ Auth failed:', error);
          if (this.connectPromise) {
            this.connectPromise.reject(error);
            this.connectPromise = null;
          }
          reject(error);
        },
        timeout,
      });

      this.ws!.send(JSON.stringify(connectReq));
    });
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
  // Message Handling
  // ===========================================================================

  private handleMessage(data: string): void {
    let frame: ProtocolFrame;
    
    try {
      frame = JSON.parse(data);
    } catch (error) {
      console.error('[OpenClaw] Failed to parse message:', error);
      return;
    }

    switch (frame.type) {
      case 'event':
        this.handleEvent(frame as EventFrame);
        break;
      case 'res':
        this.handleResponse(frame as ResponseFrame);
        break;
      case 'req':
        console.warn('[OpenClaw] Received unexpected request from server');
        break;
    }
  }

  private handleEvent(frame: EventFrame): void {
    // Handle connect.challenge - this triggers the actual connect request
    if (frame.event === 'connect.challenge') {
      console.log('[OpenClaw] Received challenge, authenticating...');
      this.sendConnectRequest().catch(err => {
        console.error('[OpenClaw] Connect request failed:', err);
      });
      return;
    }

    // Broadcast to event handlers
    const handlers = this.eventHandlers.get(frame.event);
    if (handlers && handlers.size > 0) {
      for (const handler of handlers) {
        try {
          handler(frame.payload);
        } catch (error) {
          console.error(`[OpenClaw] Event handler error for ${frame.event}:`, error);
        }
      }
    }
  }

  private handleResponse(frame: ResponseFrame): void {
    const pending = this.pendingRequests.get(frame.id);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(frame.id);

    if (frame.ok) {
      pending.resolve(frame.payload as never);
    } else {
      const error = new Error(frame.error?.message ?? 'Unknown error');
      pending.reject(error);
    }
  }

  // ===========================================================================
  // Request/Response Pattern
  // ===========================================================================

  async request<T = unknown>(method: string, params: object = {}): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to OpenClaw gateway');
    }

    if (this.connectionState !== 'connected') {
      throw new Error('Not authenticated with OpenClaw gateway');
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
  // Event Subscription
  // ===========================================================================

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    const handlers = this.eventHandlers.get(event)!;
    handlers.add(handler as EventHandler);

    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    };
  }

  // ===========================================================================
  // Chat Methods
  // ===========================================================================

  async chatHistory(sessionKey: string, limit = 50): Promise<Message[]> {
    const response = await this.request<{ messages: Message[] }>('chat.history', {
      sessionKey,
      limit,
    });
    return response.messages ?? [];
  }

  async chatSend(sessionKey: string, message: string): Promise<{ runId: string }> {
    const response = await this.request<{ runId: string }>('chat.send', {
      sessionKey,
      message,  // Note: message, not content
      deliver: false,
      idempotencyKey: crypto.randomUUID(),
    });
    return { runId: response.runId };
  }

  async chatAbort(sessionKey: string): Promise<void> {
    await this.request('chat.abort', { sessionKey });
  }
}

// ===========================================================================
// Singleton Instance
// ===========================================================================

let defaultClient: OpenClawClient | null = null;

export function getOpenClawClient(): OpenClawClient {
  if (!defaultClient) {
    // Read from environment
    const url = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_OPENCLAW_WS_URL ?? 'wss://localhost:18789')
      : 'wss://localhost:18789';
    
    // Support both PASSWORD and TOKEN (TOKEN is legacy, but maps to same gateway password)
    const password = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_OPENCLAW_PASSWORD ?? process.env.NEXT_PUBLIC_OPENCLAW_TOKEN)
      : undefined;

    console.log('[OpenClaw] Creating client:', { 
      url, 
      hasPassword: !!password,
      envUrl: process.env.NEXT_PUBLIC_OPENCLAW_WS_URL,
      envPasswordSet: !!process.env.NEXT_PUBLIC_OPENCLAW_PASSWORD,
      envTokenSet: !!process.env.NEXT_PUBLIC_OPENCLAW_TOKEN,
    });

    defaultClient = new OpenClawClient({ url, password });
  }
  return defaultClient;
}

export function resetOpenClawClient(): void {
  if (defaultClient) {
    defaultClient.disconnect();
    defaultClient = null;
  }
}

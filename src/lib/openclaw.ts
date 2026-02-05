/**
 * OpenClaw Gateway Client
 * Connects Dieter HQ to the OpenClaw gateway for AI chat
 */

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;
const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || 'http://127.0.0.1:18789';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentResponse {
  ok: boolean;
  content?: string;
  error?: string;
}

/**
 * Send a message to the OpenClaw agent via HTTP API
 * This is the simplest integration - stateless HTTP calls
 */
export async function sendToAgent(message: string, sessionId?: string): Promise<AgentResponse> {
  try {
    const response = await fetch(`${GATEWAY_HTTP_URL}/api/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GATEWAY_TOKEN && { 'Authorization': `Bearer ${GATEWAY_TOKEN}` }),
      },
      body: JSON.stringify({
        message,
        sessionId: sessionId || 'dieter-hq',
        channel: 'dieter-hq',
      }),
    });

    if (!response.ok) {
      throw new Error(`Gateway error: ${response.status}`);
    }

    const data = await response.json();
    return {
      ok: true,
      content: data.content || data.reply || data.message,
    };
  } catch (error) {
    console.error('OpenClaw agent error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Stream a response from the OpenClaw agent
 * For real-time token streaming
 */
export async function* streamFromAgent(
  message: string,
  sessionId?: string
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${GATEWAY_HTTP_URL}/api/agent/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(GATEWAY_TOKEN && { 'Authorization': `Bearer ${GATEWAY_TOKEN}` }),
    },
    body: JSON.stringify({
      message,
      sessionId: sessionId || 'dieter-hq',
      channel: 'dieter-hq',
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Gateway error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    yield chunk;
  }
}

/**
 * WebSocket connection for real-time bidirectional communication
 * Use this for live chat with typing indicators, etc.
 */
export class OpenClawConnection {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<(msg: ChatMessage) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnects = 5;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(GATEWAY_URL);
        
        this.ws.onopen = () => {
          console.log('Connected to OpenClaw gateway');
          this.reconnectAttempts = 0;
          this.authenticate();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('Failed to parse gateway message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from OpenClaw gateway');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private authenticate() {
    if (!this.ws) return;
    
    // Send connect handshake per OpenClaw protocol
    this.ws.send(JSON.stringify({
      type: 'req',
      id: crypto.randomUUID(),
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'dieter-hq',
          version: '1.0.0',
          platform: 'web',
          mode: 'operator',
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        auth: GATEWAY_TOKEN ? { token: GATEWAY_TOKEN } : undefined,
      },
    }));
  }

  private handleMessage(data: any) {
    if (data.type === 'event' && data.event === 'agent.chunk') {
      // Streaming token
      this.messageHandlers.forEach(handler => 
        handler({ role: 'assistant', content: data.payload.content })
      );
    } else if (data.type === 'res' && data.payload?.content) {
      // Complete response
      this.messageHandlers.forEach(handler =>
        handler({ role: 'assistant', content: data.payload.content })
      );
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnects) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      this.connect().catch(console.error);
    }, delay);
  }

  send(message: string, sessionId?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to gateway');
    }

    this.ws.send(JSON.stringify({
      type: 'req',
      id: crypto.randomUUID(),
      method: 'agent.chat',
      params: {
        message,
        sessionId: sessionId || 'dieter-hq',
      },
    }));
  }

  onMessage(handler: (msg: ChatMessage) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
let connection: OpenClawConnection | null = null;

export function getOpenClawConnection(): OpenClawConnection {
  if (!connection) {
    connection = new OpenClawConnection();
  }
  return connection;
}

/**
 * OpenClaw WebSocket Protocol Types
 * Protocol Version: 3
 */

// ============================================================================
// Protocol Frames
// ============================================================================

export interface RequestFrame<T = unknown> {
  type: 'req';
  id: string;
  method: string;
  params: T;
}

export interface ResponseFrame<T = unknown> {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: T;
  error?: ProtocolError;
}

export interface EventFrame<T = unknown> {
  type: 'event';
  event: string;
  payload: T;
}

export interface ProtocolError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ProtocolFrame = RequestFrame | ResponseFrame | EventFrame;

// ============================================================================
// Connection & Auth
// ============================================================================

export interface ClientInfo {
  id: string;
  version: string;
  platform: string;
  mode: 'operator' | 'channel';
}

export interface AuthParams {
  token?: string;
  password?: string;
}

export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: ClientInfo;
  role: 'operator' | 'channel';
  scopes: string[];
  auth?: AuthParams;
}

export interface ConnectResponse {
  protocol: number;
  gatewayId: string;
  sessionId: string;
}

// ============================================================================
// Messages
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  tokens?: {
    input?: number;
    output?: number;
  };
  runId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

// ============================================================================
// Chat Session
// ============================================================================

export interface ChatSession {
  key: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatHistoryParams {
  sessionKey: string;
  limit?: number;
  before?: string;
}

export interface ChatHistoryResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface ChatSendParams {
  sessionKey: string;
  content: string;
  attachments?: Attachment[];
}

export interface ChatSendResponse {
  runId: string;
  messageId: string;
}

export interface Attachment {
  type: 'file' | 'image' | 'url';
  name?: string;
  mimeType?: string;
  data?: string; // base64
  url?: string;
}

// ============================================================================
// Streaming Events
// ============================================================================

export interface StreamChunkEvent {
  runId: string;
  sessionKey: string;
  content: string;
  delta: string;
}

export interface StreamCompleteEvent {
  runId: string;
  sessionKey: string;
  message: Message;
}

export interface StreamErrorEvent {
  runId: string;
  sessionKey: string;
  error: ProtocolError;
}

// ============================================================================
// Connection Events
// ============================================================================

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface ConnectionEvent {
  state: ConnectionState;
  error?: Error;
}

// ============================================================================
// Client Configuration
// ============================================================================

export interface OpenClawClientConfig {
  url?: string;
  auth?: AuthParams;
  autoReconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectBaseDelay?: number;
  reconnectMaxDelay?: number;
  requestTimeout?: number;
  clientInfo?: Partial<ClientInfo>;
}

export const DEFAULT_CONFIG: Required<Omit<OpenClawClientConfig, 'auth'>> = {
  url: 'ws://localhost:18789',
  autoReconnect: true,
  reconnectMaxAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  requestTimeout: 60000,
  clientInfo: {
    id: 'dieter-hq',
    version: '1.0.0',
    platform: 'web',
    mode: 'operator',
  },
};

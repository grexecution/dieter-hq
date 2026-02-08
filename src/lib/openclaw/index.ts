/**
 * OpenClaw WebSocket Client Library
 * 
 * @example
 * ```tsx
 * import { useOpenClawConnection, useOpenClawChat } from '@/lib/openclaw';
 * 
 * function ChatComponent() {
 *   const { connected, error } = useOpenClawConnection();
 *   const { messages, send, isStreaming } = useOpenClawChat('my-session');
 *   
 *   if (!connected) return <div>Connecting...</div>;
 *   
 *   return (
 *     <div>
 *       {messages.map(m => <Message key={m.id} {...m} />)}
 *       {isStreaming && <StreamingIndicator />}
 *     </div>
 *   );
 * }
 * ```
 */

// Types
export type {
  // Protocol
  RequestFrame,
  ResponseFrame,
  EventFrame,
  ProtocolError,
  ProtocolFrame,
  
  // Connection
  AuthParams,
  ClientInfo,
  ConnectParams,
  ConnectResponse,
  ConnectionState,
  ConnectionEvent,
  
  // Messages
  Message,
  MessageRole,
  MessageMetadata,
  ToolCall,
  Attachment,
  
  // Chat
  ChatSession,
  ChatHistoryParams,
  ChatHistoryResponse,
  ChatSendParams,
  ChatSendResponse,
  
  // Streaming
  StreamChunkEvent,
  StreamCompleteEvent,
  StreamErrorEvent,
  
  // Config
  OpenClawClientConfig,
} from './types';

export { DEFAULT_CONFIG } from './types';

// Client
export { 
  OpenClawClient,
  getOpenClawClient,
  resetOpenClawClient,
} from './client';

// Hooks
export {
  useOpenClawConnection,
  useOpenClawChat,
  useOpenClawEvent,
  useOpenClawRequest,
} from './hooks';

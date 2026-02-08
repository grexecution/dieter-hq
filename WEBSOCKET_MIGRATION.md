# DieterHQ WebSocket Migration Analysis

**Date:** 2026-02-08  
**Status:** Analysis Complete - Ready for Implementation

## Executive Summary

DieterHQ currently uses the **OpenAI-compatible HTTP API** (`/v1/chat/completions`) to communicate with OpenClaw. This is a **legacy approach** that bypasses the proper Gateway protocol. The correct implementation should use **WebSocket** with the native `chat.send`, `chat.history`, and `chat.inject` methods.

---

## 1. Current Architecture (What's Wrong)

### 1.1 HTTP-Based Implementation

**Files involved:**
- `/src/app/api/chat/route.ts` - Main chat endpoint
- `/src/app/api/chat/send/route.ts` - Streaming SSE endpoint
- `/src/lib/openclaw.ts` - Gateway client (partially WebSocket, mostly unused)

### 1.2 Current Flow

```
┌─────────────────┐    HTTP POST      ┌─────────────────┐    HTTP POST     ┌─────────────────┐
│   DieterHQ UI   │ ───────────────▶  │  Next.js API    │ ──────────────▶  │ OpenClaw Gateway│
│   (React/SSE)   │    /api/chat/     │    Routes       │  /v1/chat/       │   (Port 18789)  │
└─────────────────┘    send           └─────────────────┘  completions     └─────────────────┘
```

### 1.3 Problems with Current Approach

| Problem | Description |
|---------|-------------|
| **Double Hop** | Browser → Next.js API → Gateway (adds latency) |
| **No Native Events** | Misses `agent` events (tool calls, thinking indicators) |
| **SSE Hack** | Uses HTTP SSE to simulate streaming, but this is inferior to native WS events |
| **Session Mismatch** | Session key format is custom (`agent:main:dieter-hq:threadId`) instead of using proper Gateway session routing |
| **No Real-time Status** | Can't receive `presence`, `health`, `tick` events |
| **Duplicated State** | Messages stored in local SQLite DB instead of using Gateway's session store |
| **Auth Complexity** | Bearer token over HTTP instead of proper device identity |

### 1.4 Code Evidence

From `/src/app/api/chat/send/route.ts`:
```typescript
// ❌ Using OpenAI-compatible endpoint
const response = await fetch(`${GATEWAY_HTTP_URL}/v1/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(GATEWAY_PASSWORD && { 'Authorization': `Bearer ${GATEWAY_PASSWORD}` }),
    'x-openclaw-agent-id': agentId,
    'x-openclaw-session-key': `agent:${agentId}:dieter-hq:${threadId}`,
  },
  body: JSON.stringify({
    model: `openclaw:${agentId}`,
    messages: infiniteContextResult.contextMessages,
    stream: true,
  }),
});
```

From `/src/lib/openclaw.ts`:
```typescript
// ❌ WebSocket client exists but is incomplete/unused
// Uses wrong method name 'agent.chat' instead of 'chat.send'
this.ws.send(JSON.stringify({
  type: 'req',
  id: crypto.randomUUID(),
  method: 'agent.chat',  // ❌ Wrong method!
  params: {
    message,
    sessionId: sessionId || 'dieter-hq',
  },
}));
```

---

## 2. Target Architecture (WebSocket)

### 2.1 Correct Flow

```
┌─────────────────┐    WebSocket      ┌─────────────────┐
│   DieterHQ UI   │ ◀═══════════════▶ │ OpenClaw Gateway│
│   (React)       │   Port 18789      │   (Native WS)   │
└─────────────────┘                   └─────────────────┘
        │
        └── Direct connection, no Next.js middleware!
```

### 2.2 Gateway Protocol Methods

| Method | Purpose | Request Params | Response |
|--------|---------|----------------|----------|
| `chat.history` | Fetch conversation history | `{ sessionKey, limit?, before? }` | `{ messages: [...] }` |
| `chat.send` | Send a message (non-blocking) | `{ sessionKey, message, idempotencyKey }` | `{ runId, status: "started" }` |
| `chat.abort` | Stop ongoing response | `{ sessionKey }` or `{ runId }` | `{ ok: true }` |
| `chat.inject` | Add assistant note (no AI run) | `{ sessionKey, content }` | `{ ok: true }` |

### 2.3 Gateway Events

| Event | When | Payload |
|-------|------|---------|
| `chat` | Message delta during streaming | `{ sessionKey, delta, role }` |
| `agent` | Tool calls, thinking, status | `{ type: "tool-start"\|"tool-end"\|..., ... }` |
| `presence` | Connection status changes | `{ entries: [...] }` |
| `tick` | Keepalive (every 15-30s) | `{ ts }` |
| `health` | Gateway health updates | `{ ok, memory, sessions }` |

### 2.4 Session Key Format

**Correct format:** `agent:<agentId>:<sessionName>`

Examples:
- `agent:main:dieter-hq` (main agent, dieter-hq session)
- `agent:coder:dieter-hq` (coder agent, dieter-hq session)
- `agent:main:dieter-hq:life` (life context thread)

---

## 3. Required Changes

### 3.1 Frontend Changes

#### A. Create WebSocket Client Hook

```typescript
// src/hooks/useOpenClawWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

interface OpenClawWSState {
  connected: boolean;
  messages: ChatMessage[];
  streaming: string | null;
  sendMessage: (content: string) => Promise<void>;
  abort: () => void;
}

export function useOpenClawWebSocket(sessionKey: string): OpenClawWSState {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const pendingRequests = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    const gatewayUrl = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_WS || 'ws://127.0.0.1:18789';
    const token = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN;
    
    const socket = new WebSocket(gatewayUrl);
    ws.current = socket;

    socket.onopen = () => {
      // Step 1: Send connect handshake
      const connectId = crypto.randomUUID();
      socket.send(JSON.stringify({
        type: 'req',
        id: connectId,
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
          auth: token ? { token } : undefined,
        },
      }));

      pendingRequests.current.set(connectId, (res) => {
        if (res.ok) {
          setConnected(true);
          // Fetch history after connect
          fetchHistory();
        }
      });
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === 'res') {
        const handler = pendingRequests.current.get(msg.id);
        if (handler) {
          handler(msg);
          pendingRequests.current.delete(msg.id);
        }
      } else if (msg.type === 'event') {
        handleEvent(msg);
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [sessionKey]);

  const request = useCallback((method: string, params: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'));
        return;
      }

      const id = crypto.randomUUID();
      pendingRequests.current.set(id, (res) => {
        if (res.ok) resolve(res.payload);
        else reject(new Error(res.error?.message || 'Request failed'));
      });

      ws.current.send(JSON.stringify({
        type: 'req',
        id,
        method,
        params,
      }));
    });
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const result = await request('chat.history', { sessionKey, limit: 100 });
      setMessages(result.messages || []);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    }
  }, [sessionKey, request]);

  const handleEvent = useCallback((msg: any) => {
    if (msg.event === 'chat') {
      const { delta, done, sessionKey: eventSession } = msg.payload;
      if (eventSession !== sessionKey) return;

      if (delta) {
        setStreaming((prev) => (prev || '') + delta);
      }
      if (done) {
        // Streaming complete, add final message
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: streaming || delta || '',
          createdAt: Date.now(),
        }]);
        setStreaming(null);
      }
    } else if (msg.event === 'agent') {
      // Handle tool calls, thinking indicators, etc.
      console.log('Agent event:', msg.payload);
    }
  }, [sessionKey, streaming]);

  const sendMessage = useCallback(async (content: string) => {
    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming('');

    try {
      await request('chat.send', {
        sessionKey,
        message: content,
        idempotencyKey: crypto.randomUUID(),
      });
      // Response will come via 'chat' events
    } catch (e) {
      console.error('Failed to send:', e);
      setStreaming(null);
    }
  }, [sessionKey, request]);

  const abort = useCallback(async () => {
    try {
      await request('chat.abort', { sessionKey });
      setStreaming(null);
    } catch (e) {
      console.error('Failed to abort:', e);
    }
  }, [sessionKey, request]);

  return { connected, messages, streaming, sendMessage, abort };
}
```

#### B. Update ChatView Component

```typescript
// In ChatView.tsx - replace HTTP-based approach
import { useOpenClawWebSocket } from '@/hooks/useOpenClawWebSocket';

export function ChatView({ activeThreadId }: { activeThreadId: string }) {
  const sessionKey = `agent:main:dieter-hq:${activeThreadId}`;
  const { connected, messages, streaming, sendMessage, abort } = useOpenClawWebSocket(sessionKey);

  // ... rest of component uses messages and streaming directly
}
```

### 3.2 Backend Changes (Can Be Removed!)

Once WebSocket is implemented, these files become **obsolete**:

| File | Action |
|------|--------|
| `/src/app/api/chat/route.ts` | DELETE or repurpose for history only |
| `/src/app/api/chat/send/route.ts` | DELETE |
| `/src/app/api/chat/poll/route.ts` | DELETE |
| `/src/app/api/stream/route.ts` | DELETE |
| `/src/lib/openclaw.ts` | REWRITE with correct protocol |

**Note:** The local SQLite database for messages can be kept as a cache/backup, but the Gateway's session store becomes the source of truth.

### 3.3 Environment Variables

```env
# New (frontend-accessible)
NEXT_PUBLIC_OPENCLAW_GATEWAY_WS=ws://127.0.0.1:18789
NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN=<your-token>

# Remove (backend-only, no longer needed)
# OPENCLAW_GATEWAY_HTTP_URL=http://127.0.0.1:18789
# OPENCLAW_GATEWAY_PASSWORD=...
```

---

## 4. Migration Steps

### Phase 1: Implement WebSocket Client (1-2 days)
1. Create `useOpenClawWebSocket` hook
2. Add proper connect handshake with device identity
3. Implement `chat.history` fetch
4. Implement `chat.send` with idempotency key
5. Handle `chat` and `agent` events

### Phase 2: Update UI Components (1 day)
1. Replace HTTP fetch in ChatView with WebSocket hook
2. Handle streaming state from events (not SSE)
3. Add connection status indicator
4. Add abort button (calls `chat.abort`)

### Phase 3: Add Agent Events (1 day)
1. Parse `agent` events for tool calls
2. Show tool execution cards (reading files, web search, etc.)
3. Display thinking indicators

### Phase 4: Cleanup (0.5 days)
1. Remove obsolete API routes
2. Update environment variables
3. Test on production (Vercel → local gateway via Tailscale)

### Phase 5: Advanced Features (optional)
1. Device pairing for remote access
2. Multiple session support
3. `chat.inject` for system notes

---

## 5. Code Examples

### 5.1 Minimal Connect + Send

```typescript
const ws = new WebSocket('ws://127.0.0.1:18789');

ws.onopen = () => {
  // Must send connect first!
  ws.send(JSON.stringify({
    type: 'req',
    id: 'connect-1',
    method: 'connect',
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      client: { id: 'dieter-hq', version: '1.0.0', platform: 'web', mode: 'operator' },
      role: 'operator',
      scopes: ['operator.read', 'operator.write'],
    },
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'res' && msg.id === 'connect-1' && msg.ok) {
    console.log('Connected!');
    
    // Now can send chat
    ws.send(JSON.stringify({
      type: 'req',
      id: 'chat-1',
      method: 'chat.send',
      params: {
        sessionKey: 'agent:main:dieter-hq',
        message: 'Hello!',
        idempotencyKey: crypto.randomUUID(),
      },
    }));
  }
  
  if (msg.type === 'event' && msg.event === 'chat') {
    console.log('Chat delta:', msg.payload.delta);
  }
};
```

### 5.2 Fetch Chat History

```typescript
ws.send(JSON.stringify({
  type: 'req',
  id: 'history-1',
  method: 'chat.history',
  params: {
    sessionKey: 'agent:main:dieter-hq',
    limit: 50,
  },
}));

// Response:
// { type: 'res', id: 'history-1', ok: true, payload: { messages: [...] } }
```

### 5.3 Abort Running Request

```typescript
ws.send(JSON.stringify({
  type: 'req',
  id: 'abort-1',
  method: 'chat.abort',
  params: {
    sessionKey: 'agent:main:dieter-hq',
  },
}));
```

---

## 6. Testing Checklist

- [ ] Connect to Gateway WebSocket
- [ ] Authenticate with token
- [ ] Fetch chat history
- [ ] Send message and receive streaming response
- [ ] Handle `agent` events (tool calls)
- [ ] Abort running request
- [ ] Handle disconnect/reconnect
- [ ] Test with remote Gateway (Tailscale)

---

## 7. References

- [OpenClaw Control UI Docs](/opt/homebrew/lib/node_modules/openclaw/docs/web/control-ui.md)
- [Gateway Protocol](/opt/homebrew/lib/node_modules/openclaw/docs/gateway/protocol.md)
- [TypeBox Schemas](/opt/homebrew/lib/node_modules/openclaw/docs/concepts/typebox.md)
- [WebChat Docs](/opt/homebrew/lib/node_modules/openclaw/docs/web/webchat.md)

---

## 8. Summary

The current HTTP-based implementation adds unnecessary complexity (double-hop, SSE simulation, duplicated state). The WebSocket approach is:

1. **Simpler** - Direct browser → Gateway connection
2. **Faster** - No middleware latency
3. **Richer** - Native events for tool calls, streaming, status
4. **Correct** - Uses the official Gateway protocol

Estimated effort: **3-4 days** for full migration.

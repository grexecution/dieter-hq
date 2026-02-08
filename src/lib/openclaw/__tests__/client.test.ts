/**
 * OpenClawClient Unit Tests
 * 
 * These tests use a mock WebSocket to test the client behavior
 * without needing an actual OpenClaw gateway.
 * 
 * Run with: npx tsx src/lib/openclaw/__tests__/client.test.ts
 * Or install vitest/jest for proper test runner support.
 */

import { OpenClawClient } from '../client';
import type { ConnectionState, Message } from '../types';

// =============================================================================
// Mock WebSocket
// =============================================================================

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;

  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  private sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }

  send(data: string): void {
    this.sentMessages.push(data);
    
    // Auto-respond to connect request
    const parsed = JSON.parse(data);
    if (parsed.method === 'connect') {
      setTimeout(() => {
        this.simulateResponse(parsed.id, {
          protocol: 3,
          gatewayId: 'test-gateway',
          sessionId: 'test-session-123',
        });
      }, 5);
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: code ?? 1000, reason: reason ?? '' });
  }

  // Test helpers
  getSentMessages(): string[] {
    return this.sentMessages;
  }

  getLastSentMessage(): unknown {
    const last = this.sentMessages[this.sentMessages.length - 1];
    return last ? JSON.parse(last) : null;
  }

  simulateResponse(id: string, payload: unknown): void {
    this.onmessage?.({
      data: JSON.stringify({
        type: 'res',
        id,
        ok: true,
        payload,
      }),
    });
  }

  simulateError(id: string, code: string, message: string): void {
    this.onmessage?.({
      data: JSON.stringify({
        type: 'res',
        id,
        ok: false,
        error: { code, message },
      }),
    });
  }

  simulateEvent(event: string, payload: unknown): void {
    this.onmessage?.({
      data: JSON.stringify({
        type: 'event',
        event,
        payload,
      }),
    });
  }

  simulateDisconnect(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1006, reason: 'Connection lost' });
  }
}

// Replace global WebSocket
const originalWebSocket = globalThis.WebSocket;

function mockWebSocket(): MockWebSocket | null {
  let lastInstance: MockWebSocket | null = null;
  
  (globalThis as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      lastInstance = this;
    }
  };

  return lastInstance;
}

function getLastMockWs(): MockWebSocket | null {
  return (globalThis as unknown as { lastMockWs?: MockWebSocket }).lastMockWs ?? null;
}

function restoreWebSocket(): void {
  globalThis.WebSocket = originalWebSocket;
}

// =============================================================================
// Test Utilities
// =============================================================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Tests
// =============================================================================

let mockWs: MockWebSocket | null = null;
let capturedWs: MockWebSocket | null = null;

async function testConnectsWithTokenAuth(): Promise<void> {
  console.log('Testing: connects with token auth...');

  // Setup mock
  (globalThis as unknown as Record<string, unknown>).WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      capturedWs = this;
    }
  };

  const client = new OpenClawClient({
    url: 'ws://test:8080',
    auth: { token: 'test-token-123' },
    autoReconnect: false,
  });

  await client.connect();

  assert(client.connected, 'Client should be connected');
  assertEqual(client.state, 'connected', 'State should be connected');

  // Check that connect request included auth
  const lastMsg = capturedWs?.getLastSentMessage() as Record<string, unknown>;
  assert(lastMsg?.method === 'connect', 'Should send connect request');
  assert(
    (lastMsg?.params as Record<string, unknown>)?.auth !== undefined,
    'Should include auth params'
  );

  client.disconnect();
  console.log('✓ connects with token auth');
}

async function testReconnectsOnDisconnect(): Promise<void> {
  console.log('Testing: reconnects on disconnect...');

  let connectionCount = 0;
  
  (globalThis as unknown as Record<string, unknown>).WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      capturedWs = this;
      connectionCount++;
    }
  };

  const client = new OpenClawClient({
    url: 'ws://test:8080',
    autoReconnect: true,
    reconnectBaseDelay: 50, // Fast for testing
    reconnectMaxAttempts: 3,
  });

  await client.connect();
  assertEqual(connectionCount, 1, 'Initial connection');

  // Simulate disconnect
  capturedWs?.simulateDisconnect();
  
  // Wait for reconnect attempt
  await wait(100);
  
  // Should have attempted reconnect
  assert(connectionCount >= 2 || client.state === 'reconnecting', 
    'Should attempt reconnect');

  client.disconnect();
  console.log('✓ reconnects on disconnect');
}

async function testHandlesRequestResponse(): Promise<void> {
  console.log('Testing: handles request/response...');

  (globalThis as unknown as Record<string, unknown>).WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      capturedWs = this;
    }
  };

  const client = new OpenClawClient({
    url: 'ws://test:8080',
    autoReconnect: false,
  });

  await client.connect();

  // Make a chat.history request
  const historyPromise = client.chatHistory('test-session');
  
  // Wait for request to be sent
  await wait(10);

  // Get the request ID from sent message
  const msgs = capturedWs?.getSentMessages() ?? [];
  const historyReq = msgs
    .map((m) => JSON.parse(m))
    .find((m) => m.method === 'chat.history');

  assert(historyReq !== undefined, 'Should send chat.history request');

  // Simulate response
  const mockMessages: Message[] = [
    { id: '1', role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
    { id: '2', role: 'assistant', content: 'Hi there!', timestamp: new Date().toISOString() },
  ];

  capturedWs?.simulateResponse(historyReq.id, {
    messages: mockMessages,
    hasMore: false,
  });

  const result = await historyPromise;
  assertEqual(result.length, 2, 'Should receive 2 messages');
  assertEqual(result[0].content, 'Hello', 'First message content');

  client.disconnect();
  console.log('✓ handles request/response');
}

async function testReceivesEvents(): Promise<void> {
  console.log('Testing: receives events...');

  (globalThis as unknown as Record<string, unknown>).WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      capturedWs = this;
    }
  };

  const client = new OpenClawClient({
    url: 'ws://test:8080',
    autoReconnect: false,
  });

  await client.connect();

  // Subscribe to events
  let chunkReceived = false;
  let chunkContent = '';

  const unsubscribe = client.onStreamChunk((event) => {
    chunkReceived = true;
    chunkContent = event.content;
  });

  // Simulate streaming event
  capturedWs?.simulateEvent('chat.chunk', {
    runId: 'run-1',
    sessionKey: 'session-1',
    content: 'Hello world',
    delta: 'world',
  });

  await wait(10);

  assert(chunkReceived, 'Should receive chunk event');
  assertEqual(chunkContent, 'Hello world', 'Chunk content');

  unsubscribe();
  client.disconnect();
  console.log('✓ receives events');
}

async function testCleansUpOnDisconnect(): Promise<void> {
  console.log('Testing: cleans up on disconnect...');

  (globalThis as unknown as Record<string, unknown>).WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      capturedWs = this;
    }
  };

  const client = new OpenClawClient({
    url: 'ws://test:8080',
    autoReconnect: false,
  });

  await client.connect();
  assert(client.connected, 'Should be connected');

  // Make a request that will be pending
  const requestPromise = client.request('test.method', {});

  // Disconnect before response
  client.disconnect();

  // Request should be rejected
  let rejected = false;
  try {
    await requestPromise;
  } catch (error) {
    rejected = true;
    assert(
      (error as Error).message.includes('disconnect'),
      'Error should mention disconnect'
    );
  }

  assert(rejected, 'Pending request should be rejected');
  assert(!client.connected, 'Should be disconnected');
  assertEqual(client.state, 'disconnected', 'State should be disconnected');

  console.log('✓ cleans up on disconnect');
}

async function testConnectionStateChanges(): Promise<void> {
  console.log('Testing: connection state changes...');

  (globalThis as unknown as Record<string, unknown>).WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url);
      capturedWs = this;
    }
  };

  const client = new OpenClawClient({
    url: 'ws://test:8080',
    autoReconnect: false,
  });

  const states: ConnectionState[] = [];
  
  client.onConnectionChange((state) => {
    states.push(state);
  });

  assertEqual(client.state, 'disconnected', 'Initial state');
  
  await client.connect();
  
  assert(states.includes('connecting'), 'Should have connecting state');
  assert(states.includes('connected'), 'Should have connected state');

  client.disconnect();
  
  assert(states.includes('disconnected'), 'Should have disconnected state');
  
  console.log('✓ connection state changes');
}

// =============================================================================
// Test Runner
// =============================================================================

async function runTests(): Promise<void> {
  console.log('\n=== OpenClawClient Unit Tests ===\n');

  const tests = [
    testConnectsWithTokenAuth,
    testReconnectsOnDisconnect,
    testHandlesRequestResponse,
    testReceivesEvents,
    testCleansUpOnDisconnect,
    testConnectionStateChanges,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      failed++;
      console.error(`✗ ${test.name}:`, (error as Error).message);
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

  // Restore original WebSocket
  restoreWebSocket();

  if (failed > 0) {
    process.exit(1);
  }
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

export { runTests };

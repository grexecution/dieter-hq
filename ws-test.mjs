#!/usr/bin/env node
/**
 * Simple WebSocket connection test for OpenClaw Gateway
 */

import { WebSocket } from 'ws';

const WS_URL = 'wss://mac-mini-von-dieter.tail954ecb.ts.net';
const PASSWORD = '70523edcf5ee7c0b822b028427ee7e0cbdb41a36d9ce914f';

console.log('🔌 Connecting to:', WS_URL);

const ws = new WebSocket(WS_URL, {
  headers: {
    'Origin': 'http://localhost:3000'
  }
});

ws.on('open', () => {
  console.log('✅ WebSocket connected, waiting for challenge...');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('📨 Received:', JSON.stringify(msg, null, 2));
  
  // Handle challenge
  if (msg.type === 'event' && msg.event === 'connect.challenge') {
    console.log('🔑 Received challenge, sending auth...');
    
    const connectReq = {
      type: 'req',
      id: 'test-' + Date.now(),
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
        auth: { password: PASSWORD }
      }
    };
    
    ws.send(JSON.stringify(connectReq));
    console.log('📤 Sent connect request');
  }
  
  // Handle connect response
  if (msg.type === 'res') {
    if (msg.ok) {
      console.log('🎉 Authenticated successfully!');
      console.log('✅ WebSocket integration working!');
      
      // Test a simple request
      const statusReq = {
        type: 'req',
        id: 'status-' + Date.now(),
        method: 'status',
        params: {}
      };
      ws.send(JSON.stringify(statusReq));
      console.log('📤 Sent status request');
    } else {
      console.error('❌ Auth failed:', msg.error);
      process.exit(1);
    }
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Connection closed: ${code} ${reason}`);
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏱️ Test timeout, closing...');
  ws.close();
}, 10000);

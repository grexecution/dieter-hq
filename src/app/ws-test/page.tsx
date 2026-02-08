'use client';

/**
 * Simple WebSocket Test Page (no DB required)
 */

import { useEffect, useState } from 'react';
import { getOpenClawClient } from '@/lib/openclaw/client';
import { useOpenClawConnection } from '@/lib/openclaw/hooks';

export default function WsTestPage() {
  const [envInfo, setEnvInfo] = useState<{
    url: string | undefined;
    hasPassword: boolean;
    hasToken: boolean;
  } | null>(null);
  
  const connection = useOpenClawConnection();
  
  useEffect(() => {
    console.log('[WS-Test] Page mounted');
    console.log('[WS-Test] ENV URL:', process.env.NEXT_PUBLIC_OPENCLAW_WS_URL);
    console.log('[WS-Test] Has Password:', !!process.env.NEXT_PUBLIC_OPENCLAW_PASSWORD);
    console.log('[WS-Test] Has Token:', !!process.env.NEXT_PUBLIC_OPENCLAW_TOKEN);
    
    setEnvInfo({
      url: process.env.NEXT_PUBLIC_OPENCLAW_WS_URL,
      hasPassword: !!process.env.NEXT_PUBLIC_OPENCLAW_PASSWORD,
      hasToken: !!process.env.NEXT_PUBLIC_OPENCLAW_TOKEN,
    });
    
    // Try to get client
    try {
      const client = getOpenClawClient();
      console.log('[WS-Test] Client created:', client);
    } catch (e) {
      console.error('[WS-Test] Client error:', e);
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">🔌 WebSocket Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <h2 className="font-medium text-zinc-400 mb-2">ENV Variables</h2>
          {envInfo ? (
            <ul className="space-y-1 text-sm font-mono">
              <li>URL: {envInfo.url || '❌ NOT SET'}</li>
              <li>Password: {envInfo.hasPassword ? '✅ Set' : '❌ Not set'}</li>
              <li>Token: {envInfo.hasToken ? '✅ Set' : '❌ Not set'}</li>
            </ul>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <h2 className="font-medium text-zinc-400 mb-2">Connection State</h2>
          <ul className="space-y-1 text-sm font-mono">
            <li>State: {connection.state}</li>
            <li>Connected: {connection.connected ? '✅ Yes' : '❌ No'}</li>
            <li>Connecting: {connection.connecting ? '🔄 Yes' : 'No'}</li>
            <li>Reconnecting: {connection.reconnecting ? '🔄 Yes' : 'No'}</li>
            <li>Error: {connection.error?.message || 'None'}</li>
          </ul>
        </div>
        
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <h2 className="font-medium text-zinc-400 mb-2">Instructions</h2>
          <p className="text-sm text-zinc-500">
            Open DevTools Console to see [OpenClaw] and [WS-Test] logs.
          </p>
        </div>
      </div>
    </div>
  );
}

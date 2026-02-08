'use client';

/**
 * DEBUG PAGE - Shows what ENV values the browser actually sees
 * Remove after debugging
 */
export default function DebugEnvPage() {
  const wsUrl = process.env.NEXT_PUBLIC_OPENCLAW_WS_URL;
  const token = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN;
  const password = process.env.NEXT_PUBLIC_OPENCLAW_PASSWORD;

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">ENV Debug</h1>
      
      <div className="space-y-2">
        <div>
          <span className="text-zinc-500">NEXT_PUBLIC_OPENCLAW_WS_URL:</span>
          <span className={wsUrl ? 'text-green-500' : 'text-red-500'}>
            {' '}{wsUrl || '(not set)'}
          </span>
          <span className="text-zinc-400"> ({wsUrl?.length || 0} chars)</span>
        </div>
        
        <div>
          <span className="text-zinc-500">NEXT_PUBLIC_OPENCLAW_TOKEN:</span>
          <span className={token ? 'text-green-500' : 'text-red-500'}>
            {' '}{token ? `${token.slice(0,8)}...${token.slice(-4)}` : '(not set)'}
          </span>
          <span className="text-zinc-400"> ({token?.length || 0} chars)</span>
        </div>

        <div>
          <span className="text-zinc-500">NEXT_PUBLIC_OPENCLAW_PASSWORD:</span>
          <span className={password ? 'text-green-500' : 'text-red-500'}>
            {' '}{password ? `${password.slice(0,4)}...` : '(not set)'}
          </span>
          <span className="text-zinc-400"> ({password?.length || 0} chars)</span>
        </div>
      </div>

      <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded">
        <h2 className="font-bold mb-2">Expected values:</h2>
        <ul className="list-disc ml-4 space-y-1">
          <li>WS_URL: <code>wss://mac-mini-von-dieter.tail954ecb.ts.net</code> (45 chars)</li>
          <li>TOKEN: Gateway password (13 chars for DieterHQ2026!)</li>
        </ul>
      </div>
    </div>
  );
}

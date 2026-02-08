"use client";

import { useEffect, useState } from "react";
import { useOpenClawConnection, useOpenClawChat } from "@/lib/openclaw/hooks";

export default function WSTestPage() {
  const connection = useOpenClawConnection();
  const [sessionKey] = useState("agent:main:dieter-hq:test");
  const chat = useOpenClawChat(sessionKey);
  const [logs, setLogs] = useState<string[]>([]);
  
  const log = (msg: string) => {
    const ts = new Date().toISOString().split("T")[1].slice(0, 8);
    setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
  };

  useEffect(() => {
    log(`Connection state: ${connection.state}`);
    if (connection.connected) {
      log("✅ WebSocket connected and authenticated!");
    }
    if (connection.error) {
      log(`❌ Error: ${connection.error.message}`);
    }
  }, [connection.state, connection.connected, connection.error]);

  useEffect(() => {
    if (chat.messages.length > 0) {
      log(`📥 Got ${chat.messages.length} messages from history`);
    }
    if (chat.isStreaming) {
      log(`🔄 Streaming: ${chat.streamingContent?.slice(0, 50) || "..."}`);
    }
    if (chat.error) {
      log(`❌ Chat error: ${chat.error.message}`);
    }
  }, [chat.messages, chat.isStreaming, chat.streamingContent, chat.error]);

  const [testMsg, setTestMsg] = useState("");

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">WebSocket Test</h1>
      
      <div className="mb-6 p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-900">
        <h2 className="font-semibold mb-2">Connection Status</h2>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${
            connection.connected ? "bg-green-500" : 
            connection.connecting || connection.reconnecting ? "bg-yellow-500 animate-pulse" :
            "bg-red-500"
          }`} />
          <span className="font-mono">
            {connection.connected ? "Connected ✅" : 
             connection.connecting ? "Connecting..." :
             connection.reconnecting ? "Reconnecting..." :
             "Disconnected ❌"}
          </span>
        </div>
        {connection.error && (
          <p className="text-red-500 text-sm mt-2">{connection.error.message}</p>
        )}
      </div>

      <div className="mb-6 p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-900">
        <h2 className="font-semibold mb-2">Config</h2>
        <p className="font-mono text-sm">
          URL: {process.env.NEXT_PUBLIC_OPENCLAW_WS_URL || "not set"}<br/>
          Password: {process.env.NEXT_PUBLIC_OPENCLAW_PASSWORD ? "****" + process.env.NEXT_PUBLIC_OPENCLAW_PASSWORD.slice(-4) : "not set"}
        </p>
      </div>

      <div className="mb-6 p-4 rounded-lg border bg-zinc-50 dark:bg-zinc-900">
        <h2 className="font-semibold mb-2">Send Test Message</h2>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            placeholder="Type a test message..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button 
            onClick={() => {
              if (testMsg.trim()) {
                log(`📤 Sending: ${testMsg}`);
                chat.send(testMsg).then(() => {
                  log("✅ Message sent!");
                  setTestMsg("");
                }).catch((e) => {
                  log(`❌ Send failed: ${e.message}`);
                });
              }
            }}
            disabled={!connection.connected || !testMsg.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      <div className="p-4 rounded-lg border bg-black text-green-400 font-mono text-xs max-h-64 overflow-y-auto">
        <h2 className="text-white mb-2">Logs</h2>
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

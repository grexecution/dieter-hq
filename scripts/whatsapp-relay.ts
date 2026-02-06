#!/usr/bin/env npx tsx
/**
 * WhatsApp Relay Service
 * 
 * Runs on Mac Mini, receives HTTP requests from Vercel, sends via wacli.
 * 
 * Usage: npx tsx scripts/whatsapp-relay.ts
 * 
 * Environment:
 *   PORT - Port to listen on (default: 18792)
 *   RELAY_SECRET - Shared secret for auth (required)
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const PORT = parseInt(process.env.PORT || "18792", 10);
const RELAY_SECRET = process.env.RELAY_SECRET;

if (!RELAY_SECRET) {
  console.error("❌ RELAY_SECRET environment variable is required");
  process.exit(1);
}

interface SendRequest {
  to: string;
  message: string;
  secret: string;
}

async function sendWhatsApp(to: string, message: string): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  try {
    const escapedMessage = message.replace(/'/g, "'\\''");
    const escapedTo = to.replace(/'/g, "'\\''");
    
    // Ensure JID format
    const jid = escapedTo.includes("@") ? escapedTo : `${escapedTo}@s.whatsapp.net`;
    
    const cmd = `/opt/homebrew/bin/wacli send '${jid}' '${escapedMessage}'`;
    
    console.log(`[relay] Sending to ${jid}: ${message.slice(0, 50)}...`);
    
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 30000,
      env: { ...process.env, PATH: process.env.PATH + ":/opt/homebrew/bin:/usr/local/bin" },
    });
    
    if (stderr && !stderr.includes("warning")) {
      console.warn("[relay] stderr:", stderr);
    }
    
    console.log("[relay] Success:", stdout.trim());
    
    const messageIdMatch = stdout.match(/message[_-]?id[:\s]+([A-Za-z0-9]+)/i);
    
    return { ok: true, messageId: messageIdMatch?.[1] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[relay] Error:", msg);
    return { ok: false, error: msg };
  }
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (req.method !== "POST" || req.url !== "/send") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use POST /send" }));
    return;
  }
  
  try {
    const body = await parseBody(req);
    const data: SendRequest = JSON.parse(body);
    
    // Auth check
    if (data.secret !== RELAY_SECRET) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
    
    if (!data.to || !data.message) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing 'to' or 'message'" }));
      return;
    }
    
    const result = await sendWhatsApp(data.to, data.message);
    
    res.writeHead(result.ok ? 200 : 500, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error("[relay] Request error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 WhatsApp Relay listening on http://localhost:${PORT}`);
  console.log(`   POST /send { to, message, secret }`);
});

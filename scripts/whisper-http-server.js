#!/usr/bin/env node
/**
 * Simple HTTP server wrapper for local whisper transcription
 * 
 * Runs on Mac Mini, exposes /transcribe endpoint
 * Called by DieterHQ on Vercel for voice message transcription
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.WHISPER_PORT || 8082;
const AUTH_TOKEN = process.env.OPENCLAW_GATEWAY_PASSWORD || 'DieterHQ2026!';
const TRANSCRIBE_SCRIPT = path.join(__dirname, 'transcribe-local.sh');

function parseMultipart(buffer, boundary) {
  const parts = {};
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  
  let start = buffer.indexOf(boundaryBuffer);
  while (start !== -1) {
    const end = buffer.indexOf(boundaryBuffer, start + boundaryBuffer.length);
    if (end === -1) break;
    
    const part = buffer.slice(start + boundaryBuffer.length, end);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      start = end;
      continue;
    }
    
    const headers = part.slice(0, headerEnd).toString();
    const body = part.slice(headerEnd + 4);
    
    // Remove trailing \r\n
    const cleanBody = body.slice(0, body.length - 2);
    
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    
    if (nameMatch) {
      parts[nameMatch[1]] = {
        data: cleanBody,
        filename: filenameMatch ? filenameMatch[1] : null
      };
    }
    
    start = end;
  }
  
  return parts;
}

async function transcribe(audioBuffer, language = 'de') {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), `whisper-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`);
    
    fs.writeFileSync(tmpFile, audioBuffer);
    
    const proc = spawn('bash', [TRANSCRIBE_SCRIPT, tmpFile, language]);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      // Cleanup
      try { fs.unlinkSync(tmpFile); } catch {}
      
      if (code !== 0) {
        reject(new Error(`Transcription failed (code ${code}): ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
    
    proc.on('error', (err) => {
      try { fs.unlinkSync(tmpFile); } catch {}
      reject(err);
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'whisper-http' }));
    return;
  }
  
  // Transcription endpoint
  if (req.method === 'POST' && req.url?.startsWith('/transcribe')) {
    // Check auth
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'unauthorized' }));
      return;
    }
    
    // Parse URL for language param
    const url = new URL(req.url, `http://${req.headers.host}`);
    const language = url.searchParams.get('language') || 'de';
    
    // Collect body
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks);
        
        // Parse multipart form data
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=([^;]+)/);
        
        if (!boundaryMatch) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'missing boundary in content-type' }));
          return;
        }
        
        const parts = parseMultipart(body, boundaryMatch[1]);
        const audioPart = parts.audio;
        
        if (!audioPart || !audioPart.data || audioPart.data.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'missing audio data' }));
          return;
        }
        
        console.log(`[whisper] Transcribing ${audioPart.data.length} bytes, language=${language}`);
        
        const text = await transcribe(audioPart.data, language);
        
        console.log(`[whisper] Result: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, text }));
        
      } catch (err) {
        console.error('[whisper] Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }
  
  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[whisper-http] Server running on port ${PORT}`);
  console.log(`[whisper-http] Transcribe endpoint: POST /transcribe?language=de`);
  console.log(`[whisper-http] Health check: GET /health`);
});

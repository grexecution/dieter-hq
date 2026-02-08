# OpenClaw WebChat Research

Research into connecting to OpenClaw Gateway WebSocket from an external browser (https://dieter.dergreg.com) via Tailscale.

## Summary

OpenClaw's Gateway uses a WebSocket-based protocol for all clients (CLI, WebChat UI, macOS app, etc.). Cross-origin browser connections require explicit configuration due to security measures.

---

## Key Findings

### 1. WebSocket Protocol Overview

**Source:** `/gateway/protocol.md`

- Transport: WebSocket with JSON text frames
- Port: Default `18789` (multiplex for WS + HTTP)
- First frame MUST be a `connect` request

**Connect Handshake Flow:**

1. Gateway sends `connect.challenge` event with nonce
2. Client sends `connect` request with protocol version, client info, device identity, and auth
3. Gateway responds with `hello-ok` (includes deviceToken if pairing successful)

**Example Connect Request:**
```json
{
  "type": "req",
  "id": "...",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "webchat",
      "version": "1.0.0",
      "platform": "web",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "auth": { "token": "..." },
    "device": {
      "id": "device_fingerprint",
      "publicKey": "...",
      "signature": "...",
      "signedAt": 1737264000000,
      "nonce": "..."
    }
  }
}
```

### 2. Cross-Origin / CORS Configuration

**Source:** `/web/control-ui.md`, `/web/index.md`

**⚠️ CRITICAL: `allowedOrigins` Configuration Required**

The Control UI sends anti-clickjacking headers and **only accepts same-origin browser WebSocket connections** unless `gateway.controlUi.allowedOrigins` is explicitly set.

**Required Configuration for External Domain:**
```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["https://dieter.dergreg.com"]
    }
  }
}
```

Without this, the WebSocket connection will be rejected.

### 3. HTTPS/HTTP Context Issues

**Source:** `/gateway/troubleshooting.md`, `/web/control-ui.md`

**Problem:** When a browser opens a page over plain HTTP:
- The browser runs in a **non-secure context**
- **WebCrypto is blocked** → cannot generate device identity keypair
- Connection fails with "device identity required"

**Solutions:**

1. **Best: Use HTTPS** 
   - Since `https://dieter.dergreg.com` is already HTTPS, this is good ✓
   - But the Gateway must also be accessible via HTTPS/WSS

2. **Via Tailscale Serve (Recommended)**
   ```json5
   {
     gateway: {
       bind: "loopback",
       tailscale: { mode: "serve" }
     }
   }
   ```
   This provides `wss://<magicdns>/` access with proper HTTPS.

3. **Fallback: allowInsecureAuth**
   ```json5
   {
     gateway: {
       controlUi: { 
         allowInsecureAuth: true,
         allowedOrigins: ["https://dieter.dergreg.com"]
       },
       auth: { mode: "token", token: "..." }
     }
   }
   ```
   This allows token-only auth without device identity (less secure).

### 4. Authentication Options

**Source:** `/gateway/tailscale.md`, `/gateway/authentication.md`

**Auth Modes:**
- `token` - Shared secret via `OPENCLAW_GATEWAY_TOKEN` or config
- `password` - Shared password (required for Funnel mode)

**Auth in WebSocket Connect:**
```json
{ "auth": { "token": "your-gateway-token" } }
```

**Tailscale Serve Identity (optional):**
When `gateway.auth.allowTailscale: true`, Tailscale Serve can authenticate via identity headers (`tailscale-user-login`) without token/password.

### 5. Device Identity & Pairing

**Source:** `/gateway/protocol.md`, `/web/control-ui.md`

**First Connection from New Browser:**
- Gateway requires **one-time pairing approval** for new devices
- Browser gets: "disconnected (1008): pairing required"
- Approve via CLI:
  ```bash
  openclaw devices list
  openclaw devices approve <requestId>
  ```

**Device Identity Requirements:**
- All WS clients should include device identity
- Exception: Control UI can omit it with `gateway.controlUi.allowInsecureAuth: true`
- Device identity requires WebCrypto (HTTPS context only)

### 6. Tailscale Configuration Options

**Source:** `/gateway/tailscale.md`

**Option A: Tailscale Serve (Recommended)**
```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" }
  }
}
```
- Gateway stays on `127.0.0.1`
- Tailscale provides HTTPS at `https://<magicdns>/`
- Identity headers can replace token auth

**Option B: Direct Tailnet Bind**
```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" }
  }
}
```
- Gateway listens on Tailnet IP directly
- Access: `ws://<tailscale-ip>:18789`
- ⚠️ No HTTPS (WebCrypto won't work in browser)

**Option C: Funnel (Public Internet)**
```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "..." }
  }
}
```
- Public HTTPS access
- Requires password auth (no identity headers)

---

## Recommended Configuration for dieter.dergreg.com

For connecting from `https://dieter.dergreg.com` to Gateway via Tailscale:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
    auth: { 
      mode: "token", 
      token: "${OPENCLAW_GATEWAY_TOKEN}",
      allowTailscale: true  // Optional: allow Tailscale identity auth
    },
    controlUi: {
      allowedOrigins: ["https://dieter.dergreg.com"],
      // Optional if you want to skip device auth:
      // allowInsecureAuth: true
    }
  }
}
```

**Connection URL from External Browser:**
- If using Tailscale Serve: `wss://<magicdns-hostname>/`
- If using direct bind: `ws://<tailscale-ip>:18789`

**WebSocket Client Must:**
1. Connect to the WSS/WS endpoint
2. Wait for `connect.challenge` event
3. Send `connect` request with:
   - Protocol version (min/max: 3)
   - Client info (id, version, platform, mode: "operator")
   - Role: "operator"
   - Scopes: ["operator.read", "operator.write"]
   - Auth: { token: "..." }
   - Device identity (or set `allowInsecureAuth: true`)

---

## WebSocket Methods for Chat

After successful connect, use these methods:

| Method | Description |
|--------|-------------|
| `chat.history` | Fetch session history |
| `chat.send` | Send a message (non-blocking, returns runId) |
| `chat.abort` | Abort current run |
| `chat.inject` | Inject assistant note (no agent run) |

**Events to Subscribe:**
- `chat` - Message/response events
- `agent` - Tool calls, live output
- `presence` - Presence updates
- `tick` - Keepalive
- `health` - Health updates

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| WebSocket rejected | Add origin to `gateway.controlUi.allowedOrigins` |
| "device identity required" | Use HTTPS, or enable `allowInsecureAuth` |
| "pairing required" (1008) | Run `openclaw devices approve <id>` |
| WS close immediately | Check auth token, protocol version |
| No WebCrypto | Ensure browser is on HTTPS origin |

---

## References

- Protocol: `/opt/homebrew/lib/node_modules/openclaw/docs/gateway/protocol.md`
- Control UI: `/opt/homebrew/lib/node_modules/openclaw/docs/web/control-ui.md`
- Tailscale: `/opt/homebrew/lib/node_modules/openclaw/docs/gateway/tailscale.md`
- WebChat: `/opt/homebrew/lib/node_modules/openclaw/docs/web/webchat.md`
- Troubleshooting: `/opt/homebrew/lib/node_modules/openclaw/docs/gateway/troubleshooting.md`

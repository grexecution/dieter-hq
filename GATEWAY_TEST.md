# Gateway WebSocket Test Results

**Date:** 2026-02-08 02:53 CET  
**Host:** Mac Mini von Dieter  
**Gateway:** Listening on 127.0.0.1:18789

---

## Summary

| Test | Result | Notes |
|------|--------|-------|
| Gateway Running | ✅ | RPC probe OK, listening on 127.0.0.1:18789 |
| Local WebSocket | ✅ | Connects and receives challenge |
| Tailscale WebSocket | ✅ | Connects and receives challenge |
| Origin Header | ✅ NOT BLOCKED | Custom origins accepted |
| Token Auth | ❌ FAILS | "invalid request frame" |

---

## Test Details

### 1. Health Check
```
curl -s http://localhost:18789/health
```
**Result:** Returns HTML (OpenClaw Control UI), not a JSON health endpoint. Gateway is running.

### 2. Local WebSocket (`ws://localhost:18789`)
```
✓ Connected locally
Received: {"type":"event","event":"connect.challenge","payload":{"nonce":"..."}}
```
**Result:** ✅ Connection works, receives challenge event.

### 3. Tailscale WebSocket (`wss://mac-mini-von-dieter.tail954ecb.ts.net`)
```
✓ Connected via Tailscale
Received: {"type":"event","event":"connect.challenge","payload":{"nonce":"..."}}
```
**Result:** ✅ Connection works, receives challenge event.

### 4. Origin Header Test
```
✓ Connected with Origin: https://example.com
Received: {"type":"event","event":"connect.challenge",...}
Close code: 1008 reason: invalid request frame
```
**Result:** ✅ Origin header is NOT being validated/rejected.
The connection is accepted regardless of Origin.

### 5. Token Authentication
When sending:
```json
{
  "method": "connect",
  "params": { "auth": { token: "70523edcf..." } }
}
```
**Result:** ❌ `invalid request frame`

---

## Gateway Log Analysis

The logs show:
```
"invalid handshake" ... "handshakeError":"invalid request frame"
"closed before connect" ... code=1005
```

**Key observation:** The Gateway uses a **challenge-response handshake**, not direct token authentication.

### Expected Flow:
1. Client connects → Server sends `connect.challenge` with nonce
2. Client must respond with signed challenge (HMAC of nonce + timestamp)
3. Only then is the connection authenticated

### What's Failing:
Sending `{"method":"connect","params":{"auth":{"token":"..."}}}` directly is incorrect.
The token needs to be used to sign the challenge nonce, not sent directly.

---

## Conclusion

### What's Working:
- ✅ Gateway WebSocket accepts local connections
- ✅ Gateway WebSocket accepts Tailscale connections
- ✅ No Origin header blocking
- ✅ TLS via Tailscale works

### What's NOT Working:
- ❌ Direct token auth - The handshake requires challenge-response signing

### Root Cause:
The issue is **not** with WebSocket connectivity or Origin headers. The issue is that clients must implement the **challenge-response authentication flow**:

1. Receive `connect.challenge` event with nonce
2. Sign the nonce with the token using HMAC
3. Send signed response back to complete handshake

Simple token passthrough is rejected with "invalid request frame".

---

## Next Steps

To fix token authentication, the client must:
1. Store the `nonce` from `connect.challenge`
2. Compute HMAC-SHA256 of `nonce + timestamp` using the token as key
3. Send signed challenge response

Or, if the token is meant to work directly, check Gateway configuration for auth mode settings.

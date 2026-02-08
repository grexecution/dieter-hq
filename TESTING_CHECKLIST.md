# WebSocket Integration Testing Checklist

This checklist covers manual and automated testing for the OpenClaw WebSocket integration.

---

## 🔌 Connection

### Initial Connection
- [ ] Connects automatically on page load
- [ ] Shows "Online" status indicator (green dot)
- [ ] Connection established within 5 seconds
- [ ] Console shows no WebSocket errors

### Reconnection
- [ ] Reconnects automatically after disconnect
- [ ] Shows "Reconnecting" state during reconnection
- [ ] Exponential backoff between attempts (check console)
- [ ] Reconnects within 30 seconds on network restoration
- [ ] Pending requests are properly rejected on disconnect

### Connection Status UI
- [ ] Green dot = connected
- [ ] Yellow/orange = reconnecting
- [ ] Red/gray = disconnected
- [ ] Status text updates appropriately

---

## 💬 Messaging

### Sending Messages
- [ ] Type message in input field
- [ ] Send via Enter key
- [ ] Send via Send button click
- [ ] Shift+Enter creates new line (doesn't send)
- [ ] Input clears after sending
- [ ] User message appears immediately in chat
- [ ] Send button disabled when input is empty
- [ ] Send button disabled while sending

### Receiving Responses
- [ ] Typing indicator appears during response
- [ ] Streaming text appears progressively
- [ ] Complete message replaces streaming placeholder
- [ ] Markdown rendered correctly
- [ ] Code blocks syntax highlighted
- [ ] Links are clickable
- [ ] Images render properly

### Message History
- [ ] Previous messages load on page refresh
- [ ] Scroll position maintained during streaming
- [ ] Auto-scroll to bottom on new message
- [ ] Can scroll up to view history

---

## 🎤 Voice Messages

- [ ] Voice recorder button visible
- [ ] Recording starts on button press
- [ ] Visual feedback during recording
- [ ] Recording stops on button release
- [ ] Voice message appears in chat
- [ ] Audio playback works
- [ ] Transcription shown (if enabled)
- [ ] Duration displayed correctly

---

## 🔄 Thread Switching

- [ ] Can switch between threads
- [ ] Each thread shows correct messages
- [ ] New thread starts empty
- [ ] Thread list updates in real-time

---

## ⚠️ Edge Cases

### Offline Handling
- [ ] Graceful behavior when offline
- [ ] Error message shown (not crash)
- [ ] Queue messages for retry (if implemented)
- [ ] Resume when back online

### Token Expiry
- [ ] Handle expired auth token
- [ ] Redirect to login or refresh token
- [ ] Clear error state after re-auth

### Gateway Restart
- [ ] Detect gateway disconnect
- [ ] Auto-reconnect when gateway returns
- [ ] No duplicate messages

### Error Handling
- [ ] Network timeout shows error
- [ ] Invalid message format handled
- [ ] Rate limiting handled gracefully
- [ ] Server errors show user-friendly message

---

## 📱 Mobile

- [ ] Chat works on mobile viewport
- [ ] Touch keyboard doesn't break layout
- [ ] Voice recorder works on mobile
- [ ] Swipe gestures (if any) work correctly
- [ ] Menu button visible and functional

---

## 🧪 Automated Tests

### Unit Tests (`src/lib/openclaw/__tests__/client.test.ts`)

Run with: `npx tsx src/lib/openclaw/__tests__/client.test.ts`

- [ ] `connects with token auth` - Verifies authentication flow
- [ ] `reconnects on disconnect` - Checks auto-reconnect logic
- [ ] `handles request/response` - Tests chat.history and other requests
- [ ] `receives events` - Tests event subscription for streaming
- [ ] `cleans up on disconnect` - Verifies proper cleanup
- [ ] `connection state changes` - Tests state machine

### E2E Tests (`tests/e2e/chat-websocket.spec.ts`)

Run with: `pnpm test`

- [ ] `shows connection status indicator`
- [ ] `loads message history on page load`
- [ ] `shows message input and send button`
- [ ] `can type a message`
- [ ] `clears input after sending`
- [ ] `shows user message in chat after sending`
- [ ] `handles Enter key to send message`
- [ ] `Shift+Enter creates new line`
- [ ] `mobile menu button visible on small screens`

---

## 🔧 Developer Debugging

### Console Checks
- [ ] No WebSocket connection errors
- [ ] No unhandled promise rejections
- [ ] No React hydration mismatches
- [ ] [OpenClaw] log messages show proper flow

### DevTools Network Tab
- [ ] WebSocket connection visible
- [ ] Frames show proper protocol format
- [ ] `connect` handshake successful
- [ ] `chat.send` requests visible
- [ ] `chat.chunk` events streaming

### Performance
- [ ] No memory leaks on thread switching
- [ ] Streaming doesn't block UI
- [ ] Cleanup happens on unmount

---

## 📋 Test Results Summary

| Test Category | Passed | Failed | Skipped |
|--------------|--------|--------|---------|
| Connection   |        |        |         |
| Messaging    |        |        |         |
| Voice        |        |        |         |
| Edge Cases   |        |        |         |
| Mobile       |        |        |         |
| Unit Tests   |        |        |         |
| E2E Tests    |        |        |         |

**Overall Status**: ⏳ Not Started / ✅ Passed / ⚠️ Partial / ❌ Failed

**Notes**:
- 
- 
- 

**Tested By**: _______________  
**Date**: _______________  
**Environment**:
- Browser: 
- Node Version: 
- OpenClaw Gateway Version: 

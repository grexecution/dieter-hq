# DieterHQ Merge Plan

**Date:** 2026-02-08  
**From:** Coder Workspace (`/Users/dieter/.openclaw/workspaces/coder/dieter-hq`)  
**To:** Main Workspace (`/Users/dieter/.openclaw/workspace/dieter-hq`)

---

## ✅ MERGE STATUS: PHASE 1 COMPLETE

**Completed by subagent on 2026-02-08 16:58:**
- [x] `/lib/openclaw/` folder copied (5 files)
- [x] `/app/debug-env/page.tsx` copied
- [x] `/components/GlobalActivityBar.tsx` copied
- [x] `/app/chat/DieterAvatar.tsx` copied
- [x] `ChatView.tsx` already had WebSocket imports (uncommitted changes)

**Remaining:**
- [ ] Review and commit changes
- [ ] TypeScript check (pre-existing errors in main)
- [ ] Test `/debug-env` page
- [ ] Test WebSocket chat connection

---

## Summary

The **coder workspace** has significant WebSocket/OpenClaw integration work that was never deployed:
- Full WebSocket client library (`/lib/openclaw/`)
- Real-time activity tracking
- Agent status improvements
- Debug tools

The **main workspace** has newer UI/UX design improvements:
- Premium 2026 design overhaul
- Better styling and animations

**Recommendation:** Cherry-pick the WebSocket infrastructure from coder → main, but KEEP main's UI designs.

---

## ✅ SAFE TO MERGE (Priority 1)

These are additive changes with no conflicts:

### 1. `/lib/openclaw/` folder (NEW)
Full WebSocket client library - **MERGE ENTIRE FOLDER**

| File | Size | Purpose |
|------|------|---------|
| `client.ts` | 14KB | WebSocket client with reconnection |
| `hooks.ts` | 11KB | React hooks for connection/chat |
| `types.ts` | 5KB | TypeScript protocol types |
| `index.ts` | 1KB | Module exports |
| `useGlobalActivity.ts` | 8KB | Global activity tracking |

**Action:** Copy entire folder to main workspace.

### 2. `/app/debug-env/page.tsx` (NEW)
Debug page for environment variables - useful for Vercel debugging.

**Action:** Copy to main workspace.

### 3. `/components/GlobalActivityBar.tsx` (NEW)
Shows real-time agent activity across sessions.

**Action:** Copy to main workspace.

### 4. `/app/chat/DieterAvatar.tsx` (NEW)
Custom avatar component.

**Action:** Copy to main workspace.

---

## ⚠️ REQUIRES CAREFUL MERGE (Priority 2)

These files exist in both but have DIFFERENT changes:

### Chat Components with WebSocket Integration

| File | Changes in Coder | Risk |
|------|------------------|------|
| `ChatView.tsx` | WebSocket hooks import + usage | MEDIUM - need to add imports to main's version |
| `MultiChatView.tsx` | WebSocket integration | MEDIUM |
| `OpenClawStatusSidebar.tsx` | Activity tracking | LOW |
| `NowBar.tsx` | Connection status | LOW |

**Action:** Manual merge - add WebSocket imports from coder to main's files while keeping main's UI.

---

## ❌ DO NOT MERGE (Keep Main's Version)

These are UI/design changes where MAIN is newer:

| File | Reason |
|------|--------|
| `HomeView.tsx` | Main has premium 2026 design |
| `_ui/AppShell.tsx` | Main has newer mobile menu |
| Various styling tweaks | Main's UI is more refined |

---

## Execution Plan

### Phase 1: Safe Additions (DO NOW)
```bash
# 1. Copy /lib/openclaw folder
cp -r coder/src/lib/openclaw/ main/src/lib/openclaw/

# 2. Copy new pages
cp coder/src/app/debug-env/page.tsx main/src/app/debug-env/page.tsx

# 3. Copy new components
cp coder/src/components/GlobalActivityBar.tsx main/src/components/
cp coder/src/app/chat/DieterAvatar.tsx main/src/app/chat/
```

### Phase 2: Manual Merge (REQUIRES REVIEW)
Add WebSocket imports to main's ChatView.tsx:
```typescript
// Add these imports
import { useOpenClawConnection, useOpenClawChat } from "@/lib/openclaw/hooks";
import type { Message as OpenClawMessage } from "@/lib/openclaw/types";
import type { AgentActivity } from "@/lib/openclaw/client";
```

### Phase 3: Testing
1. Run TypeScript check: `npx tsc --noEmit`
2. Verify `/debug-env` page works
3. Test chat WebSocket connection
4. Verify build passes

---

## Files Changed Summary

### New Files to Add (5 files)
- `src/lib/openclaw/client.ts`
- `src/lib/openclaw/hooks.ts`
- `src/lib/openclaw/types.ts`
- `src/lib/openclaw/index.ts`
- `src/lib/openclaw/useGlobalActivity.ts`
- `src/app/debug-env/page.tsx`
- `src/components/GlobalActivityBar.tsx`
- `src/app/chat/DieterAvatar.tsx`

### Files Requiring Manual Merge (2-4 files)
- `src/app/chat/ChatView.tsx`
- `src/app/chat/MultiChatView.tsx`

### Files to SKIP (Keep Main's)
- `src/app/HomeView.tsx`
- `src/app/_ui/AppShell.tsx`
- All other styling changes

---

## Git Commits to Cherry-Pick (from coder)

Relevant commits for WebSocket work:
```
f422c82 debug: add ENV debug page at /debug-env
5220c05 fix(openclaw): prefer TOKEN over PASSWORD env
8a0addb fix(chat): handle keepalive events + 30min timeout
2a23050 fix(activity): human-readable session names
3b2ab21 feat(chat): add GlobalActivityBar
fcf22ea feat(chat): add real-time agent activity indicator
31324e7 fix(openclaw): rewrite WebSocket client
2341fdf feat(chat): add OpenClaw WebSocket integration
```

---

## Notes

- The `/api/debug/env` folder in coder is empty - no route file exists. The debug functionality is in `/app/debug-env/page.tsx` (client-side only).
- Main workspace's `openclaw.ts` is unchanged - both versions are identical.
- The new `/lib/openclaw/` folder is an ADDITION, not a replacement.

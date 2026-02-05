# Dieter HQ Architecture

## Vision
Dieter HQ is the primary interface for OpenClaw - a professional dashboard that serves as the single source of truth for Greg's life and work.

## Core Integration: Dieter HQ ↔ OpenClaw Gateway

### Connection Flow
```
User (Browser) → Dieter HQ (Vercel) → OpenClaw Gateway (Mac mini) → AI Response
                                   ↘ Neon Postgres (persistence)
```

### Technical Requirements

1. **WebSocket Connection to Gateway**
   - Dieter HQ connects to OpenClaw Gateway via WS
   - Uses gateway protocol (connect handshake, req/res/event frames)
   - Auth via device token

2. **Gateway Exposure**
   - Option A: Tailscale (recommended) - secure, no port forwarding
   - Option B: Cloudflare Tunnel
   - Option C: Direct exposure (not recommended)

3. **Real-time Chat**
   - Send: POST message to gateway via WS or HTTP
   - Receive: Stream tokens via SSE or WS events
   - Persist: Store in Neon for history

4. **Session Management**
   - Dieter HQ gets its own sessionKey: `agent:main:dieter-hq`
   - Shares memory/context with other channels

## Environment Variables (Vercel)
- `DATABASE_URL` - Neon Postgres connection
- `OPENCLAW_GATEWAY_URL` - WebSocket URL to gateway
- `OPENCLAW_GATEWAY_TOKEN` - Auth token

## Modules
- `/chat` - Main AI chat interface (connects to OpenClaw)
- `/kanban` - Life kanban board (GTD-inspired)
- `/calendar` - Calendar view
- `/agents` - Agent management panel (future)

## Tech Stack
- Next.js 16 (App Router)
- Drizzle ORM + Neon Postgres
- Tailwind + shadcn/ui
- PWA (offline-first)

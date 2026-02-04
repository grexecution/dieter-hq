# Dieter HQ (Greg Homebase)

A Next.js PWA intended to replace Telegram for working with “Dieter” and later unify:
- Chat (threads, quick actions, artifacts)
- Calendar views
- Kanban (with logic + ClickUp ingestion)

## Status
Scaffold created. Next steps:
- Add DB schema (SQLite) for messages/events/artifacts/tasks
- Add basic auth (simple password / later OAuth)
- Implement chat UI + activity stream (SSE first)
- PWA manifest + installable shell

## Dev
```bash
npm run dev
```

## Reliability (macOS / launchd)
For a stable local service on **http://127.0.0.1:3010**, run the production server under launchd.

### 1) Build once
```bash
npm install
npm run build
```

### 2) Install + start the LaunchAgent
```bash
# install the plist (user agent)
mkdir -p ~/Library/LaunchAgents
cp ops/launchd/at.dieter.hq.plist ~/Library/LaunchAgents/

# load + start
launchctl bootstrap "gui/$UID" ~/Library/LaunchAgents/at.dieter.hq.plist
launchctl kickstart -k "gui/$UID/at.dieter.hq"
```

### 3) Stop / restart / status
```bash
# stop
launchctl kill SIGTERM "gui/$UID/at.dieter.hq"

# restart
launchctl kickstart -k "gui/$UID/at.dieter.hq"

# status (look for last exit code / running pid)
launchctl print "gui/$UID/at.dieter.hq" | sed -n '1,120p'
```

### Logs
- Service stdout: `/tmp/dieter-hq.launchd.out.log`
- Service stderr: `/tmp/dieter-hq.launchd.err.log`

### Health check
- `GET /api/health` → `{ ok: true, ... }`

## Watchdog (optional, cron-safe)
If you currently have cron polling `localhost:3010` and spamming errors when HQ restarts, use the watchdog script which only logs on state changes and will best-effort restart launchd when down.

Example cron (every minute):
```cron
* * * * * /Users/dieter/.openclaw/workspace/dieter-hq/scripts/hq-watchdog.sh
```

Watchdog logs:
- `/tmp/dieter-hq.watchdog.log`

## Notes
- Hosting target: Vercel or Hetzner.
- Source of truth: this app. ClickUp is an input with logic, not just sync.

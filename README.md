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

## Notes
- Hosting target: Vercel or Hetzner.
- Source of truth: this app. ClickUp is an input with logic, not just sync.

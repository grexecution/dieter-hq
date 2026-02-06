# MEMORY.md — Dieter's Long-Term Memory 🐕

## Über Greg & Mimi

**Mimi (Freundin):**
- Verträgt keinen Sellerie! ⚠️

## Über Greg

### Business Struktur
- **Gregify GmbH** — Mutterfirma, office@dergreg.com
- **Bluemonkeys** — Digitalagentur, g.wallner@bluemonkeys.com, ClickUp Workspace
- **Olivadis** — Olivenöl Beteiligung, ClickUp Workspace
- **SQD Consulting** — Kunde, wallner@sqdconsulting.com, ClickUp Workspace
- **SeminarGo** — Kunde, Kommunikation via office@dergreg.com oder Slack

### Wichtige Präferenzen
- Will seinen Spam/Email-Overhead reduzieren
- Kalender = Single Source of Truth fürs ganze Leben
- Schätzt direkte, schnelle Kommunikation
- Hasst blockierende Assistenten

## DieterHQ Projekt

### Status (2026-02-06) ✅ LIVE auf Vercel!
- Repo: `https://github.com/grexecution/dieter-hq`
- URL: `https://dieter-hq.vercel.app`
- Tech: Next.js 16, Drizzle ORM, Neon Postgres, Tailwind, shadcn/ui, PWA

### Features implementiert:
- ✅ **4 Chat-Tabs**: Life, Dev (Workspace Manager), Sport, Creative
- ✅ **PWA Push Notifications** (VAPID keys auf Vercel setzen!)
- ✅ **Voice Messages** (Telegram-style, tap-to-record)
- ✅ **Workspace Manager**: Dev-Tab mit dynamischen Projekt-Sessions
- ✅ **Reset Chat Button** im Header
- ⏸️ **Infinite Context**: Code da, aber temporär deaktiviert (DB Schema Issue)

### Vercel Env Vars (wichtig!):
- `DATABASE_URL` — Neon Postgres
- `OPENCLAW_GATEWAY_HTTP_URL` — Gateway URL
- `OPENCLAW_GATEWAY_PASSWORD` — Gateway Auth
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — Push Notifications
- `VAPID_PRIVATE_KEY` — Push Notifications
- `VAPID_SUBJECT` — mailto:greg@...

### Vision
- Hub-App fürs ganze Leben
- Kanban nach Kontext (Kreativ, Bluemonkeys, Privat, etc.)
- Chat-Interface (Telegram-Ersatz langfristig)
- Kalender-Integration

## Infrastruktur

### Tailscale Funnel (DieterHQ Remote Access)
- **Homebrew CLI** (nicht App!) via `sudo brew services start tailscale`
- Funnel URL: `https://mac-mini-von-dieter.tail954ecb.ts.net`
- Gateway Auth: `mode: "password"`, Password: `DieterHQ2026!`
- Auth Header: `Bearer <password>` (NICHT Basic Auth!)
- Vercel Env Vars: `OPENCLAW_GATEWAY_HTTP_URL`, `OPENCLAW_GATEWAY_PASSWORD`

### Audio Transkription
- **whisper-cpp** lokal installiert (M4 GPU)
- Modell: `~/.local/share/whisper-models/ggml-small.bin`
- Script: `/Users/dieter/.openclaw/workspace/scripts/transcribe-local.sh`
- OpenClaw preprocessing via `tools.media.audio` Config

### Apple Kalender (CalDAV)
- **vdirsyncer** + **khal** für CLI-Zugriff
- Config: `~/.config/vdirsyncer/config`
- Storage: `~/.local/share/vdirsyncer/calendars/`
- Apple ID: greg.wallner@gmail.com
- Kalender: "The Wallner Awesomeness", "Mimi & Greg", "Erinnerungen"

### Apple Reminders
- **remindctl** CLI (steipete/tap)
- Listen: Erinnerungen, Familie, Life, Shopping List

### WhatsApp (wacli)
- **wacli** CLI verbunden (2026-02-05)
- 675+ Kontakte synchronisiert
- Greg's Nummer: +43 650 940 5071
- **⚠️ REGEL:** Nachrichten NUR mit Gregs expliziter Freigabe senden!
- Nutzen: History durchsuchen, Kontakte finden, Nachrichten an Dritte (nach Freigabe)

### Google Accounts (gog CLI)
1. greg.wallner@gmail.com — privat DEFAULT
2. office@dergreg.com — Gregify (+ Drive)
3. g.wallner@bluemonkeys.com — Bluemonkeys
4. wallner@sqdconsulting.com — SQD

### GitHub
- User: `grexecution`
- Repos: dieter-hq, diverse Kundenprojekte

### ClickUp
- **Token:** `CLICKUP_TOKEN` env var gesetzt
- **Workspaces:**
  - "2x10 & Blue Monkeys" (Team ID: 24318857) — mit Chris Tockner, Moritz Miedler
  - "SQD. Digital Consulting" (Team ID: 2190370)
  - "Olivadis" (Team ID: 90152304684)
  - "derGreg" (Team ID: 9012110771)
- **API:** Comments/Tasks durchsuchbar, keine direkte "Chat" API aber Comments auf Tasks

## Lessons Learned

### 2026-02-06 (continued)
- **Unified Inbox Feature** gestartet — AI Command Center für alle Incoming Messages
  - Email (4 Accounts) + WhatsApp MVP
  - ClickUp + Slack später
  - Action Recommendations mit One-Click Execute
  - History/Audit Trail
- **Daily Cron Jobs** eingerichtet:
  - 19:00 — Time Tracking Frage (→ ClickUp Doc)
  - 21:30 — System Summary (alle Aktivitäten des Tages)
- **Whisper HTTP Server** läuft via PM2 auf Port 8082, exposed via Tailscale /whisper

### 2026-02-06
- **ClickUp API funktioniert!** Token: `CLICKUP_TOKEN` env var, Workspace "2x10 & Blue Monkeys" = Team ID 24318857
- **DieterHQ deployed**: Alle Features live, nur Infinite Context temporär deaktiviert
- **Voice Recorder**: Hold-to-record buggy auf Mobile → tap-to-record mit Send-Button
- **Subagents**: Können parallel arbeiten, cleanup=delete räumt automatisch auf
- **Context Management**: Greg will KEINE Warnungen — einfach leise sichern und bei Bedarf /new vorschlagen
- **Telegram nach Gateway-Restart kaputt**: Provider startet nicht sauber → Health-Check nötig

### 2026-02-05
- **Blocking ist tödlich**: OAuth-Flows haben Session gekillt → immer `background: true`
- **clawhub = Sicherheitsrisiko**: Ermöglicht Installation beliebiger Skills von außen → entfernt
- **Haiku für Heartbeats**: Ältestes Modell reicht völlig, spart massiv Tokens
Session context at 38% on Fri Feb  6 11:55:23 CET 2026.
Could not test Telegram channel health - agent not authorized for notifications.

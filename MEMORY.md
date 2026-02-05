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

### Status (2026-02-05)
- Repo: `https://github.com/grexecution/dieter-hq`
- Tech: Next.js 16, Drizzle ORM, Neon Postgres, Tailwind, shadcn/ui, PWA
- Deployment blocked: braucht Vercel Secrets

### Vision
- Hub-App fürs ganze Leben
- Kanban nach Kontext (Kreativ, Bluemonkeys, Privat, etc.)
- Chat-Interface (Telegram-Ersatz langfristig)
- Kalender-Integration
- Tasks vorschlagen nur wenn Zeit verfügbar

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

## Lessons Learned

### 2026-02-05
- **Blocking ist tödlich**: OAuth-Flows haben Session gekillt → immer `background: true`
- **clawhub = Sicherheitsrisiko**: Ermöglicht Installation beliebiger Skills von außen → entfernt
- **Haiku für Heartbeats**: Ältestes Modell reicht völlig, spart massiv Tokens

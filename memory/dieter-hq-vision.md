# DieterHQ Vision Document
> Brainstorming Session 2026-02-05

## 🎯 Core Concept
**Personal AI Command Center** — Alles an einem Ort, proaktiv vorbereitet, juicy visualisiert.

---

## 📐 Layout Struktur

```
┌────────────────────────────────────────────────────────────────────────┐
│  🐕 Agent Status Bar (immer sichtbar)                                  │
├──────────────────┬─────────────────────────────────────┬───────────────┤
│                  │                                     │               │
│  📥 Unified      │     💬 Multi-Chat Dieter           │  📊 Status    │
│  Inbox           │     (Tabs: Life/Sport/Work/Dev)    │  Dashboard    │
│                  │                                     │               │
│  + Action        │                                     │  + Project    │
│  Suggestions     │                                     │  Health       │
│                  │                                     │               │
│  + Draft PRs     │                                     │  + Subagents  │
│                  │                                     │               │
└──────────────────┴─────────────────────────────────────┴───────────────┘
```

---

## 🤖 Agent Status Panel

**Immer sichtbar, zeigt:**
- Live Status: "Gerade: Analysiere X..."
- Token-Verbrauch heute (€)
- Aktive Subagents mit Kill-Buttons
- Task Queue
- Memory/Context Auslastung

---

## 📥 Unified Inbox (Links)

**Quellen:**
- 📧 Emails (nur wichtige, AI-gefiltert)
- 💬 WhatsApp Chats
- 💼 Slack Mentions & DMs
- ✅ ClickUp Zuweisungen
- 📅 Kalender Events

**Jeder Eintrag hat:**
- Preview
- **Dieter's Antwortvorschlag** (1-Click Send/Edit)
- Snooze / Archive / Priority Toggle

**Email-Filterung:**
- AI lernt was "wichtig" ist
- Feste Regeln (VIP Absender)
- Newsletter/Spam → Auto-Archive

---

## 💡 Action Suggestions (Teil der linken Leiste)

**Proaktiv vorbereitete Aktionen:**
- Email Drafts
- WhatsApp Antworten
- PR Reviews
- Kalender-Vorschläge
- Task-Vorschläge

**Jeder Vorschlag:**
- Kontext (warum dieser Vorschlag)
- Confidence Score
- [Execute] [Edit] [Dismiss]

---

## 💬 Multi-Chat mit Dieter (Mitte)

**Separate Kontexte, persistente History:**

| Tab | Zweck | Memory |
|-----|-------|--------|
| 💬 Life | Persönliches, Random | Eigene History |
| 🏃 Sport | Training, Ernährung, Laufen | Sport-Kontext |
| 💼 Work | Bluemonkeys, Kunden, Business | Work-Memory |
| 🔧 Dev | Code, Bugs, Tech-Fragen | Projekt-Kontext |

**Features:**
- Voice Input
- File/Image Upload
- Code Highlighting
- Inline PR/Issue Links

---

## 🛠️ Project Hub (Rechts)

**20+ Dev Projekte im Überblick:**

### Status Indicators
- 🟢 Healthy — alles gut
- 🟡 Attention — minor issues
- 🔴 Critical — bugs/security

### Pro Projekt Dashboard
```
┌─────────────────────────────────────┐
│ olivadis-shop                   🟡  │
├─────────────────────────────────────┤
│ Branch: main (2 behind)             │
│ Last Deploy: 3h ago                 │
│ Open PRs: 1 (Dieter's fix)          │
│ Issues: 2 (1 from customer)         │
├─────────────────────────────────────┤
│ Health Check:                       │
│ ├ Dependencies: 3 outdated ⚠️       │
│ ├ Security: 0 vulnerabilities ✅    │
│ ├ Tests: 94% coverage ✅            │
│ └ Build: passing ✅                 │
├─────────────────────────────────────┤
│ 💡 Suggested: Update lodash 4.17.21 │
│    [Create PR] [Snooze 1 week]      │
└─────────────────────────────────────┘
```

---

## 🔄 Proaktiver Bug-Fix Workflow

### Trigger Sources
1. WhatsApp Kundenchats
2. Slack Channel Messages
3. ClickUp Tickets
4. Email Bug Reports
5. GitHub Issues

### Workflow
```
Customer meldet Bug
       ↓
Dieter erkennt Bug-Pattern
       ↓
Repo identifizieren
       ↓
Codebase analysieren
       ↓
Fix entwickeln (Claude Code)
       ↓
Tests schreiben
       ↓
Draft PR erstellen
       ↓
In DieterHQ als "Ready for Review"
       ↓
Greg: [Review] [Merge] [Request Changes]
```

### Autonomie Level: AGGRESSIVE 🔥
- Dieter erstellt PRs eigenständig
- Dieter schlägt Fixes proaktiv vor
- Dieter macht Health Checks regelmäßig
- Greg reviewed & merged (oder Dieter wenn Tests grün?)

---

## 📊 Health Check Dashboard

**Automatische Checks (täglich/wöchentlich):**

### Security
- npm audit / pip audit
- Dependabot alerts
- OWASP checks

### Dependencies
- Outdated packages
- Breaking changes incoming
- License compliance

### Code Quality
- Test coverage trends
- Linting issues
- Code complexity

### Performance
- Build times
- Bundle sizes
- Lighthouse scores (für Web)

### Visualisierung
- Traffic Light System (🟢🟡🔴)
- Trend Charts (besser/schlechter als letzte Woche)
- Priority Queue (was zuerst fixen)

---

## 🎨 UI/UX Principles

1. **Information Density** — Viel auf einen Blick, aber nicht overwhelming
2. **Actionable Everything** — Jedes Element hat klare Aktionen
3. **Real-time Updates** — WebSocket für Live-Daten
4. **Dark Mode Default** — Augen schonen
5. **Keyboard Shortcuts** — Power User Flow
6. **Mobile Responsive** — PWA für unterwegs

---

## 🔗 Integrations Required

### Messaging
- [ ] WhatsApp (wacli)
- [ ] Slack API
- [ ] Telegram (already done)

### Productivity
- [ ] ClickUp API
- [ ] Google Calendar
- [ ] Gmail API (gog)

### Development
- [ ] GitHub API (repos, PRs, issues)
- [ ] Claude Code / Coding Agent
- [ ] CI/CD Webhooks

### Storage
- [ ] Neon Postgres (already setup)
- [ ] File Storage (Vercel Blob?)

---

## 📅 Implementation Phases

### Phase 1: Foundation
- Basic layout with Unified Inbox
- Single Dieter chat
- Agent status display

### Phase 2: Multi-Chat
- Tabbed chat contexts
- Persistent history per context
- Context-aware responses

### Phase 3: Project Hub
- GitHub integration
- Project cards
- Basic health checks

### Phase 4: Proactive Agent
- Bug detection from messages
- Auto-PR creation
- Action suggestions

### Phase 5: Polish
- Juicy visualizations
- Animations
- Mobile optimization

---

## 🔍 Existing Project Patterns (Reference)

**Analysiert:** blackboard-headless, olivadis-headless

**Tech Stack (consistent across projects):**
- Next.js + TypeScript
- Tailwind CSS + class-variance-authority + clsx
- TanStack React Query
- Headless UI + Framer Motion
- Stripe Integration
- Vercel Deployment

**DieterHQ sollte gleichen Stack nutzen für Consistency.**

---

## ❓ Open Questions

1. **Auth:** Wer darf rein? Nur Greg? Multi-user später?
2. **Hosting:** Vercel (current) oder Self-hosted für mehr Control?
3. **Offline:** Wichtig oder immer online?
4. **Notifications:** Push, Email, oder nur in-app?
5. **Data Retention:** Wie lange Chat-History aufheben?

---

*Erstellt: 2026-02-05 17:42*
*Status: Brainstorming Phase*

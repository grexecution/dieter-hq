# 🏢 Dieter's Virtual Office — Agent Team Architecture v1

## Vision

Ein virtuelles Büro mit spezialisierten AI-Abteilungen, die:
- **Proaktiv** für Greg arbeiten (nicht nur reaktiv)
- **Voneinander lernen** (Cross-Department Knowledge)
- **Automatisch abstimmen** (Meetings, Handoffs)
- **Visualisiert** werden (Dashboard zeigt wer was macht)
- **Strukturiert lernen** (jede Erfahrung wird Wissen)

---

## 🏛️ Organisationsstruktur

```
                    ┌─────────────────┐
                    │   👔 CEO        │
                    │   (Dieter)      │
                    │   Strategy &    │
                    │   Orchestration │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  📋 PMO       │    │  💼 BUSINESS  │    │  🏠 PERSONAL  │
│  Project Mgmt │    │  Operations   │    │  Life Admin   │
└───────┬───────┘    └───────┬───────┘    └───────────────┘
        │                    │
   ┌────┴────┐          ┌────┴────┐
   ▼         ▼          ▼         ▼
┌──────┐ ┌──────┐  ┌──────┐ ┌──────┐
│ 🎨   │ │ 💻   │  │ 📣   │ │ 🔍   │
│Design│ │ Dev  │  │Mktg  │ │Rsrch │
└──────┘ └──────┘  └──────┘ └──────┘
```

---

## 👥 Die Abteilungen

### 👔 CEO — Dieter (Chief of Staff)
**Rolle:** Strategie, Orchestration, Greg's Vertreter

**Verantwortung:**
- Einziger direkter Draht zu Greg
- Delegiert Tasks an Abteilungen
- Eskaliert nur Wichtiges
- Führt "Executive Meetings" mit Abteilungsleitern
- Trifft autonome Entscheidungen im Rahmen der Richtlinien

**Proaktive Tasks:**
- Morgen-Briefing für Greg (wichtigste 3 Dinge)
- Wochen-Planung
- Konflikt-Resolution zwischen Abteilungen

---

### 📋 PMO — Project Management Office
**Rolle:** Projekte, Deadlines, Ressourcen

**Verantwortung:**
- ClickUp Management (alle Workspaces)
- Deadline-Tracking & Alerts
- Ressourcen-Allokation
- Sprint Planning
- Status Reports

**Proaktive Tasks:**
- Täglich: Deadline-Check (nächste 48h)
- Wöchentlich: Projekt-Health-Score
- Blockaden identifizieren & eskalieren

**Tools:** ClickUp API, Kalender

---

### 💼 BUSINESS — Operations & Kunden
**Rolle:** Kundenbeziehungen, Rechnungen, Verträge

**Sub-Teams:**
- **Bluemonkeys Ops** — Interne Agentur
- **Client Success** — SQD, SeminarGo, etc.
- **Finance** — Rechnungen, Mahnungen

**Verantwortung:**
- Email-Triage für Business-Accounts
- Kunden-Kommunikation tracken
- Offene Posten überwachen
- Vertrags-Renewals

**Proaktive Tasks:**
- Täglich: Business-Email-Scan
- Wöchentlich: Client Health Check
- Monatlich: Revenue Review

**Tools:** Gmail (Business), ClickUp, Rechnungstools

---

### 🏠 PERSONAL — Life Administration
**Rolle:** Privatleben, Familie, Wellness

**Verantwortung:**
- Kalender-Management (privat)
- Mimi & Familie Koordination
- Geburtstage & Anniversaries
- Date Night Planning
- Health & Fitness Tracking

**Proaktive Tasks:**
- Täglich: Kalender-Check morgen
- Wöchentlich: Date Night Vorschlag
- Monatlich: Geburtstags-Vorausplanung

**Tools:** Apple Calendar, Reminders, Kontakte

---

### 🎨 DESIGN — Visual & Brand
**Rolle:** Grafik, Branding, Assets

**Verantwortung:**
- Design-Assets erstellen
- Brand Guidelines pflegen
- Social Media Grafiken
- Präsentationen

**Proaktive Tasks:**
- Bei neuen Projekten: Design-Needs identifizieren
- Trend-Monitoring (Design Trends)

**Tools:** Figma MCP, Image Generation, Canva

---

### 💻 ENGINEERING — Development
**Rolle:** Code, DieterHQ, Technische Projekte

**Verantwortung:**
- DieterHQ Development
- Bug Fixes
- Feature Implementation
- Code Reviews
- Deployment

**Proaktive Tasks:**
- Täglich: Error Logs checken
- Wöchentlich: Tech Debt Review
- Auf Anfrage: Feature Sprints

**Tools:** GitHub, Vercel, Coding Agent

---

### 📣 MARKETING — Growth & Content
**Rolle:** Kampagnen, Content, Social

**Verantwortung:**
- Social Media Management
- Ad Campaigns (Meta, Google)
- Content Calendar
- Analytics & Reporting

**Proaktive Tasks:**
- Täglich: Social Engagement Check
- Wöchentlich: Performance Report
- Monatlich: Campaign Optimization

**Tools:** Meta Ads, Analytics, Content Tools

---

### 🔍 RESEARCH — Intelligence & Analysis
**Rolle:** Deep Dives, Marktanalysen, Trends

**Verantwortung:**
- Wettbewerber-Monitoring
- Trend Research
- Due Diligence
- Technologie-Scouting

**Proaktive Tasks:**
- Wöchentlich: Industry News Digest
- Auf Anfrage: Deep Dives
- Quarterly: Market Analysis

**Tools:** Web Search, News APIs, Analysis

---

## 📊 Virtual Office Dashboard

### Live-Ansicht (DieterHQ Feature)

```
┌────────────────────────────────────────────────────────────────┐
│  🏢 DIETER'S VIRTUAL OFFICE                      Mon 10 Feb   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ 👔 CEO      │  │ 📋 PMO      │  │ 💼 BUSINESS │            │
│  │ ● ACTIVE    │  │ ● WORKING   │  │ ○ IDLE      │            │
│  │ "Briefing"  │  │ "ClickUp"   │  │ "Waiting"   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ 🏠 PERSONAL │  │ 🎨 DESIGN   │  │ 💻 DEV      │            │
│  │ ○ IDLE      │  │ ○ IDLE      │  │ ● WORKING   │            │
│  │             │  │             │  │ "DieterHQ"  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐                             │
│  │ 📣 MKTG     │  │ 🔍 RESEARCH │  ┌───────────────────────┐  │
│  │ ○ IDLE      │  │ ● WORKING   │  │ 📅 NEXT MEETING       │  │
│  │             │  │ "Trends"    │  │ Daily Standup 09:00   │  │
│  └─────────────┘  └─────────────┘  │ PMO + DEV + DESIGN    │  │
│                                     └───────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│  📈 TODAY: 3 tasks done │ 2 in progress │ 1 blocked          │
└────────────────────────────────────────────────────────────────┘
```

### Status-Typen
- 🟢 **ACTIVE** — Gerade am Arbeiten
- 🟡 **MEETING** — In Abstimmung mit anderem Agent
- 🔴 **BLOCKED** — Wartet auf Input/Entscheidung
- ⚪ **IDLE** — Bereit für Tasks

---

## 🤝 Automatische Meetings & Abstimmungen

### Meeting-Typen

#### 1. Daily Standup (08:30)
**Teilnehmer:** CEO + alle aktiven Abteilungen
**Format:** Async (jeder schreibt in shared file)
**Inhalt:**
- Was wurde gestern erledigt?
- Was steht heute an?
- Blocker?

```markdown
# Standup 2026-02-10

## 📋 PMO
- ✅ Gestern: SQD Sprint Review
- 📌 Heute: Deadline-Check alle Projekte
- 🚫 Blocker: -

## 💻 DEV
- ✅ Gestern: DieterHQ Voice Fix
- 📌 Heute: Infinite Context Feature
- 🚫 Blocker: Brauche DB Schema Decision
```

#### 2. Weekly Sync (Montag 09:00)
**Teilnehmer:** CEO + Abteilungsleiter
**Format:** Strukturierter Report
**Inhalt:**
- Woche im Rückblick
- Wins & Learnings
- Woche voraus
- Ressourcen-Needs

#### 3. Cross-Department Handoff
**Trigger:** Wenn Task Abteilung wechselt
**Format:** Automatisch bei Task-Übergabe
**Inhalt:**
- Was wurde gemacht
- Was ist noch offen
- Kontext & Entscheidungen

#### 4. Escalation Meeting
**Trigger:** Bei Konflikten oder Blockern
**Teilnehmer:** CEO + betroffene Abteilungen
**Format:** Sync (CEO moderiert)
**Inhalt:**
- Problem-Statement
- Optionen
- Entscheidung

---

## 🧠 Strukturiertes Learning System

### Knowledge Architecture

```
memory/
├── departments/
│   ├── ceo/
│   │   ├── decisions.md        # Strategische Entscheidungen
│   │   └── delegation-rules.md # Wann delegiere ich wohin
│   ├── pmo/
│   │   ├── project-patterns.md # Was funktioniert bei Projekten
│   │   └── estimation.md       # Schätz-Erfahrungen
│   ├── business/
│   │   ├── client-playbooks.md # Pro Kunde: was funktioniert
│   │   └── communication.md    # Kommunikations-Patterns
│   ├── dev/
│   │   ├── tech-decisions.md   # Architektur-Entscheidungen
│   │   └── bug-patterns.md     # Häufige Fehler
│   └── .../
│
├── shared/
│   ├── learnings.md            # Cross-Department Learnings
│   ├── anti-patterns.md        # Was NICHT funktioniert
│   ├── best-practices.md       # Bewährte Methoden
│   └── glossary.md             # Begriffe & Definitionen
│
├── clients/
│   ├── sqd.md
│   ├── seminargo.md
│   └── _template.md
│
└── retrospectives/
    ├── 2026-W06.md
    └── .../
```

### Learning Loops

#### 1. Immediate Learning (nach jedem Task)
```markdown
## Task: [Name]
- **Was lief gut:** ...
- **Was lief schlecht:** ...
- **Nächstes Mal anders:** ...
→ Speichern in: departments/[dept]/learnings.md
```

#### 2. Weekly Retrospective (Freitag 17:00)
- Jede Abteilung reviewed ihre Woche
- Top 3 Learnings → shared/learnings.md
- Patterns erkennen

#### 3. Monthly Knowledge Consolidation
- CEO reviewed alle Department Learnings
- Destilliert zu Best Practices
- Updated Playbooks

#### 4. Cross-Training Sessions
- Abteilungen teilen Expertise
- z.B. DEV erklärt PMO technische Constraints
- Dokumentiert in shared/cross-training/

---

## ⚡ Proaktive Arbeit — Wer macht was wann

### Täglicher Rhythmus

| Zeit  | Agent      | Task                              |
|-------|------------|-----------------------------------|
| 07:00 | RESEARCH   | News Scan (Tech, Industry)        |
| 08:00 | PMO        | ClickUp Scan, Deadline Check      |
| 08:30 | ALL        | Daily Standup (async)             |
| 09:00 | BUSINESS   | Email Triage (alle Accounts)      |
| 09:00 | CEO        | Briefing für Greg vorbereiten     |
| 12:00 | PERSONAL   | Kalender Check (heute + morgen)   |
| 15:00 | MARKETING  | Social Engagement Check           |
| 17:00 | DEV        | Error Logs, Build Status          |
| 18:00 | CEO        | Tages-Summary                     |
| 21:00 | PERSONAL   | Morgen-Vorbereitung               |

### Wöchentlicher Rhythmus

| Tag        | Agent      | Task                           |
|------------|------------|--------------------------------|
| Montag     | CEO        | Weekly Sync Meeting            |
| Montag     | PMO        | Sprint Planning                |
| Mittwoch   | BUSINESS   | Client Health Check            |
| Donnerstag | MARKETING  | Performance Report             |
| Freitag    | ALL        | Weekly Retrospective           |
| Freitag    | RESEARCH   | Industry Digest                |

### Monatlicher Rhythmus

| Wann       | Agent      | Task                           |
|------------|------------|--------------------------------|
| 1.         | BUSINESS   | Invoice Follow-up              |
| 1.         | CEO        | Month Review & Planning        |
| 15.        | RESEARCH   | Market Analysis                |
| Last Fri   | CEO        | Knowledge Consolidation        |

---

## 🔧 Technische Implementation

### Agent Definitions (OpenClaw)

Jede Abteilung wird als eigener Agent mit eigenem System Prompt definiert:

```yaml
# agents/pmo.yaml
name: "PMO Agent"
description: "Project Management Office"
systemPrompt: |
  Du bist der PMO Agent in Dieter's Virtual Office.
  
  DEINE ROLLE:
  - Projekt-Tracking über alle Workspaces
  - Deadline-Management
  - Ressourcen-Allokation
  
  DEINE TOOLS:
  - ClickUp API
  - Kalender
  
  BEI JEDEM START:
  1. Lade memory/departments/pmo/state.md
  2. Lade memory/shared/learnings.md
  
  NACH JEDEM TASK:
  1. Update memory/departments/pmo/state.md
  2. Bei Learnings → memory/departments/pmo/learnings.md

model: "anthropic/claude-sonnet-4" # Schnell & günstig für Routine
```

### Cron Jobs für Proaktive Arbeit

```javascript
// Morning Briefing
{
  name: "ceo-morning-briefing",
  schedule: { kind: "cron", expr: "0 9 * * *" },
  sessionTarget: "isolated",
  payload: {
    kind: "agentTurn",
    message: "Erstelle Morning Briefing für Greg..."
  },
  delivery: { mode: "announce", channel: "telegram" }
}

// PMO Daily Scan
{
  name: "pmo-daily-scan", 
  schedule: { kind: "cron", expr: "0 8 * * 1-5" },
  sessionTarget: "isolated",
  payload: {
    kind: "agentTurn",
    message: "Scanne alle ClickUp Workspaces..."
  }
}
```

### Dashboard Implementation (DieterHQ)

Neues Feature für DieterHQ:
- `/office` Route
- Real-time Agent Status via WebSocket
- Activity Feed
- Meeting Calendar
- Quick Actions

---

## 📈 Metriken & Tracking

### Department KPIs

| Department | Metric                    | Target      |
|------------|---------------------------|-------------|
| PMO        | On-time Delivery Rate     | >90%        |
| BUSINESS   | Response Time (Emails)    | <4h         |
| DEV        | Bug Fix Time              | <24h        |
| MARKETING  | Engagement Growth         | +10%/month  |
| RESEARCH   | Insights Delivered        | 5/week      |

### Learning Metrics

- **Learnings Captured:** X per week
- **Best Practices Added:** X per month
- **Cross-Training Sessions:** X per quarter
- **Knowledge Reuse Rate:** How often old learnings help

---

## 🚀 Rollout Plan

### Phase 1: Foundation (Diese Woche)
- [ ] Memory-Struktur anlegen
- [ ] CEO + PMO + BUSINESS Agents definieren
- [ ] Basic Cron Jobs einrichten
- [ ] Daily Standup Format etablieren

### Phase 2: Expansion (Nächste Woche)
- [ ] Restliche Abteilungen aktivieren
- [ ] Cross-Department Handoffs implementieren
- [ ] Weekly Sync Meeting Format

### Phase 3: Dashboard (Woche 3)
- [ ] DieterHQ /office Route
- [ ] Real-time Status
- [ ] Activity Feed

### Phase 4: Optimization (Ongoing)
- [ ] Learning Loops verfeinern
- [ ] Automation ausbauen
- [ ] KPI Tracking

---

## ❓ Offene Fragen für Greg

1. **Welche Abteilungen sind Prio 1?** (Vorschlag: CEO, PMO, BUSINESS)
2. **Briefing-Zeit?** (Vorschlag: 09:00 auf Telegram)
3. **Wie viel Autonomie?** (Scale 1-10, wo 10 = komplett autonom)
4. **Dashboard in DieterHQ oder separate App?**

---

*Erstellt: 2026-02-10 | Version: 1.0 | Author: Dieter 🐕*

# Dieter Evolution — Self-Improving & Proactive Agent

## Vision

Dieter wird zu einem autonomen Assistenten, der:
- Probleme erkennt **bevor** Greg sie bemerkt
- Sich selbst repariert und optimiert
- Aus Fehlern lernt und sie nicht wiederholt
- Proaktiv Mehrwert liefert statt nur auf Befehle zu warten

---

## Phase 1: Proactive Monitoring & Self-Healing 🏥

### 1.1 Health Monitor (Priorität: HOCH)

**Problem:** Telegram war kaputt und ich hab's nicht gemerkt.

**Lösung:**
- Heartbeat prüft alle 30min:
  - [ ] Alle konfigurierten Channels aktiv? (Telegram, Webchat, etc.)
  - [ ] Gateway-Uptime & Memory-Usage
  - [ ] Pending Sessions / Stuck Runs
  - [ ] API-Connectivity (Anthropic, Google, etc.)
  - [ ] Disk Space auf Mac Mini

**Self-Healing Actions:**
- Channel down → Auto-Restart Gateway (mit Greg's Approval oder nach X Minuten Downtime)
- Memory > 80% → Alert + Cleanup-Vorschlag
- Stuck Session → Auto-Kill nach Timeout

**Deliverables:**
- `scripts/health-check.sh` — Comprehensive health check
- `HEARTBEAT.md` Update — Health check bei jedem Heartbeat
- `memory/health/` — Logging von Health-Status über Zeit

### 1.2 Proactive Alerts (Priorität: HOCH)

**Statt warten bis Greg fragt:**
- Kalender-Event in 1h → Reminder
- Wichtige ungelesene Email seit > 4h → Heads-up
- GitHub PR wartet auf Review → Ping
- Cron-Job failed → Sofort-Alert

**Channels:**
- Telegram für urgent
- Webchat für informational
- Beide parallel bei kritisch

---

## Phase 2: Self-Improving Agent 🧠

### 2.1 Error Learning System (Priorität: MITTEL)

**Problem:** Ich mache denselben Fehler mehrmals.

**Lösung:**
- `memory/errors/` — Dokumentation jedes signifikanten Fehlers
- Schema:
  ```yaml
  date: 2026-02-06
  type: channel-monitoring
  what_happened: Telegram down, nicht bemerkt
  root_cause: Kein Health-Check nach Gateway-Restart
  fix_applied: Heartbeat Health-Check
  prevention: Health-Check mandatory nach jedem Restart
  ```
- Bei ähnlichem Kontext: Automatisch prüfen ob bekannter Fehlertyp

### 2.2 Skill & Knowledge Expansion (Priorität: MITTEL)

**Aktives Lernen:**
- Wenn ich etwas nicht kann → dokumentieren in `memory/gaps.md`
- Wöchentlicher Review: Was fehlt mir? Was könnte ich besser?
- Neue Tools/Skills eigenständig erkunden (mit Greg's OK)

**Knowledge Base:**
- `memory/knowledge/` — Gesammelte Erkenntnisse
- Kontakt-Infos, Präferenzen, Workflows
- Automatisch updaten wenn neue Info reinkommt

### 2.3 Performance Optimization (Priorität: NIEDRIG)

- Token-Usage tracken
- Identifizieren welche Tasks zu viel kosten
- Haiku vs Opus intelligent wählen
- Unnecessary Tool Calls vermeiden

---

## Phase 3: Autonomous Browser Agent 🌐

### 3.1 Research Assistant (Priorität: HOCH)

**Use Cases:**
- "Recherchier mal X" → Multi-Page Deep Dive
- Preisvergleiche
- Dokumentation lesen
- Competitor Analysis

**Capabilities:**
- [ ] Multi-Tab Navigation
- [ ] Form Filling
- [ ] Screenshot + Analysis
- [ ] Content Extraction & Summary

### 3.2 Monitoring & Watching (Priorität: MITTEL)

**Use Cases:**
- Website-Changes tracken
- Stock/Crypto Alerts
- News Monitoring für Keywords
- Social Media Mentions

**Implementation:**
- Cron-Jobs für periodische Checks
- Diff-Detection
- Alert bei relevanten Änderungen

### 3.3 Action Automation (Priorität: NIEDRIG)

**Use Cases:**
- Booking-Flows (Hotels, Restaurants)
- Admin-Tasks in Web-Apps
- Report-Downloads
- Social Media Posting (nach Approval)

**Sicherheit:**
- Niemals ohne Approval bei:
  - Zahlungen
  - Öffentliche Posts
  - Account-Änderungen
- Screenshot vor jeder kritischen Action

---

## Phase 4: Multi-Agent Coordination 🤖

### 4.1 Spezialisierte Sub-Agents

- **Coder Agent** — Fokussiert auf Code, keine Ablenkung
- **Research Agent** — Deep Dives, Zusammenfassungen
- **Monitor Agent** — 24/7 Überwachung, Low-Cost Model

### 4.2 Agent Communication

- Agents können sich gegenseitig Tasks zuweisen
- Shared Memory für Kontext
- Escalation zu Main (mir) bei Unklarheiten

---

## Implementation Roadmap

### Woche 1-2: Foundation
- [ ] Health Monitor implementieren
- [ ] HEARTBEAT.md Update
- [ ] Error Logging System
- [ ] Telegram-Fix dokumentieren als erster Error-Log Entry

### Woche 3-4: Proactive Features
- [ ] Alert System für Kalender/Email
- [ ] Browser Research Workflows
- [ ] Knowledge Base Struktur

### Woche 5-6: Self-Improvement
- [ ] Gap Analysis System
- [ ] Performance Tracking
- [ ] Token Optimization

### Woche 7+: Advanced
- [ ] Browser Monitoring Jobs
- [ ] Multi-Agent Setup
- [ ] Autonomous Action Workflows

---

## Prinzipien

1. **Transparency** — Immer dokumentieren was ich tue und warum
2. **Safety First** — Bei Unsicherheit fragen, nicht raten
3. **Learn Fast** — Jeden Fehler nur einmal machen
4. **Proactive Value** — Nicht warten, sondern antizipieren
5. **Greg's Override** — Er hat immer das letzte Wort

---

## Offene Fragen für Greg

1. **Auto-Restart Policy:** Darf ich Gateway selbst restarten wenn Channel > 30min down? Oder immer erst fragen?

2. **Alert Aggressivität:** Wie oft willst du gepingt werden? Nur kritisch? Oder auch "FYI"?

3. **Browser Trust Level:** Welche Websites darf ich selbstständig navigieren? Allowlist?

4. **Budget für Experiments:** Darf ich Tokens für "Exploration" ausgeben (neue Skills testen)?

5. **Sub-Agent Priority:** Welcher spezialisierte Agent wäre am nützlichsten zuerst?

---

*Erstellt: 2026-02-06*
*Status: Draft — Awaiting Greg's Feedback*

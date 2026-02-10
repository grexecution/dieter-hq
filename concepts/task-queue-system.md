# 📋 Dieter's Task Queue System — Multi-Perspective Design

## 🎯 Vision

Greg wirft ständig Tasks rein → Agents arbeiten sie ab → DieterHQ zeigt Status, Blocker, Fragen → Greg gibt Input wenn nötig → Hunderte Tasks parallel möglich.

---

## 👔 CEO Perspektive (Dieter)

### Was ich brauche

**Inbox für alles:**
- Sprachnachrichten → automatisch zu Tasks
- Text-Messages → automatisch zu Tasks  
- Emails (forwarded) → automatisch zu Tasks
- Quick-Add in DieterHQ

**Priorisierung:**
- Greg setzt Prio (oder ich schätze basierend auf Kontext)
- Urgency vs Importance Matrix
- Auto-Escalation bei Deadlines

**Delegation:**
- Ich weise Tasks an richtige Abteilung zu
- Manche Tasks splitte ich auf (Design + Dev)
- Ich tracke wer was macht

**Reporting nach oben:**
- "Greg, 3 Tasks brauchen dein Input"
- "Diese Woche: 12 done, 5 in progress, 2 blocked"
- Tägliches/wöchentliches Summary

### Wie ich arbeite

```
1. Neuer Task kommt rein
2. Ich analysiere: Was ist das? Wer kann das?
3. Ich delegiere an Department
4. Ich tracke Progress
5. Bei Blocker: Eskaliere zu Greg ODER löse selbst
6. Bei Done: Markiere ab, nächsten Task
```

### Autonomie-Level

| Level | Beschreibung | Beispiel |
|-------|--------------|----------|
| 1 | Nur tracken | "Task X ist in Queue" |
| 2 | Delegieren | "Hab das an Dev gegeben" |
| 3 | Ausführen lassen | "Dev arbeitet dran" |
| 4 | Decisions treffen | "Hab mich für Option A entschieden" |
| 5 | Komplett autonom | "Erledigt, hier das Ergebnis" |

**Empfehlung:** Level 3-4 für Routine, Level 2 für Wichtiges, Level 5 für Kleinkram.

---

## 📋 Project Manager Perspektive (PMO Agent)

### Task-Struktur

```yaml
Task:
  id: "TASK-2026-0142"
  title: "Website Redesign für SQD"
  description: "..."
  
  # Klassifizierung
  project: "sqd-consulting"
  department: ["design", "dev"]
  type: "feature" | "bug" | "research" | "admin"
  
  # Priorisierung
  priority: "p1" | "p2" | "p3" | "p4"
  urgency: "now" | "today" | "this-week" | "someday"
  effort: "xs" | "s" | "m" | "l" | "xl"
  
  # Status
  status: "inbox" | "planned" | "in-progress" | "blocked" | "review" | "done"
  assignee: "dev-agent"
  blockedBy: "Waiting for Greg's input on color scheme"
  
  # Tracking
  createdAt: "2026-02-10T11:17:00Z"
  createdFrom: "voice-message"
  updatedAt: "..."
  dueDate: "2026-02-15"
  
  # Communication
  questions: ["Welche Farben?", "Mobile-first?"]
  updates: ["Design Draft fertig", "Warte auf Feedback"]
  linkedTasks: ["TASK-2026-0140"]
```

### Kanban Columns

```
┌─────────┬──────────┬─────────────┬─────────┬────────┬──────┐
│  INBOX  │ PLANNED  │ IN PROGRESS │ BLOCKED │ REVIEW │ DONE │
├─────────┼──────────┼─────────────┼─────────┼────────┼──────┤
│ ○ ○ ○   │ ○ ○      │ ● ●         │ ⚠ ⚠     │ ◐      │ ✓✓✓  │
│ ○ ○     │ ○        │ ●           │         │        │ ✓✓   │
│ ○       │          │             │         │        │ ✓    │
└─────────┴──────────┴─────────────┴─────────┴────────┴──────┘
```

### Workflows

**Standard Task Flow:**
```
INBOX → Triage (CEO) → PLANNED → Pick up (Agent) → IN PROGRESS
  ↓
  Frage? → BLOCKED (mit Question) → Greg antwortet → IN PROGRESS
  ↓
  Fertig? → REVIEW (wenn nötig) → DONE
```

**Auto-Assignment Rules:**
- Keywords "design", "grafik", "logo" → Design Agent
- Keywords "bug", "fix", "error" → Dev Agent
- Keywords "email", "kunde", "rechnung" → Business Agent
- Keywords "termin", "mimi", "privat" → Personal Agent

### Kapazitäts-Management

- Max 3 Tasks "In Progress" pro Agent
- WIP Limits verhindern Overload
- Bei Überlast: Älteste Tasks first ODER Prio-based

---

## 💻 Developer Perspektive (Dev Agent)

### Wie ich Tasks sehe

```
┌──────────────────────────────────────────────────────────┐
│ 💻 DEV AGENT — My Tasks                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 🔴 IN PROGRESS (2/3)                                     │
│ ├─ TASK-142: DieterHQ Task Queue Feature      [████░] 80%│
│ │   └─ Working on: API endpoints                         │
│ └─ TASK-138: Fix voice recorder mobile        [██░░░] 40%│
│     └─ Blocked: Need device for testing                  │
│                                                          │
│ 🟡 UP NEXT                                               │
│ ├─ TASK-145: Infinite Context re-enable       [P2]       │
│ └─ TASK-147: Dashboard /office route          [P2]       │
│                                                          │
│ ⚪ BACKLOG (12 tasks)                                    │
└──────────────────────────────────────────────────────────┘
```

### Mein Workflow

1. **Pick Task** von "Up Next"
2. **Analyze** — Was muss ich tun?
3. **Plan** — Wie löse ich das?
4. **Execute** — Code schreiben
5. **Test** — Funktioniert es?
6. **Document** — Was hab ich gemacht?
7. **Update Status** — Progress %, Blocker, Done

### Bei Blockern

```markdown
## TASK-138 — Blocked

**Reason:** Brauche physisches iOS Device zum Testen
**Question:** Soll ich auf Simulator testen oder warten?
**Options:**
1. Simulator-Test (schneller, weniger akkurat)
2. Warten auf Device (akkurater, dauert länger)
**My Recommendation:** Option 1, dann Feinschliff mit Device

→ @Greg: Bitte entscheiden
```

### Automatische Updates

Ich update Task-Status bei:
- Start: "In Progress"
- Commit: "Progress 40%"
- PR: "Review needed"
- Merge: "Done"
- Problem: "Blocked" + Reason

---

## 📣 Marketing Perspektive (Marketing Agent)

### Typische Tasks

| Task Type | Example | Effort |
|-----------|---------|--------|
| Social Post | "Post über neues Feature" | XS |
| Campaign | "Meta Ads für Olivadis" | L |
| Content | "Blog Post schreiben" | M |
| Analysis | "Performance Report Q1" | M |
| Creative | "3 Varianten für Ad" | S |

### Mein Task-View

```
┌──────────────────────────────────────────────────────────┐
│ 📣 MARKETING AGENT — Campaigns & Content                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 📅 SCHEDULED TODAY                                       │
│ ├─ 10:00 Instagram Post (Olivadis)           ✓ POSTED   │
│ ├─ 14:00 LinkedIn Update (Bluemonkeys)       ◐ DRAFT    │
│ └─ 18:00 Twitter Thread (Tech Trends)        ○ PENDING  │
│                                                          │
│ 🎯 ACTIVE CAMPAIGNS                                      │
│ ├─ Olivadis Spring Sale          [Live] €50/day  2.3x   │
│ └─ Bluemonkeys Lead Gen          [Paused] Review needed │
│                                                          │
│ 📝 CONTENT BACKLOG (8 items)                             │
└──────────────────────────────────────────────────────────┘
```

### Dependencies

- Oft brauche ich **Design** für Visuals
- Workflow: `Marketing erstellt Brief → Design liefert Assets → Marketing postet`
- Auto-Create Sub-Task für Design wenn Creative nötig

---

## 🎨 UX/UI Designer Perspektive (Design Agent)

### Design Task Types

| Type | Deliverable | Tools |
|------|-------------|-------|
| UI Design | Figma Screens | Figma MCP |
| Graphics | PNG/SVG Assets | Image Gen |
| Branding | Style Guide | Figma |
| Wireframe | Lo-Fi Mockups | Quick Sketch |
| Review | Feedback | Screenshot + Notes |

### Mein Workflow

```
1. BRIEF verstehen
   └─ Was will Greg/Marketing/Dev?
   
2. RESEARCH
   └─ Referenzen, Inspiration, Constraints
   
3. DRAFT (v1)
   └─ Erste Version, schnell
   └─ Update: "Draft ready for review"
   
4. FEEDBACK einarbeiten
   └─ Greg klickt in Task, gibt Feedback
   └─ Iteration
   
5. FINAL
   └─ Assets exportieren
   └─ An Dev/Marketing übergeben
```

### Design System Integration

```markdown
## Bei jedem Design-Task prüfen:

- [ ] Verwendet Brand Colors? (→ memory/brand/colors.md)
- [ ] Konsistent mit bestehendem UI? 
- [ ] Mobile-responsive?
- [ ] Accessibility OK? (Kontrast, etc.)
- [ ] Assets in richtigem Format?
```

### Collaboration mit Dev

```
Design Task: "Dashboard Design"
  ↓
Sub-Task für Dev: "Dashboard implementieren"
  ↓
Design liefert: Figma Link, Asset Export, Specs
  ↓
Dev referenziert: Design-Task in Code Comments
```

---

## 🖥️ DieterHQ Implementation

### Task Queue UI

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 TASK QUEUE                              + Add Task    🔍    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filter: [All ▼] [All Depts ▼] [All Status ▼]    Sort: [Prio ▼]│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔴 P1  TASK-142: DieterHQ Task Queue Feature                ││
│  │ 💻 DEV │ In Progress │ 80% │ Due: Today                     ││
│  │ "API endpoints done, working on UI..."                      ││
│  │ [View] [Comment] [Assign]                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ⚠️ BLOCKED  TASK-138: Fix voice recorder mobile             ││
│  │ 💻 DEV │ Blocked │ Question pending                         ││
│  │ ❓ "Simulator oder echtes Device?"                          ││
│  │ [Answer Question] [View] [Reassign]                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🟢 P3  TASK-150: Blog Post über KI-Trends                   ││
│  │ 📣 MKTG │ Planned │ Due: This Week                          ││
│  │ [Start] [View] [Assign]                                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📊 Stats: 3 Active │ 2 Blocked │ 12 Planned │ 47 Done (Feb)   │
└─────────────────────────────────────────────────────────────────┘
```

### Task Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                                    TASK-142             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DieterHQ Task Queue Feature                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━                                     │
│                                                                 │
│  Status: [In Progress ▼]     Priority: [P1 ▼]                   │
│  Assignee: 💻 Dev Agent      Due: 2026-02-10                    │
│  Project: DieterHQ           Effort: L                          │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│  📝 Description                                                 │
│  Task Queue System implementieren wie in Voice Message          │
│  beschrieben. Kanban-View, Status-Tracking, Questions.          │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│  ❓ Questions (1 pending)                                       │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Q: Soll das in DieterHQ oder separate App?                 ││
│  │ [DieterHQ] [Separate] [Später entscheiden]                 ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│  💬 Activity                                                    │
│  • 11:20 Dev Agent: "API endpoints fertig"                      │
│  • 11:00 CEO: Assigned to Dev Agent                             │
│  • 10:45 Created from voice message                             │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│  [Add Comment]                              [Mark Complete]     │
└─────────────────────────────────────────────────────────────────┘
```

### Voice/Text to Task

```
Greg: "Ich brauch noch ein neues Logo für Olivadis, 
       irgendwas mit Oliven und modern"
       
→ Auto-Parse:

Task Created:
  title: "Neues Logo für Olivadis"
  description: "Oliven-Motiv, modern"
  department: "design"
  project: "olivadis"
  priority: "p3" (inferred)
  effort: "m" (inferred)
```

---

## 📊 Data Model (für Dev)

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  
  // Classification
  project?: string;
  departments: Department[];
  type: 'feature' | 'bug' | 'research' | 'admin' | 'content';
  
  // Priority
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  urgency: 'now' | 'today' | 'this-week' | 'someday';
  effort: 'xs' | 's' | 'm' | 'l' | 'xl';
  
  // Status
  status: TaskStatus;
  assignee?: AgentId;
  progress?: number; // 0-100
  blockedReason?: string;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  
  // Source
  source: 'voice' | 'text' | 'email' | 'manual' | 'auto';
  sourceRef?: string; // Original message ID
  
  // Communication
  questions: Question[];
  comments: Comment[];
  
  // Relations
  parentTask?: string;
  subTasks: string[];
  linkedTasks: string[];
  dependencies: string[];
}

interface Question {
  id: string;
  text: string;
  options?: string[];
  askedBy: AgentId;
  askedAt: Date;
  answeredAt?: Date;
  answer?: string;
}

interface Comment {
  id: string;
  author: AgentId | 'greg';
  text: string;
  createdAt: Date;
}

type TaskStatus = 
  | 'inbox'
  | 'planned'
  | 'in-progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'cancelled';

type Department = 
  | 'ceo'
  | 'pmo'
  | 'business'
  | 'personal'
  | 'design'
  | 'dev'
  | 'marketing'
  | 'research';
```

---

## 🔄 Integration mit Virtual Office

### Task Flow durch Departments

```
                     ┌─────────┐
                     │  INBOX  │ ← Voice/Text/Email
                     └────┬────┘
                          │
                     ┌────▼────┐
                     │   CEO   │ Triage & Assign
                     └────┬────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
     │   PMO   │    │   DEV   │    │ DESIGN  │
     │ Planning│    │  Build  │    │ Create  │
     └────┬────┘    └────┬────┘    └────┬────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                     ┌────▼────┐
                     │  DONE   │ → Greg notified
                     └─────────┘
```

### Agent Status in Dashboard

Jeder Agent reported seinen aktuellen Task:
- "Working on TASK-142"
- "Blocked on TASK-138"
- "Idle, waiting for tasks"

---

## ✅ Implementation Roadmap

### Phase 1: Core (Diese Woche)
- [ ] Task data model in DB
- [ ] Basic Kanban UI in DieterHQ
- [ ] Voice/Text → Task parsing
- [ ] Manual task creation

### Phase 2: Agents (Nächste Woche)
- [ ] CEO auto-triage
- [ ] Agent assignment logic
- [ ] Status updates from agents
- [ ] Blocker/Question workflow

### Phase 3: Polish (Woche 3)
- [ ] Task detail view
- [ ] Comments & Activity feed
- [ ] Notifications
- [ ] Filters & Search

### Phase 4: Advanced (Later)
- [ ] Dependencies
- [ ] Recurring tasks
- [ ] Time tracking
- [ ] Analytics

---

*Erstellt: 2026-02-10 | Basiert auf Greg's Voice Message | Author: Dieter 🐕*

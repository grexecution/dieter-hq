# 🏢 DieterHQ Virtual Office — Complete Requirements

**Erstellt:** 2026-02-10
**Basiert auf:** Alle Nachrichten seit 09:33 heute

---

## 📋 REQUIREMENT SUMMARY

### Aus Voice Message 1 (09:33)
> "Automatisch mitlernst und files pro Kunden erstellst mit Dingen die man merken muss"

- **R1:** Automatisches Kunden-Memory-System
- **R2:** Pro Kunde ein File mit wichtigen Infos
- **R3:** Beim Bearbeiten von Kunden-Themen automatisch laden

### Aus Voice Message 2 (09:39)
> "Fixe Agents die proaktiv arbeiten... Teams aufbauen... voneinander lernen"

- **R4:** Spezialisierte fixe Agents (nicht nur ad-hoc)
- **R5:** Agents arbeiten proaktiv (nicht nur reaktiv)
- **R6:** Cross-Agent Learning (voneinander lernen)
- **R7:** Team-Struktur mit Abteilungen

### Aus Message 3 (09:45)
> "Abteilungen: CEO, PM, Marketing, UI/UX, Design... visualisieren was sie gerade machen... automatische Meetings"

- **R8:** Abteilungsstruktur: CEO, PMO, Business, Personal, Design, Dev, Marketing, Research
- **R9:** **DASHBOARD:** Visualisierung wer was macht (Virtual Office View)
- **R10:** Status pro Agent: Active, Working, Idle, Blocked
- **R11:** Automatische Meetings/Abstimmungen zwischen Agents
- **R12:** Strukturiertes Learning-System

### Aus Voice Message 4 (11:17)
> "Kanban von To-Do's... du arbeitest periodisch ab... zeigst Status, Blocker, Fragen"

- **R13:** **TASK QUEUE:** Kanban-Board für alle Tasks
- **R14:** Greg wirft Tasks rein (Voice, Text, etc.)
- **R15:** Agents arbeiten Tasks periodisch ab
- **R16:** Status-Tracking: Inbox → Planned → In Progress → Blocked → Review → Done
- **R17:** Blocker mit Fragen anzeigen
- **R18:** Greg kann in Tasks reinclicken und Fragen beantworten
- **R19:** Hunderte Tasks/Projekte parallel möglich

### Aus Voice Message 5 (11:20)
> "Eigenes Feature, nichts kaputt machen, iterativ, lokal testen, Screenshots"

- **R20:** Separates Feature in DieterHQ (isoliert)
- **R21:** Darf bestehende Features nicht breaken
- **R22:** Iterative Entwicklung mit lokalen Tests
- **R23:** Screenshots zur visuellen Verifikation

---

## 🏗️ FEATURE BREAKDOWN

### Feature 1: Virtual Office Dashboard (`/office`)
**Requirements:** R8, R9, R10

**UI:**
```
┌────────────────────────────────────────────────────────────┐
│  🏢 VIRTUAL OFFICE                           Mon 10 Feb   │
├────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │👔 CEO   │ │📋 PMO   │ │💼 BIZ   │ │🏠 PRIV  │          │
│  │● Active │ │● Working│ │○ Idle   │ │○ Idle   │          │
│  │"Brief"  │ │"ClickUp"│ │         │ │         │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │🎨 DESIGN│ │💻 DEV   │ │📣 MKTG  │ │🔍 RSRCH │          │
│  │○ Idle   │ │● Working│ │○ Idle   │ │○ Idle   │          │
│  │         │ │"Task X" │ │         │ │         │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
├────────────────────────────────────────────────────────────┤
│  📈 Today: 3 done │ 2 in progress │ 1 blocked             │
│  📅 Next Meeting: Daily Standup 09:00                     │
└────────────────────────────────────────────────────────────┘
```

**Data:**
- Agent status (active/working/idle/blocked)
- Current task per agent
- Activity summary

---

### Feature 2: Task Queue (`/tasks`)
**Requirements:** R13-R19

**UI - List View:**
```
┌─────────────────────────────────────────────────────────────┐
│  📋 TASKS                              + Add    🔍 Filter   │
├─────────────────────────────────────────────────────────────┤
│  [Kanban] [List]                   Sort: [Priority ▼]      │
│                                                             │
│  ⚠️ BLOCKED (2)                                             │
│  ├─ TASK-138: Voice Recorder Fix          💻 DEV           │
│  │   ❓ "Simulator oder Device?" [Answer]                   │
│  └─ TASK-141: Logo Olivadis              🎨 DESIGN         │
│      ❓ "Welcher Grünton?" [Answer]                         │
│                                                             │
│  🔵 IN PROGRESS (3)                                         │
│  ├─ TASK-142: Task Queue Feature   [████░] 80%  💻 DEV     │
│  ├─ TASK-143: Email Triage               💼 BIZ            │
│  └─ TASK-144: Weekly Report              📋 PMO            │
│                                                             │
│  ⚪ PLANNED (5)                                             │
│  └─ ... (collapsed)                                         │
│                                                             │
│  📥 INBOX (3)                                               │
│  └─ ... (collapsed)                                         │
└─────────────────────────────────────────────────────────────┘
```

**UI - Kanban View:**
```
┌────────┬────────┬──────────┬─────────┬────────┬───────┐
│ INBOX  │PLANNED │IN PROGRESS│BLOCKED │ REVIEW │ DONE  │
├────────┼────────┼──────────┼─────────┼────────┼───────┤
│ ○ ○ ○  │ ○ ○ ○  │ ● ● ●    │ ⚠ ⚠    │ ◐      │ ✓✓✓✓  │
│        │ ○ ○    │          │         │        │ ✓✓✓   │
└────────┴────────┴──────────┴─────────┴────────┴───────┘
```

**UI - Task Detail:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                                    TASK-142         │
├─────────────────────────────────────────────────────────────┤
│  Task Queue Feature                                         │
│  ═══════════════════                                        │
│                                                             │
│  Status: [In Progress ▼]    Priority: [P1 ▼]               │
│  Assignee: 💻 Dev Agent     Due: Today                      │
│  Progress: [████████░░] 80%                                 │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  📝 Description                                             │
│  Implement task queue system as described...                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  ❓ Questions                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Q: Separate DB table oder JSON file?                    ││
│  │ [DB Table] [JSON] [Skip for now]                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  💬 Activity                                                │
│  • 11:30 Dev: "UI components done"                          │
│  • 11:00 CEO: Assigned to Dev                               │
│  • 10:45 Created from voice                                 │
│                                                             │
│  [Add Comment]                     [Complete Task]          │
└─────────────────────────────────────────────────────────────┘
```

**Data Model:**
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'inbox' | 'planned' | 'in-progress' | 'blocked' | 'review' | 'done';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  department: string;
  assignee?: string;
  progress?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  questions: Question[];
  comments: Comment[];
}

interface Question {
  id: string;
  text: string;
  options?: string[];
  answer?: string;
  answeredAt?: Date;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
}
```

---

### Feature 3: Add Task (Quick Input)
**Requirements:** R14

**Methods:**
1. **Button** in header → Modal
2. **Chat command** → Parse to task
3. **Voice** → Transcribe → Parse to task

**Modal UI:**
```
┌─────────────────────────────────────────────────────────────┐
│  ➕ New Task                                          ✕     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Title *                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Fix voice recorder on mobile                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Description                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ The hold-to-record is buggy on iOS...                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Priority          Department         Due Date             │
│  [P2 ▼]           [Dev ▼]            [📅 Optional]        │
│                                                             │
│                              [Cancel]  [Create Task]        │
└─────────────────────────────────────────────────────────────┘
```

---

### Feature 4: Client Memory System
**Requirements:** R1-R3

**Structure:**
```
memory/
├── clients/
│   ├── sqd.md
│   ├── seminargo.md
│   ├── olivadis.md
│   └── _template.md
```

**Auto-Load Logic:**
- Detect client context from task/email/message
- Load relevant client file
- Update with new learnings

*Note: This is backend/agent logic, not UI*

---

### Feature 5: Agent Definitions & Learning
**Requirements:** R4-R7, R11-R12

**Agent Config:**
```yaml
departments:
  - id: ceo
    name: CEO
    emoji: 👔
    role: Strategy & Orchestration
  - id: pmo
    name: PMO
    emoji: 📋
    role: Project Management
  # ... etc
```

**Learning Structure:**
```
memory/
├── departments/
│   ├── dev/learnings.md
│   ├── design/learnings.md
│   └── .../
├── shared/
│   ├── best-practices.md
│   └── anti-patterns.md
```

*Note: This is config/backend, minimal UI needed*

---

## 📊 IMPLEMENTATION PHASES

### Phase 1: Foundation
**Scope:** DB Schema, Basic Routes, Layout
- [ ] Task table in Neon DB
- [ ] `/office` route (empty shell)
- [ ] `/tasks` route (empty shell)
- [ ] Navigation updates

### Phase 2: Task Queue Core
**Scope:** CRUD, List View, Kanban
- [ ] Task CRUD API
- [ ] Task list view
- [ ] Kanban board view
- [ ] Create task modal

### Phase 3: Task Details
**Scope:** Detail View, Questions, Comments
- [ ] Task detail page
- [ ] Questions component
- [ ] Comments component
- [ ] Status updates

### Phase 4: Virtual Office
**Scope:** Agent Status Dashboard
- [ ] Agent cards component
- [ ] Status indicators
- [ ] Activity feed
- [ ] Stats summary

### Phase 5: Integration
**Scope:** Connect to OpenClaw
- [ ] Agent status API
- [ ] Task assignment logic
- [ ] Notifications

---

## 🔧 TECHNICAL CONSTRAINTS

1. **Isolation:** New feature, don't touch existing code
2. **Stack:** Next.js 15, Drizzle, Neon, Tailwind, shadcn/ui
3. **Testing:** Local dev server, screenshots for verification
4. **Iteration:** Small commits, test after each step

---

## ✅ ACCEPTANCE CRITERIA

- [ ] `/office` shows all 8 departments with status
- [ ] `/tasks` shows Kanban board with 6 columns
- [ ] Can create new task via modal
- [ ] Can view task details
- [ ] Can answer questions on blocked tasks
- [ ] Can add comments
- [ ] Can change status via drag or dropdown
- [ ] Mobile responsive
- [ ] Doesn't break existing DieterHQ features

---

*Ready for PM Review & Step Breakdown*

# AI-Kanban: Task-System für Greg & Dieter

> Konzept erstellt: 2026-02-10
> Status: Draft v1.0

---

## Executive Summary

Ein AI-gesteuertes Task-Management-System, das Greg ermöglicht, Tasks via natürlicher Sprache zu delegieren, während Dieter + Subagents diese parallel abarbeiten. Der Clou: Jeder Task wird zu einem "Mini-Chat", in dem Fragen, Updates und Entscheidungen dokumentiert werden.

---

## 1. CEO/Founder Perspektive (Greg)

### Wie will ein CEO Tasks delegieren?

**Realität:** Greg denkt in Outcomes, nicht in Tickets.

```
❌ Greg will NICHT:
"Erstelle Ticket #4523, Priorität P2, assign to Dieter, 
Label: frontend, Estimated: 3h, Sprint: 42..."

✅ Greg WILL:
"Fix the checkout bug, it's losing us money"
"Build me a landing page for the new product"
"Why is our signup rate dropping?"
```

### Design-Prinzip: Voice-to-Task

```
┌─────────────────────────────────────────────────┐
│  🎤 "Dieter, fix the payment flow by Friday"    │
│  ──────────────────────────────────────────     │
│  [Send via Telegram/Voice/Chat]                 │
└─────────────────────────────────────────────────┘
          ↓ AI parses intent
┌─────────────────────────────────────────────────┐
│  📋 TASK CREATED                                │
│  ────────────────                               │
│  Title: Fix payment flow                        │
│  Deadline: 2026-02-14                           │
│  Priority: HIGH (inferred: "losing money")      │
│  Project: Auto-detected → E-Commerce            │
│  Status: Todo                                   │
└─────────────────────────────────────────────────┘
```

### Was muss sofort sichtbar sein?

**Greg's Dashboard = Cockpit View**

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 NEEDS YOUR INPUT (3)                                        │
├─────────────────────────────────────────────────────────────────┤
│  💬 Payment Flow Fix - "Which payment provider: Stripe/Adyen?"  │
│  💬 Landing Page - "Approved copy needed for headline"          │
│  💬 API Integration - "Budget approval for $500 API costs?"     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🚧 BLOCKED (1)                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ Database Migration - Waiting for DevOps credentials         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📊 STATUS OVERVIEW                                             │
├─────────────────────────────────────────────────────────────────┤
│  In Progress: 5  │  Review: 2  │  Done Today: 3                 │
└─────────────────────────────────────────────────────────────────┘
```

### Minimal Friction Features

1. **Telegram-First**: Greg schickt Voice/Text, Task wird erstellt
2. **Smart Defaults**: AI inferiert Projekt, Priorität, Deadline
3. **One-Tap Decisions**: Buttons für häufige Antworten
4. **Daily Digest**: Morgens Summary, was heute ansteht

---

## 2. Projektmanager Perspektive

### Task-Hierarchie

```
WORKSPACE (Greg's Business)
    │
    ├── PROJECT (z.B. "E-Commerce Platform")
    │       │
    │       ├── EPIC (z.B. "Checkout Optimization")
    │       │       │
    │       │       ├── TASK (z.B. "Fix payment flow")
    │       │       │       │
    │       │       │       ├── SUBTASK (z.B. "Debug Stripe webhook")
    │       │       │       └── SUBTASK (z.B. "Test edge cases")
    │       │       │
    │       │       └── TASK (z.B. "Add Apple Pay")
    │       │
    │       └── EPIC (z.B. "Mobile App")
    │
    └── PROJECT (z.B. "Marketing")
```

**MVP Empfehlung:** Starte nur mit Projects → Tasks. Epics/Subtasks später.

### Status-Flow

```
┌──────────┐     ┌─────────────┐     ┌─────────┐     ┌────────┐     ┌──────┐
│  INBOX   │ ──► │  IN_PROGRESS│ ──► │ BLOCKED │ ──► │ REVIEW │ ──► │ DONE │
└──────────┘     └─────────────┘     └─────────┘     └────────┘     └──────┘
     │                 │                  │               │
     │                 │                  ▼               │
     │                 │           ┌───────────┐          │
     │                 └──────────►│ QUESTION  │◄─────────┘
     │                             └───────────┘
     │                                   │
     └───────────────────────────────────┘
                    (zurück zu beliebigem Status)
```

**Spezial-Status: QUESTION**
- Task pausiert automatisch
- Greg bekommt Notification
- Nach Antwort: Task geht zurück zu vorherigem Status

### Prioritäten

```typescript
enum Priority {
  CRITICAL = "critical",  // 🔴 System down, revenue impact
  HIGH = "high",          // 🟠 Important, this week
  MEDIUM = "medium",      // 🟡 Should do, this sprint
  LOW = "low",            // 🟢 Nice to have
  BACKLOG = "backlog"     // ⚪ Someday/Maybe
}
```

### Dependencies

```typescript
interface TaskDependency {
  taskId: string;
  blockedById: string;
  type: "blocks" | "relates_to" | "duplicates";
}
```

---

## 3. Developer Perspektive

### Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DieterHQ (Next.js)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Dashboard   │  │  Kanban      │  │  Task Detail │                  │
│  │  (React)     │  │  Board       │  │  (Chat UI)   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│           │                │                │                           │
│           └────────────────┴────────────────┘                           │
│                            │                                            │
│                    ┌───────▼───────┐                                    │
│                    │   tRPC API    │                                    │
│                    └───────────────┘                                    │
│                            │                                            │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌─────────────┐  ┌───────────┐  ┌─────────────────┐
     │  PostgreSQL │  │  OpenClaw │  │  Notification   │
     │  (Prisma)   │  │  Gateway  │  │  Service        │
     └─────────────┘  └───────────┘  └─────────────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
          ┌───────────┐         ┌───────────┐
          │  Dieter   │         │ Subagent  │
          │  (Main)   │         │    N      │
          └───────────┘         └───────────┘
```

### Database Schema (Prisma)

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  color       String   @default("#6366f1")
  archived    Boolean  @default(false)
  
  tasks       Task[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Task {
  id          String      @id @default(cuid())
  number      Int         @default(autoincrement()) // #123
  title       String
  description String?     @db.Text
  
  status      TaskStatus  @default(INBOX)
  priority    Priority    @default(MEDIUM)
  
  projectId   String?
  project     Project?    @relation(fields: [projectId], references: [id])
  
  parentId    String?
  parent      Task?       @relation("Subtasks", fields: [parentId], references: [id])
  subtasks    Task[]      @relation("Subtasks")
  
  assignedTo  String?     // "dieter" | "subagent:coder" | etc
  createdBy   String      // "greg" | "dieter"
  
  dueDate     DateTime?
  startedAt   DateTime?
  completedAt DateTime?
  
  // Blocking
  blockedReason String?
  
  // Messages (Q&A Thread)
  messages    TaskMessage[]
  
  // Dependencies
  blockedBy   TaskDependency[] @relation("BlockedTask")
  blocks      TaskDependency[] @relation("BlockingTask")
  
  // Metadata
  metadata    Json?       // Flexible für AI-extracted data
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([status])
  @@index([projectId])
  @@index([priority])
}

model TaskMessage {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  author    String   // "greg" | "dieter" | "subagent:coder"
  role      MessageRole @default(COMMENT)
  content   String   @db.Text
  
  // Optional: Attachments
  attachments Json?
  
  createdAt DateTime @default(now())
}

model TaskDependency {
  id            String @id @default(cuid())
  
  taskId        String
  task          Task   @relation("BlockedTask", fields: [taskId], references: [id])
  
  blockedById   String
  blockedBy     Task   @relation("BlockingTask", fields: [blockedById], references: [id])
  
  type          DependencyType @default(BLOCKS)
  
  createdAt     DateTime @default(now())

  @@unique([taskId, blockedById])
}

enum TaskStatus {
  INBOX
  TODO
  IN_PROGRESS
  BLOCKED
  QUESTION
  REVIEW
  DONE
  CANCELLED
}

enum Priority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
  BACKLOG
}

enum MessageRole {
  QUESTION    // Agent fragt Greg
  ANSWER      // Greg antwortet
  UPDATE      // Status update
  COMMENT     // Allgemeiner Kommentar
  SYSTEM      // Auto-generated
}

enum DependencyType {
  BLOCKS
  RELATES_TO
  DUPLICATES
}
```

### API Design (tRPC)

```typescript
// src/server/api/routers/tasks.ts

export const tasksRouter = createTRPCRouter({
  // Queries
  list: protectedProcedure
    .input(z.object({
      projectId: z.string().optional(),
      status: z.array(z.nativeEnum(TaskStatus)).optional(),
      assignedTo: z.string().optional(),
      limit: z.number().default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  dashboard: protectedProcedure
    .query(async ({ ctx }) => {
      // Returns: needsInput, blocked, inProgress, recentlyDone
    }),

  // Mutations
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      projectId: z.string().optional(),
      priority: z.nativeEnum(Priority).optional(),
      dueDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  createFromNaturalLanguage: protectedProcedure
    .input(z.object({
      input: z.string(), // "Fix checkout by Friday, it's urgent"
    }))
    .mutation(async ({ ctx, input }) => {
      // AI parses: title, deadline, priority, project
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.nativeEnum(TaskStatus),
      reason: z.string().optional(), // For BLOCKED
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  addMessage: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      content: z.string(),
      role: z.nativeEnum(MessageRole),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // Bulk operations
  bulkUpdateStatus: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
      status: z.nativeEnum(TaskStatus),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),
});
```

### OpenClaw Integration

```typescript
// src/lib/openclaw-tasks.ts

interface OpenClawTaskEvent {
  type: "task.created" | "task.updated" | "task.question" | "task.completed";
  task: Task;
  message?: string;
}

export async function handleAgentTaskUpdate(
  sessionId: string,
  event: OpenClawTaskEvent
) {
  switch (event.type) {
    case "task.question":
      // 1. Update task status to QUESTION
      await db.task.update({
        where: { id: event.task.id },
        data: { status: "QUESTION" }
      });
      
      // 2. Add message
      await db.taskMessage.create({
        data: {
          taskId: event.task.id,
          author: sessionId, // e.g., "agent:coder:main"
          role: "QUESTION",
          content: event.message!
        }
      });
      
      // 3. Notify Greg
      await notifyUser("greg", {
        type: "task_question",
        taskId: event.task.id,
        preview: event.message!.slice(0, 100)
      });
      break;
      
    case "task.completed":
      await db.task.update({
        where: { id: event.task.id },
        data: { 
          status: "DONE",
          completedAt: new Date()
        }
      });
      break;
  }
}
```

### Subagent Orchestration

```typescript
// Wenn ein Task assigned wird

async function assignTaskToAgent(taskId: string, agentType: AgentType) {
  const task = await db.task.findUnique({ where: { id: taskId } });
  
  // 1. Spawn oder reuse subagent
  const sessionId = await openclawGateway.spawnSession({
    agent: agentType, // "coder", "researcher", "writer"
    context: {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        project: task.project?.name
      },
      instructions: `
        Du arbeitest an Task #${task.number}: ${task.title}
        
        Regeln:
        - Nutze task.update() für Status-Updates
        - Nutze task.question() wenn du Input brauchst
        - Nutze task.complete() wenn fertig
      `
    }
  });
  
  // 2. Update task
  await db.task.update({
    where: { id: taskId },
    data: {
      assignedTo: sessionId,
      status: "IN_PROGRESS",
      startedAt: new Date()
    }
  });
}
```

---

## 4. Marketing Perspektive

### Marketing-spezifische Task-Typen

```typescript
type MarketingTaskType = 
  | "campaign"      // Ganze Kampagne
  | "content"       // Blog, Social, etc
  | "design"        // Creative Assets
  | "email"         // Newsletter, Drips
  | "seo"           // SEO Tasks
  | "paid"          // Paid Ads
  | "analytics";    // Reporting

interface MarketingMetadata {
  type: MarketingTaskType;
  
  // Campaign-specific
  campaignId?: string;
  channel?: "email" | "social" | "paid" | "organic";
  
  // Content-specific
  contentType?: "blog" | "twitter" | "linkedin" | "video";
  publishDate?: Date;
  
  // Metrics
  targetMetric?: string;  // "1000 signups"
  actualMetric?: string;  // "847 signups"
}
```

### Marketing Dashboard View

```
┌─────────────────────────────────────────────────────────────────┐
│  📈 MARKETING OVERVIEW                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CAMPAIGNS ACTIVE: 3                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎯 Product Launch     │ 12 tasks │ 67% complete │ 🟡    │   │
│  │ 🎯 Q1 Newsletter      │  4 tasks │ 25% complete │ 🟠    │   │
│  │ 🎯 SEO Optimization   │  8 tasks │ 90% complete │ 🟢    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  CONTENT CALENDAR (This Week)                                   │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                   │
│  │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │                   │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│  │ 📝  │     │ 📝  │     │ 📝  │     │     │                   │
│  │Blog │     │Tweet│     │Email│     │     │                   │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Metrics & Reporting

```typescript
interface TaskMetrics {
  // Time-based
  avgCompletionTime: number;      // Hours
  tasksCompletedThisWeek: number;
  tasksCreatedThisWeek: number;
  
  // By project
  byProject: {
    projectId: string;
    projectName: string;
    total: number;
    completed: number;
    blocked: number;
  }[];
  
  // Velocity
  velocity: {
    date: string;
    completed: number;
  }[];
}
```

---

## 5. UX Designer Perspektive

### Task Input (Minimal Friction)

**Option A: Quick Add Bar (Desktop)**
```
┌─────────────────────────────────────────────────────────────────┐
│  ➕ New task...                              [P] [📅] [📁]     │
└─────────────────────────────────────────────────────────────────┘
     ↓ (click or Cmd+K)
┌─────────────────────────────────────────────────────────────────┐
│  Fix the checkout bug by Friday                                 │
│  ────────────────────────────────────────────                   │
│  🤖 Detected:                                                   │
│     📁 Project: E-Commerce (inferred)                           │
│     📅 Due: Feb 14, 2026                                        │
│     🔥 Priority: High                                           │
│                                                                 │
│  [Create Task]                              [Edit Details]      │
└─────────────────────────────────────────────────────────────────┘
```

**Option B: Telegram Integration (Mobile-first)**
```
Greg → Dieter:
"Fix checkout, losing money"

Dieter → Greg:
📋 Task created: "Fix checkout"
├ Priority: 🔴 Critical
├ Project: E-Commerce
└ Status: In Progress

[View Task] [Edit] [Cancel]
```

### Task Detail View (Chat-artig)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                                    #127 · E-Commerce    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Fix checkout payment flow                                      │
│  ═══════════════════════════                                    │
│  Status: 🟡 QUESTION    Priority: 🔴 Critical    Due: Feb 14   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📝 DESCRIPTION                                                 │
│  Users report payment failures on Safari. Need to debug         │
│  Stripe webhook and test across browsers.                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  💬 CONVERSATION                                                │
│                                                                 │
│  ┌───────────────────────────────────────┐                     │
│  │ 🤖 Dieter                  Today 10:23│                     │
│  │ Started investigating. Found the      │                     │
│  │ issue - Stripe webhook URL changed.   │                     │
│  └───────────────────────────────────────┘                     │
│                                                                 │
│  ┌───────────────────────────────────────┐                     │
│  │ 🤖 Dieter                  Today 11:45│                     │
│  │ ❓ QUESTION                           │                     │
│  │ Should I update to Stripe API v2023-  │                     │
│  │ 10-16 while I'm at it? It has better  │                     │
│  │ error handling.                       │                     │
│  │                                       │                     │
│  │ [Yes, update] [No, just fix] [Decide] │                     │
│  └───────────────────────────────────────┘                     │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  │ Type your response...                              [Send]│  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Kanban Board Design

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📋 E-Commerce                              [+ Add Task]  [Filter ▼]    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  INBOX (2)     TODO (4)      IN PROGRESS (3)   REVIEW (1)    DONE (12) │
│  ──────────    ──────────    ────────────────  ──────────    ────────── │
│  ┌────────┐    ┌────────┐    ┌────────────┐    ┌────────┐              │
│  │ #130   │    │ #128   │    │ #127       │    │ #125   │    Completed │
│  │ New    │    │ Add    │    │ Fix check- │    │ Update │    this week:│
│  │ feature│    │ Apple  │    │ out flow   │    │ docs   │    ────────  │
│  │ idea   │    │ Pay    │    │ 🔴 ⏰ Feb14│    │ 🟡     │    #124, #123│
│  │ ⚪     │    │ 🟠     │    │ 💬 1 quest │    │        │    #122, #121│
│  └────────┘    └────────┘    └────────────┘    └────────┘    #120      │
│  ┌────────┐    ┌────────┐    ┌────────────┐                            │
│  │ #131   │    │ #129   │    │ #126       │                            │
│  │ Review │    │ Mobile │    │ API rate   │                            │
│  │ compet-│    │ optim- │    │ limiting   │                            │
│  │ itors  │    │ ization│    │ 🟡 🔒blocked│                            │
│  │ ⚪     │    │ 🟠     │    └────────────┘                            │
│  └────────┘    └────────┘    ┌────────────┐                            │
│               ┌────────┐    │ #119       │                            │
│               │ #118   │    │ Refactor   │                            │
│               │ SEO    │    │ auth       │                            │
│               │ fixes  │    │ 🟢         │                            │
│               │ 🟢     │    └────────────┘                            │
│               └────────┘                                               │
│               ┌────────┐                                               │
│               │ #117   │                                               │
│               │ Update │                                               │
│               │ deps   │                                               │
│               │ 🟢     │                                               │
│               └────────┘                                               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

Legend: 🔴 Critical  🟠 High  🟡 Medium  🟢 Low  ⚪ Backlog
        💬 Has question  🔒 Blocked  ⏰ Has deadline
```

### Mobile-First Considerations

```
┌─────────────────────┐
│  ☰  Tasks      🔔 3 │
├─────────────────────┤
│                     │
│  🔥 NEEDS INPUT     │
│  ─────────────────  │
│  ┌─────────────────┐│
│  │ #127 Fix checkout│
│  │ 💬 Stripe v2?   ││
│  │ [Yes] [No]      ││
│  └─────────────────┘│
│                     │
│  📊 TODAY           │
│  ─────────────────  │
│  ┌─────────────────┐│
│  │ 🔴 #127 Checkout││
│  │ 🟠 #126 API     ││
│  │ 🟡 #125 Docs    ││
│  └─────────────────┘│
│                     │
│  ➕ Quick Add       │
└─────────────────────┘
```

---

## 6. Task Lifecycle

### Wie fließt ein Task durch das System?

```
                                    ┌─────────────────────────┐
                                    │                         │
                                    ▼                         │
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  INPUT   │───►│  TRIAGE  │───►│  ASSIGN  │───►│  WORK    │ │
└──────────┘    └──────────┘    └──────────┘    └──────────┘ │
     │               │               │               │        │
     │               │               │               │        │
   Greg            AI +            Dieter          Agent      │
   schickt         Dieter          decides         works      │
   Message         parsen          who does                   │
                                                    │         │
                                           ┌────────┴────────┐│
                                           ▼                 ││
                                    ┌──────────┐             ││
                                    │ QUESTION │─────────────┘│
                                    └──────────┘              │
                                         │                    │
                                       Greg                   │
                                      answers                 │
                                         │                    │
                                         └────────────────────┘
                                                    │
                                                    ▼
                                           ┌──────────────┐
                                           │   COMPLETE   │
                                           └──────────────┘
                                                    │
                                                    ▼
                                           ┌──────────────┐
                                           │    REVIEW    │
                                           │  (optional)  │
                                           └──────────────┘
                                                    │
                                                    ▼
                                           ┌──────────────┐
                                           │     DONE     │
                                           └──────────────┘
```

### Detailed Flow

```
1. INPUT
   ├── Telegram Message: "Fix checkout bug"
   ├── Web UI: Quick add
   ├── Voice: "Hey Dieter, ..."
   └── API: External integration

2. TRIAGE (Automatic + Manual)
   ├── AI extracts: Title, Priority, Project, Deadline
   ├── Creates Task with status: INBOX
   └── Notifies relevant parties

3. ASSIGN
   ├── Dieter (Main) reviews INBOX
   ├── Decides: Self, Subagent, or Human
   ├── Assigns → Status: TODO
   └── When started → Status: IN_PROGRESS

4. WORK
   ├── Agent works on task
   ├── Posts updates as messages
   ├── Can change status to:
   │   ├── BLOCKED (with reason)
   │   ├── QUESTION (needs input)
   │   └── REVIEW (done, needs check)
   └── All status changes logged

5. QUESTION LOOP
   ├── Agent posts question
   ├── Status → QUESTION
   ├── Greg gets notification
   ├── Greg answers (via UI or Telegram)
   ├── Status → previous state
   └── Agent continues

6. COMPLETE
   ├── Agent marks as REVIEW or DONE
   ├── If REVIEW: Greg checks
   ├── Greg approves → DONE
   └── Task archived after 30 days
```

---

## 7. Integration mit DieterHQ

### Current DieterHQ Structure (Assumed)

```
dieter-hq/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx           # Main dashboard
│   │   │   ├── memory/            # Memory UI
│   │   │   └── ...
│   │   └── api/
│   │       └── trpc/
│   ├── components/
│   ├── server/
│   │   ├── api/
│   │   │   └── routers/
│   │   └── db.ts
│   └── lib/
├── prisma/
│   └── schema.prisma
└── ...
```

### New Files for AI-Kanban

```
dieter-hq/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx           # Kanban board
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx       # Task detail
│   │   │   │   └── inbox/
│   │   │   │       └── page.tsx       # Inbox view
│   │   │   └── ...
│   ├── components/
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── TaskInput.tsx
│   │   │   ├── TaskConversation.tsx
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── TaskQuickActions.tsx
│   ├── server/
│   │   ├── api/
│   │   │   └── routers/
│   │   │       ├── tasks.ts           # Task CRUD
│   │   │       ├── projects.ts        # Project CRUD
│   │   │       └── taskMessages.ts    # Messages
│   │   └── services/
│   │       ├── taskParser.ts          # AI parsing
│   │       └── taskNotifications.ts   # Notifications
│   └── lib/
│       ├── openclaw/
│       │   └── taskEvents.ts          # OpenClaw integration
│       └── tasks/
│           ├── constants.ts
│           └── utils.ts
├── prisma/
│   └── schema.prisma                  # + Task models
└── ...
```

---

## 8. MVP vs Full Vision

### MVP (2-3 Wochen)

**Scope:**
- ✅ Projects & Tasks (keine Subtasks)
- ✅ Basic Status Flow (Todo → In Progress → Done)
- ✅ Task Creation via Web UI
- ✅ Kanban Board
- ✅ Task Detail mit Message Thread
- ✅ Basic Telegram Integration (Task creation)
- ✅ Notifications für Questions

**Nicht im MVP:**
- ❌ Voice Input
- ❌ AI-Parsing von Tasks
- ❌ Subagent Orchestration
- ❌ Dependencies
- ❌ Metrics/Reporting
- ❌ Marketing-specific views

### Full Vision (3-6 Monate)

**Phase 1: Foundation (MVP)**
- Basic task management
- Web UI

**Phase 2: AI Integration**
- Natural language task creation
- AI project/priority inference
- OpenClaw subagent integration
- Automatic status updates

**Phase 3: Advanced Features**
- Dependencies & blocking
- Recurring tasks
- Templates
- Time tracking
- Full reporting

**Phase 4: Enterprise**
- Team support
- Permissions
- Audit logs
- Integrations (GitHub, Linear, etc.)

---

## 9. Quick Start Implementation

### Week 1
1. DB Schema (Prisma migrate)
2. tRPC routers (CRUD)
3. Basic Kanban Board UI
4. Task Detail Page

### Week 2
1. Message thread in Task Detail
2. Status transitions
3. Quick add input
4. Basic Telegram webhook

### Week 3
1. Notifications
2. Dashboard overview
3. Polish & bugs
4. Deploy

---

## 10. Open Questions

1. **Multi-tenant?** Just Greg, or multiple users later?
2. **Permissions?** Can subagents create tasks?
3. **History?** How long to keep completed tasks?
4. **Attachments?** File uploads in messages?
5. **Real-time?** WebSocket for live updates?

---

## Appendix: Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React, TailwindCSS |
| UI Components | shadcn/ui |
| State | React Query (via tRPC) |
| API | tRPC |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (existing) |
| Drag & Drop | @dnd-kit/core |
| Real-time | Pusher or Socket.io (later) |
| Notifications | OpenClaw Gateway |

---

*Dokument Ende*

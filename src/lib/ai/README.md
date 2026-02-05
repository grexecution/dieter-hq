# AI Integration Framework for Dieter HQ

A comprehensive AI-powered productivity system that brings intelligent task management, predictive scheduling, and workflow optimization to Dieter HQ.

## 🌟 Features

### 1. Natural Language Processing (NLP)
Create tasks using natural language with automatic extraction of:
- **Due dates**: "tomorrow", "next Friday", "end of month", "2/15"
- **Duration**: "30 minutes", "2 hours", "3 pomodoros"
- **Priority**: "urgent", "high priority", "!!", "p1"
- **Context**: Work, personal, health, finance, learning, social
- **Tags**: #hashtags and @mentions

```typescript
import { parseTaskFromText } from '@/lib/ai';

const intent = parseTaskFromText("Review quarterly report by Friday !high #work");
// {
//   title: "Review quarterly report",
//   dueDate: Date(Friday),
//   priority: "high",
//   tags: ["work"],
//   confidence: 0.9
// }
```

### 2. Intelligent Prioritization
Dynamic priority scoring based on multiple factors:
- **Urgency**: Due date proximity with exponential decay
- **Importance**: Long-term value and blocking relationships
- **Effort**: Energy requirements and quick-win potential
- **Context Fit**: Time of day and current energy alignment
- **Dependencies**: Tasks blocking others get priority
- **Momentum**: Continuation of recent work

```typescript
import { PrioritizationEngine } from '@/lib/ai';

const engine = new PrioritizationEngine();
const scores = engine.rankTasks(tasks, context);
// Returns scored and sorted tasks with explanations
```

### 3. Predictive Scheduling
ML-powered scheduling that learns from your patterns:
- **Duration Prediction**: Learns from completion history
- **Optimal Slot Finding**: Matches tasks to best time slots
- **Daily Schedule Generation**: Auto-schedules with breaks
- **Completion Probability**: Predicts success likelihood

```typescript
import { createScheduler } from '@/lib/ai';

const scheduler = createScheduler();
const schedule = scheduler.generateDailySchedule(tasks, context, new Date());
// Returns a full day schedule with tasks, breaks, and buffers
```

### 4. Context-Aware Communication
Smart message drafting based on:
- **Relationship type**: Formal vs casual based on recipient
- **Previous messages**: Maintains conversation context
- **Related tasks**: Includes relevant task information
- **Tone adjustment**: Professional, friendly, urgent, etc.

```typescript
import { draftFollowUp } from '@/lib/ai';

const draft = draftFollowUp(task, "John Smith");
// Returns a properly formatted email with appropriate tone
```

### 5. Task Optimization Engine
Pattern detection and workflow improvements:

**Detected Patterns:**
- Procrastination (stale tasks)
- Overcommitment
- Energy mismatches
- Context switching overhead
- Estimation bias
- Peak productivity windows

**Optimization Types:**
- Batching similar tasks
- Time boxing
- Task splitting/merging
- Reordering
- Automation suggestions
- Delegation recommendations

```typescript
import { analyzeTasksQuick } from '@/lib/ai';

const result = analyzeTasksQuick(tasks, context);
// Returns patterns, recommendations, and insights
```

### 6. Unified Task Manager
All AI features in one easy-to-use interface:

```typescript
import { createTaskManager } from '@/lib/ai';

const manager = createTaskManager();

// Create from natural language
const task = manager.createFromNaturalLanguage(
  "Write blog post about AI by next week 2h #writing"
);

// Get next task to work on
const { task, score } = manager.getNextTask();

// Get quick wins
const quickWins = manager.getQuickWins(15); // Tasks under 15 minutes

// Generate schedule
const schedule = manager.generateSchedule();

// Get optimization recommendations
const optimizations = manager.getOptimizations();

// Draft follow-up message
const draft = manager.draftFollowUp(task.id, "Client Name");
```

## 📁 Architecture

```
src/lib/ai/
├── index.ts              # Main exports and quick utilities
├── types.ts              # Shared type definitions
├── README.md             # This file
├── nlp/
│   ├── index.ts
│   └── parser.ts         # Natural language parsing
├── prioritization/
│   ├── index.ts
│   └── engine.ts         # Priority scoring engine
├── scheduler/
│   ├── index.ts
│   └── predictor.ts      # Predictive scheduling
├── communication/
│   ├── index.ts
│   └── drafter.ts        # Message drafting
├── optimization/
│   ├── index.ts
│   └── engine.ts         # Pattern detection & optimization
└── tasks/
    ├── index.ts
    └── manager.ts        # Unified AI task manager
```

## 🚀 Quick Start

```typescript
import { quickSetup, analyzeAndSummarize } from '@/lib/ai';

// Quick setup with defaults
const { manager, context } = quickSetup();

// Load your tasks
manager.loadTasks(existingTasks);

// Get a comprehensive analysis
const summary = analyzeAndSummarize(existingTasks);

console.log("Top priority:", summary.topPriority?.title);
console.log("Quick wins:", summary.quickWins.length);
console.log("Recommendations:", summary.recommendations);
```

## 🧠 User Context

The AI system uses context to make intelligent decisions:

```typescript
const context: UserContext = {
  currentTime: new Date(),
  timezone: 'Europe/Vienna',
  
  // Current state
  currentEnergyLevel: 'high',
  availableMinutes: 180,
  
  // Work patterns
  workHours: { start: '09:00', end: '18:00' },
  focusHours: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '16:00' },
  ],
  
  // Historical data (improves over time)
  productivityByHour: { 9: 80, 10: 90, 11: 85, ... },
  productivityByDay: { 1: 80, 2: 85, 3: 80, ... },
  averageTaskCompletion: 1.2, // 20% over estimates
  
  // Active context
  activeProject: 'project-123',
  recentTags: ['work', 'urgent'],
  upcomingEvents: [...],
};

manager.setContext(context);
```

## 📊 Task Model

Tasks include AI-enhanced metadata:

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'inbox' | 'todo' | 'in_progress' | 'blocked' | 'done' | 'archived';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'someday';
  
  // Time
  estimatedMinutes?: number;
  actualMinutes?: number;
  dueAt?: Date;
  scheduledAt?: Date;
  
  // AI metadata
  aiPriorityScore?: number;
  aiUrgencyDecay?: number;
  aiImportanceScore?: number;
  aiContextFit?: number;
  
  // Context
  context: TaskContextType[];
  tags: string[];
  energyRequired: 'high' | 'medium' | 'low';
  
  // Dependencies
  blockedBy: string[];
  blocks: string[];
}
```

## 🔧 Configuration

### Priority Weights

Customize how priority is calculated:

```typescript
const engine = new PrioritizationEngine({
  weights: {
    urgency: 0.25,      // Due date importance
    importance: 0.20,   // Long-term value
    effort: 0.15,       // Quick win potential
    contextFit: 0.15,   // Time of day fit
    dependency: 0.15,   // Blocking relationships
    momentum: 0.10,     // Continuation of work
  },
  urgencyDecayDays: 7,
  importanceHalfLifeDays: 30,
});
```

### Optimization Thresholds

```typescript
// Pattern detection thresholds (in engine.ts)
const THRESHOLDS = {
  procrastinationDays: 7,
  overcommitmentRatio: 1.5,
  contextSwitchesPerHour: 3,
  estimationBiasThreshold: 0.3,
  batchingMinTasks: 3,
  splitThresholdMinutes: 120,
  mergeThresholdMinutes: 10,
};
```

## 📈 Learning & Improvement

The system learns from usage:

```typescript
// Record task completion for learning
manager.completeTask(taskId, actualMinutes);

// This improves:
// - Duration predictions for similar tasks
// - Optimal time slot recommendations
// - Pattern detection accuracy
// - Estimation bias tracking
```

## 🔌 Integration Points

### With Database
```typescript
// Load tasks from database
const dbTasks = await db.select().from(tasks);
manager.loadTasks(dbTasks);

// Save AI-enhanced task
const newTask = manager.createFromNaturalLanguage(input);
await db.insert(tasks).values(newTask);
```

### With Calendar
```typescript
// Include calendar events in context
context.upcomingEvents = await fetchCalendarEvents();
manager.setContext(context);

// Generate schedule considering existing events
const schedule = manager.generateSchedule();
```

### With Chat/Assistant
```typescript
// Natural language task creation from chat
const task = manager.createFromNaturalLanguage(userMessage);

// Get AI explanation for prioritization
const suggestions = manager.getTaskSuggestions(task.id);
const explanation = suggestions.priority.recommendation;
```

## 🎯 Best Practices

1. **Set context at session start**: Energy levels and available time affect recommendations
2. **Record completions**: More data = better predictions
3. **Review optimizations weekly**: Act on high-confidence recommendations
4. **Use natural language**: The NLP parser handles most formats
5. **Trust the priorities**: The algorithm considers factors you might miss

## 📝 License

Part of Dieter HQ - Personal productivity system.

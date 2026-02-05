# Agent Status Panel Component

Eine umfassende Statusanzeige für DieterHQ Agents mit Live-Updates, Token-Tracking und Subagent-Management.

## Features

- ✨ **Animierte Live-Status-Anzeige** - Zeigt aktuellen Agent-Status mit Thinking-Animation
- 💰 **Token Counter** - Verbrauch und Kosten-Tracking in Echtzeit 
- 🤖 **Subagent Management** - Liste aller Subagents mit Status-Badges und Kill-Buttons
- 📱 **Responsive Design** - Kollabiert auf Mobile zu Icon-View
- 🎬 **Smooth Animations** - Powered by Framer Motion
- 🌗 **Dark Mode Support** - Vollständig kompatibel mit Theme-System
- ♿ **Accessibility** - ARIA-Labels und Keyboard-Navigation

## Quick Start

```tsx
import { AgentStatusPanel } from '@/components/agent-status-panel';

export function MyLayout() {
  return (
    <div className="flex gap-4">
      <main>
        {/* Your main content */}
      </main>
      
      <AgentStatusPanel />
    </div>
  );
}
```

## Props

```typescript
interface AgentStatusPanelProps {
  className?: string;
  defaultCollapsed?: boolean; // Auto-collapsed on mobile
}
```

## Structure

### Status Sections

1. **Aktueller Status** - Was der Agent gerade macht
2. **Token Verbrauch** - Heute/Monat mit Kosten in EUR
3. **Subagents** - Live-Liste mit Status und Kill-Buttons
4. **Als Nächstes** - Preview der nächsten Task

### Responsive Behavior

- **Desktop (lg+):** Vollständiges Panel (320px width)
- **Mobile (<lg):** Kollabiert automatisch zu Icon mit Badge
- **Collapse/Expand:** Manual toggle via Chevron buttons

## Status Types

### Agent Status
```typescript
type AgentStatus = {
  current: string;           // "Analysiere DieterHQ Komponenten"
  next: string;              // "Erstelle React Komponente"  
  sinceMs: number | null;    // Timestamp wann gestartet
  updatedAtMs: number | null; // Letztes Update
  isThinking: boolean;       // Zeigt Thinking-Animation
  subAgents: SubAgent[];     // Liste der Subagents
  tokenUsage: TokenUsage;    // Token-Verbrauch
};
```

### SubAgent Status
```typescript
type SubAgent = {
  id: string;
  name: string;              // "Code Agent"
  status: "active" | "idle" | "error" | "completed";
  task: string;              // "Erstellt React Komponente"
  startTime: number;         // Timestamp
  progress?: number;         // Optional 0-100
};
```

### Token Usage
```typescript
type TokenUsage = {
  today: number;        // 45280 tokens heute
  thisMonth: number;    // 892150 tokens diesen Monat
  costToday: number;    // 12.47 EUR heute
  costMonth: number;    // 247.85 EUR diesen Monat
};
```

## Animations

### Thinking Indicator
- **Bouncing Dots:** 3 dots mit staggered animation wenn `isThinking: true`
- **Shimmer Effect:** Gradient sweep über Status-Card
- **Pulsing Status Badge:** Emerald ping effect

### Transitions
- **Layout Animations:** Smooth collapse/expand mit Framer Motion `layout`
- **List Updates:** AnimatePresence für Subagent add/remove
- **Progress Bars:** Smooth width animations für Subagent progress
- **Hover Effects:** Scale transforms für Token cards

## Customization

### Styling
Nutzt das DieterHQ Design System:
- Glass morphism effects (`bg-white/60 backdrop-blur`)
- Consistent spacing (`gap-3`, `p-4`)  
- Dark mode variants (`dark:bg-zinc-950/40`)
- CVA variants für Status-Badges

### Mock Data
Currently uses mock data - replace with real API:

```typescript
// Replace this in AgentStatusPanel.tsx
const mockAgentStatus: AgentStatus = {
  current: "Your current status from API",
  // ... etc
};
```

### API Integration
Expected API endpoint: `/api/agent/status`

```typescript
useEffect(() => {
  const fetchStatus = async () => {
    const response = await fetch('/api/agent/status');
    const data = await response.json();
    setAgentStatus(data);
  };
  
  fetchStatus();
  const interval = setInterval(fetchStatus, 3000);
  return () => clearInterval(interval);
}, []);
```

## Component Architecture

```
AgentStatusPanel/
├── AgentStatusPanel.tsx    # Main component
├── index.ts               # Exports
└── README.md              # This file

Sub-components:
├── StatusIndicator        # Current status mit thinking animation
├── TokenCounter          # Usage/cost display
├── SubAgentList          # Subagent management
└── CollapsedView         # Mobile icon view
```

## Integration

### ChatView Integration
Already integrated in `src/app/chat/ChatView.tsx`:

```tsx
// Desktop sidebar
<aside className="hidden lg:block">
  <AgentStatusPanel />
</aside>

// Mobile overlay  
<div className="mobile-overlay">
  <AgentStatusPanel defaultCollapsed={false} className="h-full" />
</div>
```

## Future Enhancements

- [ ] **Real-time WebSocket** updates statt polling
- [ ] **Task Queue** visualization
- [ ] **Performance Metrics** (memory, CPU usage)
- [ ] **Agent Health Score** aggregated metric
- [ ] **Historical Charts** token usage over time
- [ ] **Custom Alerts** für cost thresholds
- [ ] **Subagent Logs** expandable log viewer
- [ ] **Export Functionality** status reports

---

**Created:** 2026-02-05  
**Tech Stack:** React + TypeScript + Framer Motion + Tailwind + CVA
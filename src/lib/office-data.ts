// ============================================
// Virtual Office Data Definitions
// ============================================

export type AgentStatus = "active" | "working" | "idle" | "blocked";

export interface Department {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export interface Agent {
  id: string;
  department: Department;
  status: AgentStatus;
  currentTask?: string;
  lastActivity?: number;
}

export interface Activity {
  id: string;
  agentId: string;
  action: string;
  taskRef?: string;
  timestamp: number;
}

// ============================================
// Department Definitions
// ============================================

export const DEPARTMENTS: Department[] = [
  {
    id: "ceo",
    name: "CEO",
    emoji: "👔",
    description: "Strategy & Orchestration",
  },
  {
    id: "pmo",
    name: "PMO",
    emoji: "📋",
    description: "Project Management",
  },
  {
    id: "business",
    name: "Business",
    emoji: "💼",
    description: "Operations & Clients",
  },
  {
    id: "personal",
    name: "Personal",
    emoji: "🏠",
    description: "Life Administration",
  },
  {
    id: "design",
    name: "Design",
    emoji: "🎨",
    description: "Visual & Brand",
  },
  {
    id: "dev",
    name: "Dev",
    emoji: "💻",
    description: "Engineering",
  },
  {
    id: "marketing",
    name: "Marketing",
    emoji: "📣",
    description: "Growth & Content",
  },
  {
    id: "research",
    name: "Research",
    emoji: "🔍",
    description: "Intelligence & Analysis",
  },
];

// ============================================
// Status Helpers
// ============================================

export const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; dotColor: string }> = {
  active: {
    label: "Active",
    color: "bg-green-500/20 text-green-700 dark:text-green-300",
    dotColor: "bg-green-500",
  },
  working: {
    label: "Working",
    color: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  idle: {
    label: "Idle",
    color: "bg-zinc-500/20 text-zinc-600 dark:text-zinc-400",
    dotColor: "bg-zinc-400",
  },
  blocked: {
    label: "Blocked",
    color: "bg-red-500/20 text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
  },
};

export function getStatusInfo(status: AgentStatus) {
  return STATUS_CONFIG[status];
}

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

// ============================================
// Mock Data for Development
// ============================================

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-ceo",
    department: DEPARTMENTS[0], // CEO
    status: "active",
    currentTask: "Morning Briefing",
    lastActivity: Date.now() - 5 * 60 * 1000,
  },
  {
    id: "agent-pmo",
    department: DEPARTMENTS[1], // PMO
    status: "working",
    currentTask: "Sprint Review SQD",
    lastActivity: Date.now() - 15 * 60 * 1000,
  },
  {
    id: "agent-business",
    department: DEPARTMENTS[2], // Business
    status: "idle",
    lastActivity: Date.now() - 60 * 60 * 1000,
  },
  {
    id: "agent-personal",
    department: DEPARTMENTS[3], // Personal
    status: "idle",
    lastActivity: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: "agent-design",
    department: DEPARTMENTS[4], // Design
    status: "blocked",
    currentTask: "Logo Redesign",
    lastActivity: Date.now() - 30 * 60 * 1000,
  },
  {
    id: "agent-dev",
    department: DEPARTMENTS[5], // Dev
    status: "working",
    currentTask: "DieterHQ Office Dashboard",
    lastActivity: Date.now() - 2 * 60 * 1000,
  },
  {
    id: "agent-marketing",
    department: DEPARTMENTS[6], // Marketing
    status: "idle",
    lastActivity: Date.now() - 4 * 60 * 60 * 1000,
  },
  {
    id: "agent-research",
    department: DEPARTMENTS[7], // Research
    status: "working",
    currentTask: "AI Trends Q1 2026",
    lastActivity: Date.now() - 45 * 60 * 1000,
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "act-1",
    agentId: "agent-dev",
    action: "started working on",
    taskRef: "DieterHQ Office Dashboard",
    timestamp: Date.now() - 2 * 60 * 1000,
  },
  {
    id: "act-2",
    agentId: "agent-ceo",
    action: "completed",
    taskRef: "Weekly Planning",
    timestamp: Date.now() - 10 * 60 * 1000,
  },
  {
    id: "act-3",
    agentId: "agent-pmo",
    action: "started",
    taskRef: "Sprint Review SQD",
    timestamp: Date.now() - 15 * 60 * 1000,
  },
  {
    id: "act-4",
    agentId: "agent-design",
    action: "blocked on",
    taskRef: "Logo Redesign",
    timestamp: Date.now() - 30 * 60 * 1000,
  },
  {
    id: "act-5",
    agentId: "agent-research",
    action: "started researching",
    taskRef: "AI Trends Q1 2026",
    timestamp: Date.now() - 45 * 60 * 1000,
  },
  {
    id: "act-6",
    agentId: "agent-ceo",
    action: "delegated task to",
    taskRef: "PMO",
    timestamp: Date.now() - 60 * 60 * 1000,
  },
];

// ============================================
// Stats Helpers
// ============================================

export interface OfficeStats {
  active: number;
  working: number;
  idle: number;
  blocked: number;
  doneToday: number;
}

export function calculateStats(agents: Agent[]): OfficeStats {
  return {
    active: agents.filter((a) => a.status === "active").length,
    working: agents.filter((a) => a.status === "working").length,
    idle: agents.filter((a) => a.status === "idle").length,
    blocked: agents.filter((a) => a.status === "blocked").length,
    doneToday: 12, // Mock value - would come from task system
  };
}

// ============================================
// Time Formatting
// ============================================

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

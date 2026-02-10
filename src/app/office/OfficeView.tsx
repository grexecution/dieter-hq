"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "../_ui/AppShell";
import {
  MOCK_AGENTS,
  MOCK_ACTIVITIES,
  calculateStats,
  type Agent,
  type Activity,
} from "@/lib/office-data";
import { AgentCard } from "./AgentCard";
import { ActivityFeed } from "./ActivityFeed";
import { OfficeStats } from "./OfficeStats";
import { Building2, Wifi, WifiOff, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Live agent from Gateway API
interface LiveAgent {
  id: string;
  agentId: string;
  label: string;
  status: "active" | "working" | "idle" | "blocked";
  lastActivity: number | null;
  currentTask: string | null;
  progress: number | null;
  parentId: string | null;
}

// Map agent IDs to department IDs
function getDepartmentForAgent(agentId: string): string | null {
  const mapping: Record<string, string> = {
    main: "ceo",
    coder: "dev",
    work: "business",
    sport: "personal", // Sport agent → personal department
    researcher: "research",
    designer: "design",
    marketer: "marketing",
    pmo: "pmo",
    personal: "personal",
  };
  return mapping[agentId] || null;
}

// Map department IDs to agent IDs (reverse)
function getAgentForDepartment(departmentId: string): string | null {
  const mapping: Record<string, string> = {
    ceo: "main",
    dev: "coder",
    business: "work",
    personal: "sport", // Could also be 'personal' agent
    research: "researcher",
    design: "designer",
    marketing: "marketer",
    pmo: "pmo",
  };
  return mapping[departmentId] || null;
}

// Mock task data for the office view
interface OfficeTask {
  id: string;
  title: string;
  department: string;
  departmentEmoji: string;
  status: "in-progress" | "blocked" | "pending";
  priority: "P1" | "P2" | "P3";
  progress?: number;
}

const MOCK_OFFICE_TASKS: OfficeTask[] = [
  { id: "1", title: "Task Queue Feature", department: "Dev", departmentEmoji: "💻", status: "in-progress", priority: "P1", progress: 80 },
  { id: "2", title: "Fix Voice Recorder", department: "Dev", departmentEmoji: "💻", status: "blocked", priority: "P2" },
  { id: "3", title: "Logo Redesign", department: "Design", departmentEmoji: "🎨", status: "in-progress", priority: "P3", progress: 45 },
  { id: "4", title: "Q1 Report Analysis", department: "Research", departmentEmoji: "🔍", status: "in-progress", priority: "P2", progress: 60 },
];

const MOCK_UPCOMING_TASKS = [
  { id: "5", title: "Weekly Report" },
  { id: "6", title: "Email Triage" },
  { id: "7", title: "Client Call Prep" },
];

export function OfficeView() {
  const [agents] = React.useState<Agent[]>(MOCK_AGENTS);
  const [activities] = React.useState<Activity[]>(MOCK_ACTIVITIES);
  const [liveAgents, setLiveAgents] = React.useState<LiveAgent[]>([]);
  const [gatewayConnected, setGatewayConnected] = React.useState<boolean | null>(null);
  const [lastUpdate, setLastUpdate] = React.useState<number | null>(null);

  // Fetch live agents from Gateway
  React.useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/office/agents");
        const data = await res.json();
        setLiveAgents(data.agents || []);
        setLastUpdate(data.timestamp || Date.now());
        setGatewayConnected(!data.error);
      } catch (e) {
        console.error("Failed to fetch agents:", e);
        setGatewayConnected(false);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Merge live data with static agents
  const mergedAgents = React.useMemo(() => {
    return agents.map((agent) => {
      const agentId = getAgentForDepartment(agent.department.id);
      if (!agentId) return agent;
      
      // Find all live sessions for this agent
      const agentSessions = liveAgents.filter((la) => la.agentId === agentId);
      
      if (agentSessions.length === 0) return agent;
      
      // Use the most recent session's status
      const mostRecent = agentSessions.reduce((a, b) => 
        (a.lastActivity || 0) > (b.lastActivity || 0) ? a : b
      );
      
      // Count active sessions
      const activeSessions = agentSessions.filter(
        (s) => s.status === 'active' || s.status === 'working'
      );

      return {
        ...agent,
        status: mostRecent.status,
        currentTask: activeSessions.length > 1 
          ? `${activeSessions.length} active sessions`
          : mostRecent.currentTask || agent.currentTask,
        lastActivity: mostRecent.lastActivity || agent.lastActivity,
      };
    });
  }, [agents, liveAgents]);

  // Get subagents for each department
  const getSubagentsForDepartment = React.useCallback(
    (departmentId: string): LiveAgent[] => {
      const agentId = getAgentForDepartment(departmentId);
      if (!agentId) return [];
      
      // Return all sessions for this agent (they are "subagents" of the department)
      return liveAgents.filter((la) => {
        return la.agentId === agentId && (la.status === 'active' || la.status === 'working');
      });
    },
    [liveAgents]
  );

  const stats = calculateStats(mergedAgents);

  // Organize agents by hierarchy
  const getAgentByDepartment = (deptId: string) => 
    mergedAgents.find(a => a.department.id === deptId);

  const ceo = getAgentByDepartment("ceo");
  const tier1 = ["pmo", "dev", "business"].map(id => getAgentByDepartment(id)).filter(Boolean) as Agent[];
  const tier2 = ["design", "marketing", "research"].map(id => getAgentByDepartment(id)).filter(Boolean) as Agent[];
  const personal = getAgentByDepartment("personal");

  // Get current date
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <AppShell active="office">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl glass">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Virtual Office
              </h1>
              <p className="text-sm text-muted-foreground">{today}</p>
            </div>
          </div>
          
          {/* Gateway connection status */}
          <div className="flex items-center gap-2 text-xs">
            {gatewayConnected === null ? (
              <span className="text-muted-foreground">Connecting...</span>
            ) : gatewayConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Gateway Live</span>
                {liveAgents.length > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({liveAgents.length} sessions)
                  </span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Offline Mode</span>
              </>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <OfficeStats stats={stats} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Cards - Hierarchy Layout */}
          <div className="lg:col-span-2 space-y-4">
            {/* CEO - Top Level */}
            {ceo && (
              <div className="flex justify-center">
                <div className="w-full max-w-[200px]">
                  <AgentCard 
                    agent={ceo}
                    subagents={getSubagentsForDepartment(ceo.department.id)}
                  />
                </div>
              </div>
            )}

            {/* Connecting Line */}
            <div className="flex justify-center">
              <div className="w-px h-4 bg-border" />
            </div>

            {/* Tier 1: PMO, Dev, Business */}
            <div className="flex justify-center gap-3">
              {tier1.map((agent) => (
                <div key={agent.id} className="w-full max-w-[140px] md:max-w-[160px]">
                  <AgentCard 
                    agent={agent}
                    subagents={getSubagentsForDepartment(agent.department.id)}
                  />
                </div>
              ))}
            </div>

            {/* Connecting Lines */}
            <div className="flex justify-center gap-[100px] md:gap-[140px]">
              <div className="w-px h-4 bg-border" />
              <div className="w-px h-4 bg-border" />
              <div className="w-px h-4 bg-border" />
            </div>

            {/* Tier 2: Design, Marketing, Research */}
            <div className="flex justify-center gap-3">
              {tier2.map((agent) => (
                <div key={agent.id} className="w-full max-w-[140px] md:max-w-[160px]">
                  <AgentCard 
                    agent={agent}
                    subagents={getSubagentsForDepartment(agent.department.id)}
                  />
                </div>
              ))}
            </div>

            {/* Connecting Line */}
            <div className="flex justify-center">
              <div className="w-px h-4 bg-border" />
            </div>

            {/* Personal - Bottom */}
            {personal && (
              <div className="flex justify-center">
                <div className="w-full max-w-[200px]">
                  <AgentCard 
                    agent={personal}
                    subagents={getSubagentsForDepartment(personal.department.id)}
                  />
                </div>
              </div>
            )}

            {/* Task Integration Section */}
            <div className="mt-8 space-y-4">
              {/* Active Tasks */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    📋 Active Tasks
                  </h3>
                  <Link 
                    href="/kanban" 
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View All <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {MOCK_OFFICE_TASKS.map((task) => (
                    <div 
                      key={task.id} 
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg bg-muted/50 transition-colors hover:bg-muted",
                        task.status === "blocked" && "border-l-2 border-red-500"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        task.priority === "P1" && "bg-red-500/20 text-red-700 dark:text-red-300",
                        task.priority === "P2" && "bg-orange-500/20 text-orange-700 dark:text-orange-300",
                        task.priority === "P3" && "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                      )}>
                        {task.priority}
                      </span>
                      <span className="flex-1 text-sm truncate">{task.title}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>{task.departmentEmoji}</span>
                        <span className="hidden sm:inline">{task.department}</span>
                      </span>
                      {task.status === "blocked" ? (
                        <span className="text-[10px] text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          blocked
                        </span>
                      ) : task.progress !== undefined ? (
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {task.progress}%
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* Up Next */}
              <div className="glass rounded-xl p-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  📥 Up Next
                </h3>
                <div className="space-y-1.5">
                  {MOCK_UPCOMING_TASKS.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Clock className="h-3 w-3" />
                      <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed - Takes 1/3 on large screens */}
          <div className="lg:col-span-1">
            <ActivityFeed activities={activities} agents={mergedAgents} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

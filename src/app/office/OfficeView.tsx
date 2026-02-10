"use client";

import * as React from "react";
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
import { Building2, Wifi, WifiOff } from "lucide-react";

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
          {/* Agent Cards - Takes 2/3 on large screens */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mergedAgents.map((agent) => (
                <AgentCard 
                  key={agent.id} 
                  agent={agent}
                  subagents={getSubagentsForDepartment(agent.department.id)}
                />
              ))}
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

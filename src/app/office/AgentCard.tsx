"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { type Agent, getStatusInfo, formatTimeAgo, STATUS_CONFIG } from "@/lib/office-data";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";

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

interface AgentCardProps {
  agent: Agent;
  subagents?: LiveAgent[];
  onClick?: () => void;
}

export function AgentCard({ agent, subagents = [], onClick }: AgentCardProps) {
  const statusInfo = getStatusInfo(agent.status);
  const [expanded, setExpanded] = React.useState(false);
  
  const activeSubagents = subagents.filter(s => s.status === 'active' || s.status === 'working');
  const hasSubagents = subagents.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          "group relative rounded-xl p-4 cursor-pointer",
          "glass transition-all duration-200",
          "hover:shadow-md hover:-translate-y-0.5",
          "active:scale-[0.98] active:shadow-sm",
          "flex flex-col items-center text-center gap-2"
        )}
        onClick={hasSubagents ? () => setExpanded(!expanded) : onClick}
      >
        {/* Status indicator dot - top right */}
        <div
          className={cn(
            "absolute top-2 right-2 w-2.5 h-2.5 rounded-full",
            statusInfo.dotColor,
            agent.status === "active" && "animate-pulse"
          )}
        />

        {/* Active subagent count - top left */}
        {activeSubagents.length > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5">
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
              {activeSubagents.length}
            </span>
          </div>
        )}

        {/* Department Emoji */}
        <div className="text-3xl">{agent.department.emoji}</div>

        {/* Department Name */}
        <h3 className="font-semibold text-sm">{agent.department.name}</h3>

        {/* Status Badge */}
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
            statusInfo.color
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              statusInfo.dotColor
            )}
          />
          {statusInfo.label}
        </span>

        {/* Current Task or Idle Info */}
        {agent.currentTask ? (
          <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[28px]">
            {agent.currentTask}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground/60 min-h-[28px]">
            {agent.lastActivity ? formatTimeAgo(agent.lastActivity) : "No activity"}
          </p>
        )}

        {/* Expand indicator if has subagents */}
        {hasSubagents && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            {expanded ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Subagent list - expanded */}
      {hasSubagents && expanded && (
        <div className="ml-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {subagents.map((sub) => (
            <SubagentRow key={sub.id} agent={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubagentRow({ agent }: { agent: LiveAgent }) {
  const statusConfig = STATUS_CONFIG[agent.status];
  
  // Extract short name from label
  const shortName = agent.label
    .replace(/^agent:/, '')
    .replace(/:subagent:.*$/, '')
    .split(':')
    .pop() || agent.agentId;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50 text-xs">
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          statusConfig.dotColor,
          agent.status === "active" && "animate-pulse"
        )}
      />
      <span className="font-medium truncate flex-1">
        {shortName}
      </span>
      {agent.currentTask && (
        <span className="text-muted-foreground truncate max-w-[80px]">
          {agent.currentTask}
        </span>
      )}
    </div>
  );
}

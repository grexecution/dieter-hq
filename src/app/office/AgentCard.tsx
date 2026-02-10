"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { type Agent, getStatusInfo, formatTimeAgo } from "@/lib/office-data";

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const statusInfo = getStatusInfo(agent.status);

  return (
    <div
      className={cn(
        "group relative rounded-xl p-4 cursor-pointer",
        "glass transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        "active:scale-[0.98] active:shadow-sm",
        "flex flex-col items-center text-center gap-2"
      )}
      onClick={onClick}
    >
      {/* Status indicator dot - top right */}
      <div
        className={cn(
          "absolute top-2 right-2 w-2.5 h-2.5 rounded-full",
          statusInfo.dotColor,
          agent.status === "active" && "animate-pulse"
        )}
      />

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
    </div>
  );
}

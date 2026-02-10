"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type Agent,
  type Activity,
  formatTimeAgo,
  getDepartmentById,
} from "@/lib/office-data";
import { ScrollArea } from "@/components/ui";
import { Activity as ActivityIcon } from "lucide-react";

interface ActivityFeedProps {
  activities: Activity[];
  agents: Agent[];
}

export function ActivityFeed({ activities, agents }: ActivityFeedProps) {
  const getAgentDepartment = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.department;
  };

  return (
    <div className="glass rounded-xl overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Recent Activity</h3>
      </div>

      {/* Activity List */}
      <ScrollArea className="h-[400px]">
        <div className="p-3 space-y-3">
          {activities.map((activity) => {
            const dept = getAgentDepartment(activity.agentId);
            if (!dept) return null;

            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg",
                  "hover:bg-muted/50 transition-colors"
                )}
              >
                {/* Agent Emoji */}
                <div className="flex-shrink-0 text-lg">{dept.emoji}</div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{dept.name}</span>{" "}
                    <span className="text-muted-foreground">
                      {activity.action}
                    </span>{" "}
                    {activity.taskRef && (
                      <span className="font-medium text-primary">
                        {activity.taskRef}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}

          {activities.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

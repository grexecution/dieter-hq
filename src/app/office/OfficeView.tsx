"use client";

import * as React from "react";
import { AppShell } from "../_ui/AppShell";
import { cn } from "@/lib/utils";
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
import { Building2 } from "lucide-react";

export function OfficeView() {
  const [agents] = React.useState<Agent[]>(MOCK_AGENTS);
  const [activities] = React.useState<Activity[]>(MOCK_ACTIVITIES);
  const stats = calculateStats(agents);

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
        </div>

        {/* Stats Bar */}
        <OfficeStats stats={stats} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Cards - Takes 2/3 on large screens */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>

          {/* Activity Feed - Takes 1/3 on large screens */}
          <div className="lg:col-span-1">
            <ActivityFeed activities={activities} agents={agents} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

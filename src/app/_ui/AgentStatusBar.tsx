"use client";

import { useState, useEffect } from "react";
import { Activity, Zap, Clock, Users, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SubAgent {
  id: string;
  name: string;
  status: "running" | "idle" | "error";
  task: string;
  duration: number; // in seconds
}

export function AgentStatusBar() {
  const [currentStatus, setCurrentStatus] = useState("Ready");
  const [tokensCost, setTokensCost] = useState(0.42);
  const [subAgents, setSubAgents] = useState<SubAgent[]>([
    {
      id: "1",
      name: "Code Review Agent",
      status: "idle",
      task: "Monitoring PRs",
      duration: 0
    }
  ]);
  const [taskQueue, setTaskQueue] = useState(2);
  const [memoryUsage, setMemoryUsage] = useState(68);

  // Simulate live updates
  useEffect(() => {
    const statusMessages = [
      "Ready",
      "Processing inbox...",
      "Analyzing project health...",
      "Generating suggestions...",
      "Monitoring chat...",
      "Checking calendar..."
    ];
    
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * statusMessages.length);
      setCurrentStatus(statusMessages[randomIndex]);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-50 border-b border-white/20 bg-white/70 shadow-sm backdrop-blur-2xl dark:border-zinc-800/60 dark:bg-zinc-950/55">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Left: Current Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />
            </div>
            <span className="text-sm font-medium">Dieter:</span>
          </div>
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {currentStatus}
          </span>
        </div>

        {/* Center: Metrics */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span>€{tokensCost.toFixed(2)}</span>
            <span className="text-muted-foreground">today</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-500" />
            <span>{taskQueue}</span>
            <span className="text-muted-foreground">queued</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-purple-500" />
            <span>{subAgents.filter(a => a.status === "running").length}</span>
            <span className="text-muted-foreground">active</span>
          </div>

          <div className="flex items-center gap-1">
            <div className={cn(
              "h-3 w-3 rounded-full",
              memoryUsage < 70 ? "bg-green-500" : memoryUsage < 90 ? "bg-yellow-500" : "bg-red-500"
            )} />
            <span>{memoryUsage}%</span>
            <span className="text-muted-foreground">memory</span>
          </div>
        </div>

        {/* Right: Sub-agents Status */}
        <div className="flex items-center gap-2">
          {subAgents.map((agent) => (
            <Badge 
              key={agent.id}
              variant={
                agent.status === "running" ? "default" : 
                agent.status === "error" ? "destructive" : "secondary"
              }
              className="text-xs h-6"
            >
              {agent.status === "running" && <Activity className="h-2 w-2 mr-1 animate-pulse" />}
              {agent.status === "error" && <AlertCircle className="h-2 w-2 mr-1" />}
              {agent.status === "idle" && <CheckCircle className="h-2 w-2 mr-1" />}
              {agent.name.split(" ")[0]}
            </Badge>
          ))}
          
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
            +
          </Button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Activity, Zap, Clock, Users, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubAgent {
  id: string;
  name: string;
  status: "running" | "idle" | "error";
  task: string;
  duration: number;
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
    <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Left: Current Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Dieter:</span>
          </div>
          <span className="text-sm text-zinc-500 truncate max-w-[200px]">
            {currentStatus}
          </span>
        </div>

        {/* Center: Metrics */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>€{tokensCost.toFixed(2)}</span>
            <span className="text-zinc-400 dark:text-zinc-500">today</span>
          </div>
          
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <Clock className="h-3 w-3 text-indigo-500" />
            <span>{taskQueue}</span>
            <span className="text-zinc-400 dark:text-zinc-500">queued</span>
          </div>
          
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <Users className="h-3 w-3 text-indigo-500" />
            <span>{subAgents.filter(a => a.status === "running").length}</span>
            <span className="text-zinc-400 dark:text-zinc-500">active</span>
          </div>

          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <div className={cn(
              "h-3 w-3 rounded-full",
              memoryUsage < 70 ? "bg-emerald-500" : memoryUsage < 90 ? "bg-amber-500" : "bg-red-500"
            )} />
            <span>{memoryUsage}%</span>
            <span className="text-zinc-400 dark:text-zinc-500">memory</span>
          </div>
        </div>

        {/* Right: Sub-agents Status */}
        <div className="flex items-center gap-2">
          {subAgents.map((agent) => (
            <span 
              key={agent.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                agent.status === "running" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
                agent.status === "error" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                agent.status === "idle" && "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              )}
            >
              {agent.status === "running" && <Activity className="h-2 w-2" />}
              {agent.status === "error" && <AlertCircle className="h-2 w-2" />}
              {agent.status === "idle" && <CheckCircle className="h-2 w-2" />}
              {agent.name.split(" ")[0]}
            </span>
          ))}
          
          <button className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
            +
          </button>
        </div>
      </div>
    </div>
  );
}

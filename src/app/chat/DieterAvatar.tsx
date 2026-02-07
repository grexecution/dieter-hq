"use client";

import { useEffect, useState, useMemo } from "react";
import { Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ActivityPayload = {
  ok: boolean;
  agents: Array<{
    sessionKey: string;
    agentId: string;
    label: string;
    model: string;
    status: 'active' | 'idle' | 'error';
    workspace?: string;
    tokens: { total: number };
    runtimeMs: number;
  }>;
  summary: {
    total: number;
    active: number;
    idle: number;
    totalTokens: number;
  };
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

interface DieterAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showDialog?: boolean;
}

export function DieterAvatar({ size = "md", className, showDialog = true }: DieterAvatarProps) {
  const [data, setData] = useState<ActivityPayload | null>(null);
  const [open, setOpen] = useState(false);

  // Fetch activity data
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const r = await fetch("/api/agents/activity", { cache: "no-store" });
        if (r.ok) {
          const json = await r.json();
          if (!cancelled) setData(json);
        }
      } catch {
        // Ignore errors
      }
    };

    void tick();
    const id = setInterval(() => void tick(), 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const isWorking = useMemo(() => (data?.summary?.active ?? 0) > 0, [data]);
  
  const sizeClasses = {
    sm: "h-7 w-7 md:h-8 md:w-8",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const avatarContent = (
    <Avatar 
      className={cn(
        sizeClasses[size],
        "shrink-0 flex-none cursor-pointer transition-all duration-300",
        isWorking && "ring-2 ring-amber-400 ring-offset-1 ring-offset-background",
        className
      )}
    >
      <AvatarImage src="/dieter-avatar.png" alt="Dieter" />
      <AvatarFallback 
        className={cn(
          "text-white text-[10px] md:text-xs font-medium transition-colors duration-300",
          isWorking 
            ? "bg-gradient-to-br from-amber-500 to-orange-600" 
            : "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
        )}
      >
        <Bot 
          className={cn(
            iconSizes[size],
            "transition-transform",
            isWorking && "animate-spin"
          )} 
          style={isWorking ? { animationDuration: "3s" } : undefined}
        />
      </AvatarFallback>
    </Avatar>
  );

  if (!showDialog) return avatarContent;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {avatarContent}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full",
                isWorking ? "animate-ping bg-amber-500/50" : "animate-ping bg-emerald-500/50"
              )} />
              <span className={cn(
                "relative inline-flex h-2.5 w-2.5 rounded-full",
                isWorking ? "bg-amber-500" : "bg-emerald-500"
              )} />
            </span>
            {isWorking ? "Dieter arbeitet..." : "Dieter ist bereit"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground mb-4">
          {data?.summary?.total ?? 0} Sessions • {formatTokens(data?.summary?.totalTokens ?? 0)} Tokens
        </div>
        
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {data?.agents?.slice(0, 8).map((agent) => (
              <div
                key={agent.sessionKey}
                className={cn(
                  "rounded-lg p-3 text-sm",
                  agent.status === 'active' 
                    ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" 
                    : "bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    agent.status === 'active' ? "bg-amber-500 animate-pulse" : "bg-zinc-400"
                  )} />
                  <span className="font-medium">{agent.workspace || agent.label}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex justify-between">
                  <span>{agent.model.split('/').pop()}</span>
                  <span>{formatTokens(agent.tokens.total)} tokens</span>
                </div>
              </div>
            ))}
            
            {(!data?.agents || data.agents.length === 0) && (
              <div className="text-muted-foreground text-center py-4">
                Keine aktiven Sessions
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

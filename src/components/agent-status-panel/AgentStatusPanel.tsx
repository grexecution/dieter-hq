"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Brain, 
  DollarSign, 
  Clock, 
  X,
  Activity,
  Users,
  Cpu
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

type SubAgent = {
  id: string;
  name: string;
  status: "active" | "idle" | "error" | "completed";
  task: string;
  startTime: number;
  progress?: number;
};

type TokenUsage = {
  today: number;
  thisMonth: number;
  costToday: number;
  costMonth: number;
};

type AgentStatus = {
  current: string;
  next: string;
  sinceMs: number | null;
  updatedAtMs: number | null;
  subAgents: SubAgent[];
  tokenUsage: TokenUsage;
  isThinking: boolean;
};

// ============================================================================
// Component Variants
// ============================================================================

const statusPanelVariants = cva(
  "h-[calc(100dvh-120px)] border border-zinc-200/70 bg-white/60 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40 transition-all duration-300",
  {
    variants: {
      collapsed: {
        false: "w-80 rounded-2xl p-4",
        true: "w-14 rounded-xl p-2"
      }
    },
    defaultVariants: {
      collapsed: false
    }
  }
);

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full",
  {
    variants: {
      status: {
        active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
        idle: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", 
        error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
        completed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      }
    },
    defaultVariants: {
      status: "active"
    }
  }
);

// ============================================================================
// Utility Functions
// ============================================================================

function formatRelative(ms: number | null): string {
  if (!ms) return "—";
  const delta = Date.now() - ms;
  const s = Math.max(0, Math.round(delta / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return `${h}h`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatTime(ms: number | null): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Vienna",
  }).format(new Date(ms));
}

// ============================================================================
// Mock Data (replace with real API)
// ============================================================================

const mockAgentStatus: AgentStatus = {
  current: "Analysiere DieterHQ Komponenten-Struktur",
  next: "Erstelle Agent Status Panel",
  sinceMs: Date.now() - 180000, // 3 minutes ago
  updatedAtMs: Date.now() - 5000, // 5 seconds ago
  isThinking: true,
  subAgents: [
    {
      id: "sub-1",
      name: "Code Agent",
      status: "active",
      task: "Erstellt React Komponente",
      startTime: Date.now() - 300000,
      progress: 65
    },
    {
      id: "sub-2", 
      name: "Research Agent",
      status: "completed",
      task: "GitHub Issue Analysis",
      startTime: Date.now() - 600000,
      progress: 100
    },
    {
      id: "sub-3",
      name: "Test Agent", 
      status: "error",
      task: "Unit Test Ausführung",
      startTime: Date.now() - 120000
    }
  ],
  tokenUsage: {
    today: 45280,
    thisMonth: 892150,
    costToday: 12.47,
    costMonth: 247.85
  }
};

// ============================================================================
// Sub Components
// ============================================================================

interface StatusIndicatorProps {
  status: string;
  isThinking: boolean;
  since: number | null;
  updatedAt: number | null;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  isThinking,
  since,
  updatedAt
}) => (
  <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
    <div className="relative overflow-hidden">
      {/* Thinking Animation */}
      {isThinking && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
          animate={{
            x: ["-100%", "100%"]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Gerade</div>
          <AnimatePresence>
            {isThinking && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex space-x-0.5"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                    animate={{
                      y: [0, -4, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.div 
          className="mt-1 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50"
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {status}
        </motion.div>

        <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>seit {formatRelative(since)}</span>
          <span>{formatTime(since)}</span>
        </div>
      </div>
    </div>
  </div>
);

interface TokenCounterProps {
  usage: TokenUsage;
}

const TokenCounter: React.FC<TokenCounterProps> = ({ usage }) => (
  <div className="grid grid-cols-2 gap-3">
    <motion.div 
      className="rounded-lg border border-zinc-200/50 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 p-3 dark:from-emerald-950/50 dark:to-teal-950/50"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <div className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Heute</div>
      </div>
      <div className="mt-1">
        <div className="text-base font-bold text-emerald-900 dark:text-emerald-100">
          {usage.today.toLocaleString()}
        </div>
        <div className="text-xs text-emerald-700 dark:text-emerald-300">
          {formatCurrency(usage.costToday)}
        </div>
      </div>
    </motion.div>

    <motion.div 
      className="rounded-lg border border-zinc-200/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-3 dark:from-blue-950/50 dark:to-indigo-950/50"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="flex items-center gap-2">
        <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <div className="text-xs font-medium text-blue-800 dark:text-blue-200">Monat</div>
      </div>
      <div className="mt-1">
        <div className="text-base font-bold text-blue-900 dark:text-blue-100">
          {usage.thisMonth.toLocaleString()}
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300">
          {formatCurrency(usage.costMonth)}
        </div>
      </div>
    </motion.div>
  </div>
);

interface SubAgentListProps {
  subAgents: SubAgent[];
  onKillAgent: (id: string) => void;
}

const SubAgentList: React.FC<SubAgentListProps> = ({ subAgents, onKillAgent }) => (
  <div className="space-y-2">
    <AnimatePresence>
      {subAgents.map((agent) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg border border-zinc-200/50 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Brain className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                <div className="font-medium text-zinc-800 dark:text-zinc-200">{agent.name}</div>
                <div className={cn(statusBadgeVariants({ status: agent.status }))}>
                  {agent.status === "active" && <Activity className="h-3 w-3" />}
                  {agent.status === "idle" && <Clock className="h-3 w-3" />}
                  {agent.status === "error" && <X className="h-3 w-3" />}
                  {agent.status === "completed" && <Cpu className="h-3 w-3" />}
                  {agent.status}
                </div>
              </div>
              
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {agent.task}
              </div>
              
              {agent.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Fortschritt</span>
                    <span>{agent.progress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${agent.progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                seit {formatRelative(agent.startTime)}
              </div>
            </div>
            
            {agent.status === "active" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onKillAgent(agent.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
    
    {subAgents.length === 0 && (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white/40 p-3 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
        Keine aktiven Subagents
      </div>
    )}
  </div>
);

interface CollapsedViewProps {
  agentCount: number;
  isThinking: boolean;
}

const CollapsedView: React.FC<CollapsedViewProps> = ({ agentCount, isThinking }) => (
  <div className="flex h-full flex-col items-center justify-center gap-4">
    <div className="relative">
      <Brain className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
      {isThinking && (
        <motion.div
          className="absolute -inset-1 rounded-full border-2 border-emerald-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
    
    {agentCount > 0 && (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        {agentCount}
      </div>
    )}
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export interface AgentStatusPanelProps extends VariantProps<typeof statusPanelVariants> {
  className?: string;
  defaultCollapsed?: boolean;
}

export function AgentStatusPanel({ 
  className, 
  defaultCollapsed = false 
}: AgentStatusPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>(mockAgentStatus);

  // Handle subagent kill
  const handleKillAgent = (id: string) => {
    setAgentStatus(prev => ({
      ...prev,
      subAgents: prev.subAgents.filter(agent => agent.id !== id)
    }));
  };

  // Auto-collapse on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && !collapsed) {
        setCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [collapsed]);

  // Mock data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentStatus(prev => ({
        ...prev,
        updatedAtMs: Date.now(),
        isThinking: Math.random() > 0.7 // 30% chance of thinking
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const activeSubAgents = agentStatus.subAgents.filter(agent => agent.status === "active");

  return (
    <motion.aside 
      className={cn(statusPanelVariants({ collapsed }), className)}
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <AnimatePresence mode="wait">
        {collapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <div className="mb-2 flex justify-center">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCollapsed(false)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <CollapsedView 
              agentCount={activeSubAgents.length} 
              isThinking={agentStatus.isThinking} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold leading-tight">Agent Status</div>
                  <span className="relative inline-flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/50" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {activeSubAgents.length} active • {agentStatus.subAgents.length} total
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCollapsed(true)}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            </div>

            <Separator className="my-4" />

            <ScrollArea className="h-[calc(100%-100px)] pr-3">
              <div className="space-y-6">
                {/* Current Status */}
                <section className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Aktueller Status
                  </div>
                  <StatusIndicator
                    status={agentStatus.current}
                    isThinking={agentStatus.isThinking}
                    since={agentStatus.sinceMs}
                    updatedAt={agentStatus.updatedAtMs}
                  />
                </section>

                {/* Token Usage */}
                <section className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Token Verbrauch
                  </div>
                  <TokenCounter usage={agentStatus.tokenUsage} />
                </section>

                {/* SubAgents */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Subagents ({agentStatus.subAgents.length})
                    </div>
                    <Badge variant="outline" className="h-5 text-[10px]">
                      <Users className="mr-1 h-2.5 w-2.5" />
                      {activeSubAgents.length} aktiv
                    </Badge>
                  </div>
                  <SubAgentList 
                    subAgents={agentStatus.subAgents} 
                    onKillAgent={handleKillAgent}
                  />
                </section>

                {/* Next Task Preview */}
                {agentStatus.next && (
                  <section className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Als Nächstes
                    </div>
                    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300">
                      {agentStatus.next}
                    </div>
                  </section>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

export default AgentStatusPanel;
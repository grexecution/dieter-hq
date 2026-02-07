"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export type AgentStatusType = "active" | "idle" | "error";

interface AgentStatusBadgeProps {
  status: AgentStatusType;
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ============================================
// Status Config
// ============================================

const statusConfig: Record<AgentStatusType, { 
  emoji: string; 
  label: string; 
  dotColor: string;
  bgColor: string;
  textColor: string;
}> = {
  active: {
    emoji: "🟢",
    label: "Active",
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-100/80 dark:bg-emerald-950/50",
    textColor: "text-emerald-800 dark:text-emerald-200",
  },
  idle: {
    emoji: "⚪",
    label: "Idle",
    dotColor: "bg-zinc-400",
    bgColor: "bg-zinc-100/80 dark:bg-zinc-800/50",
    textColor: "text-zinc-600 dark:text-zinc-400",
  },
  error: {
    emoji: "🔴",
    label: "Error",
    dotColor: "bg-red-500",
    bgColor: "bg-red-100/80 dark:bg-red-950/50",
    textColor: "text-red-800 dark:text-red-200",
  },
};

const sizeConfig = {
  sm: {
    badge: "px-1.5 py-0.5 text-[10px] gap-1",
    dot: "h-1.5 w-1.5",
    pulse: "h-2 w-2",
  },
  md: {
    badge: "px-2 py-1 text-xs gap-1.5",
    dot: "h-2 w-2",
    pulse: "h-2.5 w-2.5",
  },
  lg: {
    badge: "px-2.5 py-1.5 text-sm gap-2",
    dot: "h-2.5 w-2.5",
    pulse: "h-3 w-3",
  },
};

// ============================================
// Component
// ============================================

export function AgentStatusBadge({
  status,
  label,
  showLabel = true,
  size = "md",
  className,
}: AgentStatusBadgeProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bgColor,
        config.textColor,
        sizes.badge,
        className
      )}
    >
      {/* Animated Dot */}
      <span className="relative flex items-center justify-center">
        {/* Pulse animation for active status */}
        {status === "active" && (
          <motion.span
            className={cn(
              "absolute rounded-full",
              config.dotColor,
              sizes.pulse
            )}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        <span
          className={cn(
            "relative rounded-full",
            config.dotColor,
            sizes.dot
          )}
        />
      </span>

      {/* Label */}
      {showLabel && (
        <span className="leading-none">
          {label || config.label}
        </span>
      )}
    </span>
  );
}

// ============================================
// Compact Dot-Only Variant
// ============================================

interface AgentStatusDotProps {
  status: AgentStatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
  title?: string;
}

export function AgentStatusDot({
  status,
  size = "md",
  className,
  title,
}: AgentStatusDotProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      title={title || config.label}
    >
      {status === "active" && (
        <motion.span
          className={cn("absolute rounded-full", config.dotColor, sizes.pulse)}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      <span className={cn("relative rounded-full", config.dotColor, sizes.dot)} />
    </span>
  );
}

export default AgentStatusBadge;

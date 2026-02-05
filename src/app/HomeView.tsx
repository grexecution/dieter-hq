"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Calendar,
  LayoutGrid,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Activity,
} from "lucide-react";

import { AppShell } from "./_ui/AppShell";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { cn } from "@/lib/utils";

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Quick Action Card Component
interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  iconColor: string;
}

function QuickActionCard({
  href,
  icon: Icon,
  label,
  description,
  gradient,
  iconColor,
}: QuickActionProps) {
  return (
    <motion.div variants={itemVariants}>
      <Link href={href} className="block">
        <GlassCard
          interactive
          padding="lg"
          className="group relative overflow-hidden"
        >
          {/* Gradient background accent */}
          <div
            className={cn(
              "absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl transition-all group-hover:opacity-30",
              gradient
            )}
          />

          <div className="relative flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                "bg-gradient-to-br",
                gradient
              )}
            >
              <Icon className={cn("h-6 w-6", iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold tracking-tight">{label}</h3>
                <ArrowRight className="h-4 w-4 text-foreground-tertiary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </div>
              <p className="mt-1 text-sm text-foreground-secondary line-clamp-2">
                {description}
              </p>
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

// Status Card Component
function StatusCard() {
  return (
    <motion.div variants={itemVariants}>
      <GlassCard variant="medium" padding="lg" className="relative overflow-hidden group">
        {/* Animated gradient background */}
        <motion.div 
          className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-400/30 via-green-500/20 to-teal-500/30 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold tracking-tight">Agent Status</h3>
              <p className="text-sm text-foreground-secondary">All systems operational</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-foreground-secondary">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-foreground-secondary">Ready</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Greeting Component
function Greeting() {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  let emoji = "🌙";
  let gradientClass = "from-indigo-500 via-purple-500 to-pink-500";

  if (hour < 12) {
    greeting = "Good morning";
    emoji = "☀️";
    gradientClass = "from-amber-500 via-orange-500 to-rose-500";
  } else if (hour < 17) {
    greeting = "Good afternoon";
    emoji = "🌤";
    gradientClass = "from-sky-500 via-blue-500 to-indigo-500";
  }

  return (
    <motion.div variants={itemVariants} className="mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", gradientClass)}>
              {greeting}
            </span>{" "}
            <span className="inline-block text-3xl md:text-4xl">{emoji}</span>
          </h1>
          <p className="mt-2 text-foreground-secondary text-lg">
            What would you like to do today?
          </p>
        </div>
        <motion.div 
          className="hidden md:block"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <Sparkles className="h-4 w-4" />
            <span>Dieter is ready</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Quick Actions Data
const QUICK_ACTIONS: QuickActionProps[] = [
  {
    href: "/chat",
    icon: MessageCircle,
    label: "Chat with Dieter",
    description: "Start a conversation, ask questions, or get help with anything",
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    iconColor: "text-white",
  },
  {
    href: "/calendar",
    icon: Calendar,
    label: "Calendar",
    description: "View your schedule and upcoming events",
    gradient: "from-fuchsia-500 via-purple-500 to-indigo-500",
    iconColor: "text-white",
  },
  {
    href: "/kanban",
    icon: LayoutGrid,
    label: "Tasks",
    description: "Manage your tasks and projects",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    iconColor: "text-white",
  },
];

// Shortcut Pills
function ShortcutPills() {
  const shortcuts = [
    { label: "New chat", icon: MessageCircle, href: "/chat", color: "text-blue-500", bg: "hover:bg-blue-500/10" },
    { label: "Today", icon: Clock, href: "/calendar", color: "text-purple-500", bg: "hover:bg-purple-500/10" },
    { label: "Quick note", icon: Zap, href: "/chat", color: "text-amber-500", bg: "hover:bg-amber-500/10" },
  ];

  return (
    <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
      {shortcuts.map((s, i) => (
        <motion.div
          key={s.label}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link href={s.href}>
            <GlassButton variant="glass" size="sm" className={cn("gap-2 transition-colors", s.bg)}>
              <s.icon className={cn("h-4 w-4", s.color)} />
              {s.label}
            </GlassButton>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

export function HomeView() {
  return (
    <AppShell active="home">
      <motion.div
        className="mx-auto max-w-3xl"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Greeting */}
        <Greeting />

        {/* Quick Shortcuts */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-foreground-tertiary">
            Quick Actions
          </h2>
          <ShortcutPills />
        </motion.div>

        {/* Main Actions Grid */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.href} {...action} />
            ))}
          </div>
        </motion.div>

        {/* Status Section */}
        <motion.div variants={itemVariants}>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-foreground-tertiary">
            Status
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <StatusCard />
            <motion.div variants={itemVariants}>
              <GlassCard variant="subtle" padding="lg" className="relative overflow-hidden group">
                {/* Subtle gradient accent */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-violet-500/15 blur-2xl transition-opacity group-hover:opacity-75" />
                
                <div className="relative flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-tight">Recent</h3>
                    <p className="text-sm text-foreground-secondary">
                      Continue where you left off
                    </p>
                  </div>
                </div>
                <div className="relative mt-4">
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 transition-all hover:gap-3"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Open last conversation
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          variants={itemVariants}
          className="mt-12 text-center text-xs text-foreground-tertiary"
        >
          <span className="text-base">🐕</span> Dieter HQ • Your personal AI homebase
        </motion.p>
      </motion.div>
    </AppShell>
  );
}

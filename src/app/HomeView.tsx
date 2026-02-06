"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Calendar,
  LayoutGrid,
  Inbox,
  Clock,
  ArrowRight,
  Circle,
  CheckCircle2,
  Mail,
  AlertCircle,
  Activity,
  Zap,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { AppShell } from "./_ui/AppShell";
import { cn } from "@/lib/utils";
import { DEMO_EVENTS, getUpcomingEvents, formatTime } from "@/lib/calendar-data";

// ============================================
// Types
// ============================================

interface InboxStats {
  pending: number;
  unread: number;
  urgent: number;
}

interface OpenClawStatus {
  online: boolean;
  latencyMs?: number;
  lastCheck: number;
}

interface ActivityItem {
  id: string;
  type: "message" | "task" | "calendar" | "inbox";
  title: string;
  description?: string;
  timestamp: number;
}

// ============================================
// Animation variants
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ============================================
// Greeting - Dynamic time-based
// ============================================

function Greeting() {
  const [greeting, setGreeting] = useState({ text: "", emoji: "" });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) {
      setGreeting({ text: "Good night", emoji: "🌙" });
    } else if (hour < 12) {
      setGreeting({ text: "Good morning", emoji: "☀️" });
    } else if (hour < 17) {
      setGreeting({ text: "Good afternoon", emoji: "🌤️" });
    } else if (hour < 21) {
      setGreeting({ text: "Good evening", emoji: "🌆" });
    } else {
      setGreeting({ text: "Good night", emoji: "🌙" });
    }
  }, []);

  const dateStr = new Date().toLocaleDateString("de-AT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <motion.div 
      className="mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 md:text-3xl">
        {greeting.text} <span className="inline-block animate-[wave_2s_ease-in-out_infinite]">{greeting.emoji}</span>
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {dateStr}
      </p>
    </motion.div>
  );
}

// ============================================
// Stats Cards
// ============================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  subtext?: string;
  href: string;
  color: "indigo" | "emerald" | "amber" | "rose";
  loading?: boolean;
}

const colorClasses = {
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    icon: "text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-100 dark:ring-indigo-900/50",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-100 dark:ring-emerald-900/50",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-100 dark:ring-amber-900/50",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    icon: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-100 dark:ring-rose-900/50",
  },
};

function StatCard({ icon: Icon, label, value, subtext, href, color, loading }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div variants={itemVariants}>
      <Link href={href} className="block group">
        <div className={cn(
          "relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-200",
          "hover:border-zinc-300 hover:shadow-md",
          "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        )}>
          <div className="flex items-start justify-between">
            <div className={cn("rounded-lg p-2 ring-1", colors.bg, colors.ring)}>
              <Icon className={cn("h-5 w-5", colors.icon)} />
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400 dark:text-zinc-600 dark:group-hover:text-zinc-500" />
          </div>
          
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              {loading ? (
                <div className="h-8 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              ) : (
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {value}
                </span>
              )}
              {subtext && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{subtext}</span>
              )}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function StatsGrid() {
  const [inboxStats, setInboxStats] = useState<InboxStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInboxStats() {
      try {
        const res = await fetch("/api/inbox/stats");
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setInboxStats({
              pending: data.data.byStatus?.pending || 0,
              unread: data.data.unread || 0,
              urgent: data.data.byPriority?.urgent || 0,
            });
          }
        }
      } catch {
        // Silently fail, show 0
      } finally {
        setLoading(false);
      }
    }
    fetchInboxStats();
  }, []);

  const upcomingEvents = getUpcomingEvents(DEMO_EVENTS, 10);
  const todayEvents = upcomingEvents.filter(e => {
    const eventDate = new Date(e.startAt);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  return (
    <motion.div 
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <StatCard
        icon={Inbox}
        label="Inbox items"
        value={inboxStats?.pending || 0}
        subtext={inboxStats?.urgent ? `${inboxStats.urgent} urgent` : undefined}
        href="/chat"
        color="indigo"
        loading={loading}
      />
      <StatCard
        icon={Mail}
        label="Unread messages"
        value={inboxStats?.unread || 0}
        href="/chat"
        color="rose"
        loading={loading}
      />
      <StatCard
        icon={Calendar}
        label="Events today"
        value={todayEvents.length}
        href="/calendar"
        color="emerald"
      />
      <StatCard
        icon={LayoutGrid}
        label="Active tasks"
        value={3}
        subtext="1 due today"
        href="/kanban"
        color="amber"
      />
    </motion.div>
  );
}

// ============================================
// Quick Actions
// ============================================

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  shortcut?: string;
}

const QUICK_ACTIONS: QuickActionProps[] = [
  {
    href: "/chat",
    icon: MessageCircle,
    label: "Chat with Dieter",
    description: "Start a conversation",
    shortcut: "⌘K",
  },
  {
    href: "/calendar",
    icon: Calendar,
    label: "View Calendar",
    description: "Check your schedule",
    shortcut: "⌘C",
  },
  {
    href: "/kanban",
    icon: LayoutGrid,
    label: "Manage Tasks",
    description: "Update your projects",
    shortcut: "⌘T",
  },
];

function QuickActionCard({ href, icon: Icon, label, description, shortcut }: QuickActionProps) {
  return (
    <motion.div variants={itemVariants}>
      <Link href={href} className="block group">
        <div className={cn(
          "flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4",
          "transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/50",
          "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/20"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 transition-colors group-hover:bg-indigo-100 dark:bg-zinc-800 dark:group-hover:bg-indigo-900/50">
            <Icon className="h-5 w-5 text-zinc-600 transition-colors group-hover:text-indigo-600 dark:text-zinc-400 dark:group-hover:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{label}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
          </div>
          {shortcut && (
            <span className="hidden text-xs text-zinc-400 dark:text-zinc-500 sm:block">
              {shortcut}
            </span>
          )}
          <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-zinc-600" />
        </div>
      </Link>
    </motion.div>
  );
}

function QuickActions() {
  return (
    <motion.section 
      className="mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Quick Actions
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard key={action.href} {...action} />
        ))}
      </div>
    </motion.section>
  );
}

// ============================================
// Upcoming Events
// ============================================

function UpcomingEvents() {
  const upcoming = getUpcomingEvents(DEMO_EVENTS, 4);

  if (upcoming.length === 0) {
    return null;
  }

  return (
    <motion.section 
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Upcoming
        </h2>
        <Link 
          href="/calendar" 
          className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {upcoming.map((event, index) => {
          const eventDate = new Date(event.startAt);
          const isToday = eventDate.toDateString() === new Date().toDateString();
          const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
          
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={cn(
                "flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3",
                "transition-colors hover:bg-zinc-50",
                "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
              )}
            >
              <div className={cn(
                "flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg text-center",
                isToday 
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              )}>
                <span className="text-[10px] font-medium uppercase">
                  {isToday ? "Today" : isTomorrow ? "Tmr" : eventDate.toLocaleDateString("de-AT", { weekday: "short" })}
                </span>
                <span className="text-lg font-bold leading-none">{eventDate.getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{event.title}</h4>
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3 w-3" />
                  <span>{event.allDay ? "All day" : formatTime(event.startAt)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

// ============================================
// OpenClaw Status Widget
// ============================================

function OpenClawStatus() {
  const [status, setStatus] = useState<OpenClawStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setStatus({
            online: data.ok,
            latencyMs: data.gateway?.latencyMs,
            lastCheck: data.lastCheck || Date.now(),
          });
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = status?.online && !error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn(
        "rounded-xl border p-4",
        isOnline
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              variants={isOnline ? pulseVariants : {}}
              animate={isOnline ? "pulse" : ""}
              className={cn(
                "h-3 w-3 rounded-full",
                isOnline 
                  ? "bg-emerald-500" 
                  : error 
                    ? "bg-rose-500"
                    : "bg-zinc-400"
              )}
            />
            {isOnline && (
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-400"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                OpenClaw
              </span>
              <span className={cn(
                "text-sm",
                isOnline 
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-500 dark:text-zinc-400"
              )}>
                {isOnline ? "Online" : error ? "Offline" : "Checking..."}
              </span>
            </div>
            {status?.latencyMs && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {status.latencyMs}ms latency
              </span>
            )}
          </div>
        </div>
        
        {isOnline && (
          <Link
            href="/chat"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
              "bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-200",
              "dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900"
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            Start Chat
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Recent Activity
// ============================================

function RecentActivity() {
  // Mock activity data - in real app, fetch from events API
  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "message",
      title: "Chat conversation",
      description: "Discussed project timeline",
      timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
    },
    {
      id: "2",
      type: "calendar",
      title: "Event created",
      description: "Team standup scheduled",
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    },
    {
      id: "3",
      type: "task",
      title: "Task completed",
      description: "Review design mockups",
      timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    },
  ];

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "message": return MessageCircle;
      case "calendar": return Calendar;
      case "task": return CheckCircle2;
      case "inbox": return Mail;
      default: return Activity;
    }
  };

  const formatActivityTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString("de-AT", { month: "short", day: "numeric" });
  };

  return (
    <motion.section 
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Recent Activity
      </h2>
      <div className="space-y-1">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {activity.title}
                </p>
                {activity.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {activity.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {formatActivityTime(activity.timestamp)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

// ============================================
// Main HomeView
// ============================================

export function HomeView() {
  return (
    <AppShell active="home">
      <div className="mx-auto max-w-4xl">
        {/* Greeting */}
        <Greeting />

        {/* Stats Grid */}
        <section className="mb-8">
          <StatsGrid />
        </section>

        {/* Two column layout on larger screens */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Quick Actions */}
            <QuickActions />

            {/* Recent Activity */}
            <RecentActivity />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            {/* OpenClaw Status */}
            <section className="mb-8">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Assistant Status
              </h2>
              <OpenClawStatus />
            </section>

            {/* Upcoming Events */}
            <UpcomingEvents />
          </div>
        </div>

        {/* Footer */}
        <motion.p 
          className="mt-12 text-center text-xs text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Dieter HQ • Built with ❤️
        </motion.p>
      </div>
    </AppShell>
  );
}

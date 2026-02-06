"use client";

import Link from "next/link";
import {
  MessageCircle,
  Calendar,
  LayoutGrid,
  Clock,
  ArrowRight,
  Circle,
} from "lucide-react";

import { AppShell } from "./_ui/AppShell";

// ============================================
// Greeting - Clean, minimal
// ============================================

function Greeting() {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  let timeContext = "Evening";

  if (hour < 12) {
    greeting = "Good morning";
    timeContext = "Morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
    timeContext = "Afternoon";
  }

  return (
    <div className="mb-8">
      <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
        {greeting}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        {timeContext} · What would you like to do?
      </p>
    </div>
  );
}

// ============================================
// Quick Actions - Flat cards, Lucide icons only
// ============================================

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}

const QUICK_ACTIONS: QuickActionProps[] = [
  {
    href: "/chat",
    icon: MessageCircle,
    label: "Chat",
    description: "Start a conversation",
  },
  {
    href: "/calendar",
    icon: Calendar,
    label: "Calendar",
    description: "View schedule",
  },
  {
    href: "/kanban",
    icon: LayoutGrid,
    label: "Tasks",
    description: "Manage projects",
  },
];

function QuickActionCard({ href, icon: Icon, label, description }: QuickActionProps) {
  return (
    <Link href={href} className="block">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-zinc-400" />
          <div>
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</h3>
            <p className="text-xs text-zinc-400">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Status - Compact inline
// ============================================

function StatusIndicator() {
  return (
    <div className="flex items-center gap-4 text-sm text-zinc-500">
      <div className="flex items-center gap-1.5">
        <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
        <span className="text-zinc-600 dark:text-zinc-400">Online</span>
      </div>
      <span className="text-zinc-300 dark:text-zinc-600">·</span>
      <Link
        href="/chat"
        className="inline-flex items-center gap-1 text-zinc-500 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <Clock className="h-3 w-3" />
        Continue last chat
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ============================================
// Main HomeView
// ============================================

export function HomeView() {
  return (
    <AppShell active="home">
      <div className="mx-auto max-w-2xl">
        {/* Greeting */}
        <Greeting />

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Quick Actions
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.href} {...action} />
            ))}
          </div>
        </section>

        {/* Status */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Status
          </h2>
          <StatusIndicator />
        </section>

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-zinc-400">
          Dieter HQ
        </p>
      </div>
    </AppShell>
  );
}

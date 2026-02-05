"use client";

import Link from "next/link";
import {
  MessageCircle,
  Calendar,
  LayoutGrid,
  Clock,
  ArrowRight,
  CheckCircle2,
  Activity,
  Zap,
} from "lucide-react";

import { AppShell } from "./_ui/AppShell";

// ============================================
// Greeting - Clean, simple typography
// ============================================

function Greeting() {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  let emoji = "🌙";

  if (hour < 12) {
    greeting = "Good morning";
    emoji = "☀️";
  } else if (hour < 17) {
    greeting = "Good afternoon";
    emoji = "🌤";
  }

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 md:text-3xl">
        {greeting} {emoji}
      </h1>
      <p className="mt-2 text-zinc-500">
        What would you like to do today?
      </p>
    </div>
  );
}

// ============================================
// Quick Actions - Clean cards
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
    label: "Chat with Dieter",
    description: "Start a conversation or ask for help",
  },
  {
    href: "/calendar",
    icon: Calendar,
    label: "Calendar",
    description: "View your schedule and events",
  },
  {
    href: "/kanban",
    icon: LayoutGrid,
    label: "Tasks",
    description: "Manage tasks and projects",
  },
];

function QuickActionCard({ href, icon: Icon, label, description }: QuickActionProps) {
  return (
    <Link href={href} className="block">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{label}</h3>
            <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Quick Shortcuts - Simple pills
// ============================================

function ShortcutPills() {
  const shortcuts = [
    { label: "New chat", icon: MessageCircle, href: "/chat" },
    { label: "Today", icon: Clock, href: "/calendar" },
    { label: "Quick note", icon: Zap, href: "/chat" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {shortcuts.map((s) => (
        <Link key={s.label} href={s.href}>
          <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            <s.icon className="h-4 w-4 text-zinc-400" />
            {s.label}
          </button>
        </Link>
      ))}
    </div>
  );
}

// ============================================
// Status Section - Clean cards
// ============================================

function StatusSection() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Agent Status Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Agent Status</h3>
            <p className="text-sm text-zinc-500">All systems operational</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
          <div className="flex items-center gap-1.5 text-sm text-zinc-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Ready
          </div>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Recent</h3>
            <p className="text-sm text-zinc-500">Continue where you left off</p>
          </div>
        </div>

        <div className="mt-4">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Open last conversation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main HomeView
// ============================================

export function HomeView() {
  return (
    <AppShell active="home">
      <div className="mx-auto max-w-3xl">
        {/* Greeting */}
        <Greeting />

        {/* Quick Shortcuts */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Quick Actions
          </h2>
          <ShortcutPills />
        </section>

        {/* Main Actions Grid */}
        <section className="mb-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.href} {...action} />
            ))}
          </div>
        </section>

        {/* Status Section */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Status
          </h2>
          <StatusSection />
        </section>

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-zinc-400">
          🐕 Dieter HQ • Your personal AI homebase
        </p>
      </div>
    </AppShell>
  );
}

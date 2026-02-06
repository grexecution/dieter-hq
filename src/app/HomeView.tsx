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
import { cn } from "@/lib/utils";

// ============================================
// Greeting
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
    <div className="mb-10">
      <h1 className="text-2xl font-semibold text-foreground">{greeting}</h1>
      <p className="mt-1.5 text-sm text-foreground-secondary">
        {timeContext} · What would you like to do?
      </p>
    </div>
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

function QuickActionCard({
  href,
  icon: Icon,
  label,
  description,
}: QuickActionProps) {
  return (
    <Link href={href} className="block">
      <div className="card-interactive group flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-150 group-hover:scale-105">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <p className="text-xs text-foreground-tertiary">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-foreground-tertiary opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

// ============================================
// Status
// ============================================

function StatusIndicator() {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <Circle className="h-2 w-2 fill-success text-success" />
        <span className="text-foreground-secondary">Online</span>
      </div>
      <span className="text-border">·</span>
      <Link
        href="/chat"
        className="inline-flex items-center gap-1.5 text-foreground-secondary transition-colors hover:text-foreground"
      >
        <Clock className="h-3.5 w-3.5" />
        Continue last chat
        <ArrowRight className="h-3.5 w-3.5" />
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
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
            Quick Actions
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.href} {...action} />
            ))}
          </div>
        </section>

        {/* Status */}
        <section className="mb-10">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
            Status
          </h2>
          <StatusIndicator />
        </section>

        {/* Footer */}
        <p className="mt-16 text-center text-xs text-foreground-tertiary">
          Dieter HQ
        </p>
      </div>
    </AppShell>
  );
}

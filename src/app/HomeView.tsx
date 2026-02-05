"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Avatar,
} from "@heroui/react";
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
// Greeting - Clean, no gradients
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
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {greeting} {emoji}
      </h1>
      <p className="mt-2 text-foreground-500 text-lg">
        What would you like to do today?
      </p>
    </div>
  );
}

// ============================================
// Quick Actions - HeroUI Cards
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
      <Card
        isPressable
        className="border border-divider bg-content1 transition-all hover:border-primary/50"
      >
        <CardBody className="gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{label}</h3>
            <p className="mt-1 text-sm text-foreground-500">{description}</p>
          </div>
        </CardBody>
      </Card>
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
          <Button
            variant="flat"
            color="default"
            size="sm"
            startContent={<s.icon className="h-4 w-4" />}
          >
            {s.label}
          </Button>
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
      <Card className="border border-divider bg-content1">
        <CardBody className="gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Activity className="h-5 w-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Agent Status</h3>
              <p className="text-sm text-foreground-500">All systems operational</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Chip
              color="success"
              variant="dot"
              size="sm"
            >
              Online
            </Chip>
            <div className="flex items-center gap-1.5 text-sm text-foreground-500">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Ready
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent Activity Card */}
      <Card className="border border-divider bg-content1">
        <CardBody className="gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Recent</h3>
              <p className="text-sm text-foreground-500">Continue where you left off</p>
            </div>
          </div>

          <Link href="/chat">
            <Button
              variant="light"
              color="primary"
              size="sm"
              endContent={<ArrowRight className="h-4 w-4" />}
              className="w-fit"
            >
              Open last conversation
            </Button>
          </Link>
        </CardBody>
      </Card>
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
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-foreground-400">
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
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-foreground-400">
            Status
          </h2>
          <StatusSection />
        </section>

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-foreground-400">
          🐕 Dieter HQ • Your personal AI homebase
        </p>
      </div>
    </AppShell>
  );
}

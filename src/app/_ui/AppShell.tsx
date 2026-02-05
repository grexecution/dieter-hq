"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageCircle,
  Calendar,
  LayoutGrid,
  Settings,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

// Navigation items configuration
const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home", id: "home" },
  { href: "/chat", icon: MessageCircle, label: "Chat", id: "chat" },
  { href: "/calendar", icon: Calendar, label: "Calendar", id: "calendar" },
  { href: "/kanban", icon: LayoutGrid, label: "Tasks", id: "kanban" },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];

interface AppShellProps {
  children: React.ReactNode;
  active?: "chat" | "kanban" | "calendar" | "events" | "home";
}

// Desktop Header Navigation
function DesktopHeader({ active }: { active?: string }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 hidden md:block">
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <nav className="glass-elevated flex h-14 items-center justify-between rounded-2xl px-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight transition-all hover:scale-105"
          >
            <span className="text-lg">🐕</span>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-sm font-bold text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
              Dieter HQ
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.slice(1).map((item) => {
              const isActive = active === item.id;
              // Per-item accent colors for more personality
              const accentColors: Record<string, { text: string; bg: string; shadow: string }> = {
                chat: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/15", shadow: "shadow-blue-500/10" },
                calendar: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/15", shadow: "shadow-purple-500/10" },
                kanban: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/15", shadow: "shadow-amber-500/10" },
              };
              const accent = accentColors[item.id] || { text: "text-primary", bg: "bg-primary/10", shadow: "" };
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover-press",
                    isActive
                      ? accent.text
                      : "text-foreground-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="desktop-nav-indicator"
                      className={cn("absolute inset-0 rounded-xl shadow-sm", accent.bg, accent.shadow)}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

// Mobile Bottom Tab Bar
function MobileTabBar({ active }: { active?: string }) {
  // Per-item accent colors
  const accentColors: Record<string, { text: string; bg: string }> = {
    home: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/15" },
    chat: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/15" },
    calendar: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/15" },
    kanban: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/15" },
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass-medium border-t border-white/10 pb-safe dark:border-white/5">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              active === item.id || (item.id === "home" && !active);
            const accent = accentColors[item.id] || { text: "text-primary", bg: "bg-primary/10" };
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all hover-press",
                  isActive
                    ? accent.text
                    : "text-foreground-tertiary hover:text-foreground-secondary"
                )}
              >
                <motion.div
                  className="relative z-10"
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.1 }}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all",
                      isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all",
                    isActive && "font-semibold"
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-tab-indicator"
                    className={cn("absolute inset-0 rounded-xl", accent.bg)}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function AppShell({ children, active }: AppShellProps) {
  const pathname = usePathname();

  // Determine active state from pathname if not provided
  const resolvedActive =
    active ||
    (pathname === "/" ? "home" : NAV_ITEMS.find((n) => pathname.startsWith(n.href) && n.href !== "/")?.id);

  return (
    <div className="relative min-h-dvh bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(168,85,247,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(168,85,247,0.06),transparent)]">
      {/* Desktop Header */}
      <DesktopHeader active={resolvedActive} />

      {/* Main Content */}
      <main
        className={cn(
          "mx-auto w-full max-w-6xl px-4 md:px-6",
          // Mobile: bottom padding for tab bar
          "pb-24 pt-6",
          // Desktop: top padding for header
          "md:pb-8 md:pt-24"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Tab Bar */}
      <MobileTabBar active={resolvedActive} />
    </div>
  );
}

// Export for pages that want to manage their own layout (like fullscreen chat)
export function AppShellMinimal({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(168,85,247,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(168,85,247,0.06),transparent)]">
      {children}
    </div>
  );
}

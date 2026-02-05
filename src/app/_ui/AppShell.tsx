"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  Calendar,
  LayoutGrid,
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

// ============================================
// Desktop Header - Clean navbar
// ============================================

function DesktopHeader({ active }: { active?: string }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 hidden md:block">
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <nav className="flex h-14 items-center justify-between rounded-xl border border-zinc-200 bg-white/80 px-4 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
          {/* Logo - Simple, no gradient */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="text-lg">🐕</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Dieter HQ
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.slice(1).map((item) => {
              const isActive = active === item.id;
              return (
                <Link key={item.id} href={item.href}>
                  <button
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
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

// ============================================
// Mobile Bottom Tab Bar - Clean, minimal
// ============================================

function MobileTabBar({ active }: { active?: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="border-t border-zinc-200 bg-white/95 pb-safe backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              active === item.id || (item.id === "home" && !active);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "font-semibold" : "font-medium"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ============================================
// Main AppShell
// ============================================

export function AppShell({ children, active }: AppShellProps) {
  const pathname = usePathname();

  // Determine active state from pathname if not provided
  const resolvedActive =
    active ||
    (pathname === "/" ? "home" : NAV_ITEMS.find((n) => pathname.startsWith(n.href) && n.href !== "/")?.id);

  return (
    <div className="relative min-h-dvh bg-zinc-50 dark:bg-zinc-950">
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
        {children}
      </main>

      {/* Mobile Tab Bar */}
      <MobileTabBar active={resolvedActive} />
    </div>
  );
}

// Export for pages that want to manage their own layout
export function AppShellMinimal({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      {children}
    </div>
  );
}

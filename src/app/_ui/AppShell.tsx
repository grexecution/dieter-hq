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
import { NotificationPermission } from "@/components/NotificationPermission";
import { cn } from "@/lib/utils";

// Navigation items configuration
const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home", id: "home" },
  { href: "/chat", icon: MessageCircle, label: "Chat", id: "chat" },
  { href: "/calendar", icon: Calendar, label: "Kalender", id: "calendar" },
  { href: "/kanban", icon: LayoutGrid, label: "Tasks", id: "kanban" },
] as const;

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
            <NotificationPermission />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

// ============================================
// Mobile Header - Clean top navigation
// ============================================

export function MobileHeader({ active }: { active?: string }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 md:hidden">
      {/* Safe area + header container */}
      <div className="border-b border-zinc-200/80 bg-white/90 pt-safe backdrop-blur-lg dark:border-zinc-800/80 dark:bg-zinc-950/90">
        <nav className="flex h-12 items-center justify-between px-2">
          {/* Logo - compact */}
          <Link
            href="/"
            className="flex min-w-[44px] items-center justify-center px-2"
          >
            <span className="text-lg">🐕</span>
          </Link>

          {/* Nav Items - centered */}
          <div className="flex flex-1 items-center justify-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                active === item.id || (item.id === "home" && !active);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    // Base: touch-friendly tap target
                    "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-lg px-3 transition-colors",
                    // Active state
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-zinc-500 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-800"
                  )}
                >
                  <item.icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  {/* Label - hidden on very small screens */}
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] font-medium leading-none",
                      "hidden xs:block",
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {item.label}
                  </span>
                  {/* Active indicator line */}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Actions - compact */}
          <div className="flex min-w-[44px] items-center justify-center">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
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

      {/* Mobile Header */}
      <MobileHeader active={resolvedActive} />

      {/* Main Content */}
      <main
        className={cn(
          "mx-auto w-full max-w-6xl px-4 md:px-6",
          // Mobile: top padding for mobile header (h-12 + safe-area)
          "pt-[calc(3rem+env(safe-area-inset-top))] pb-6",
          // Desktop: top padding for desktop header
          "md:pb-8 md:pt-24"
        )}
      >
        {children}
      </main>
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

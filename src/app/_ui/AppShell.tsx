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
            <NotificationPermission />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

// ============================================
// Mobile Bottom Tab Bar - Modern Floating Design
// ============================================

function MobileTabBar({ active }: { active?: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden">
      <div className="px-4 pb-4">
        {/* Floating Pill Container */}
        <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/90">
          {/* Subtle gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/[0.02] to-white/[0.08]" />
          
          <div className="relative flex items-center justify-around px-2 py-3">
            {NAV_ITEMS.map((item) => {
              const isActive =
                active === item.id || (item.id === "home" && !active);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group relative flex flex-col items-center"
                >
                  {/* Active Glow Background */}
                  <div
                    className={cn(
                      "absolute -inset-2 rounded-xl transition-all duration-300",
                      isActive
                        ? "bg-indigo-500/20 blur-md"
                        : "bg-transparent"
                    )}
                  />
                  
                  {/* Active Background Pill */}
                  <div
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-300",
                      isActive
                        ? "bg-indigo-500/20"
                        : "hover:bg-white/5"
                    )}
                  >
                    {/* Icon */}
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive
                          ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                          : "text-zinc-400 group-hover:text-zinc-200"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    
                    {/* Label */}
                    <span
                      className={cn(
                        "text-[10px] font-medium transition-all duration-300",
                        isActive
                          ? "text-indigo-300"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    >
                      {item.label}
                    </span>
                    
                    {/* Active Indicator Dot */}
                    <div
                      className={cn(
                        "absolute -bottom-0.5 h-1 w-1 rounded-full bg-indigo-400 transition-all duration-300",
                        isActive
                          ? "scale-100 opacity-100"
                          : "scale-0 opacity-0"
                      )}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
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
          // Mobile: bottom padding for floating tab bar
          "pb-28 pt-6",
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

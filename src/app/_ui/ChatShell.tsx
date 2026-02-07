"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, MessageCircle, Calendar, LayoutGrid, Settings } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface ChatShellProps {
  children: React.ReactNode;
}

// Navigation items - same as AppShell for consistency
const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home", id: "home" },
  { href: "/chat", icon: MessageCircle, label: "Chat", id: "chat" },
  { href: "/calendar", icon: Calendar, label: "Kalender", id: "calendar" },
  { href: "/kanban", icon: LayoutGrid, label: "Tasks", id: "kanban" },
] as const;

// Desktop Header for Chat - consistent with AppShell
function ChatDesktopHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 hidden md:block">
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <nav className="flex h-14 items-center justify-between rounded-xl border border-zinc-200 bg-white/80 px-4 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
          {/* Logo */}
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
              const isActive = item.id === "chat";
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
            <Link
              href="/settings"
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

// Mobile Bottom Tab Bar - Same design as AppShell
function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden">
      <div className="px-4 pb-4">
        {/* Floating Pill Container - Centered */}
        <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/90">
          {/* Subtle gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/[0.02] to-white/[0.08]" />
          
          <div className="relative flex items-center justify-around px-2 py-3">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === "chat";

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

export function ChatShell({ children }: ChatShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop Header */}
      <ChatDesktopHeader />

      {/* Main Content - Full Height */}
      <main className="flex flex-1 flex-col md:pt-20 pb-24 md:pb-0">
        <motion.div
          className="flex flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Tab Bar - Same as AppShell */}
      <MobileTabBar />
    </div>
  );
}

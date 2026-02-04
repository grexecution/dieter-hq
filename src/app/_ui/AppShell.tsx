"use client";

import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: "chat" | "kanban" | "calendar" | "events";
}) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_80%_15%,rgba(168,85,247,0.10),transparent_60%),radial-gradient(700px_circle_at_50%_90%,rgba(34,197,94,0.08),transparent_60%),linear-gradient(to_br,rgba(255,255,255,0.9),rgba(250,250,250,1))] dark:bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(59,130,246,0.10),transparent_55%),radial-gradient(900px_circle_at_80%_15%,rgba(168,85,247,0.10),transparent_60%),radial-gradient(700px_circle_at_50%_90%,rgba(34,197,94,0.08),transparent_60%),linear-gradient(to_br,rgba(9,9,11,1),rgba(24,24,27,1))]">
      <header className="sticky top-0 z-50 border-b border-white/30 bg-white/70 shadow-sm backdrop-blur-2xl supports-[backdrop-filter]:bg-white/45 dark:border-zinc-800/60 dark:bg-zinc-950/55 dark:supports-[backdrop-filter]:bg-zinc-950/35">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-semibold tracking-tight">
            Dieter HQ
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Button
              asChild
              variant={active === "chat" ? "default" : "ghost"}
              size="sm"
              className={cn(active === "chat" && "shadow-sm")}
            >
              <Link href="/chat">Chat</Link>
            </Button>
            <Button
              asChild
              variant={active === "kanban" ? "default" : "ghost"}
              size="sm"
              className={cn(active === "kanban" && "shadow-sm")}
            >
              <Link href="/kanban">Kanban</Link>
            </Button>
            <Button
              asChild
              variant={active === "calendar" ? "default" : "ghost"}
              size="sm"
              className={cn(active === "calendar" && "shadow-sm")}
            >
              <Link href="/calendar">Calendar</Link>
            </Button>
            <div className="ml-1 pl-1 sm:ml-2 sm:pl-2 border-l">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

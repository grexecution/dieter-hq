"use client";

import Link from "next/link";

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
    <div className="min-h-dvh bg-gradient-to-br from-background via-background to-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-semibold tracking-tight">
            Dieter HQ
          </Link>

          <nav className="flex items-center gap-2">
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
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

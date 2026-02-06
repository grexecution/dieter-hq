"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Calendar, LayoutGrid } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationPermission } from "@/components/NotificationPermission";
import { cn } from "@/lib/utils";

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

function DesktopHeader({ active }: { active?: string }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 hidden md:block">
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <nav className="flex h-14 items-center justify-between rounded-xl border border-border bg-background/80 px-4 backdrop-blur-xl shadow-sm">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="text-lg">🐕</span>
            <span className="text-sm font-bold text-foreground">Dieter HQ</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.slice(1).map((item) => {
              const isActive = active === item.id;
              return (
                <Link key={item.id} href={item.href}>
                  <button
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground-secondary hover:bg-muted hover:text-foreground"
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

function MobileTabBar({ active }: { active?: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="border-t border-border bg-background/95 pb-safe backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              active === item.id || (item.id === "home" && !active);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all duration-150",
                  isActive
                    ? "text-primary"
                    : "text-foreground-tertiary hover:text-foreground-secondary"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-150",
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

export function AppShell({ children, active }: AppShellProps) {
  const pathname = usePathname();

  const resolvedActive =
    active ||
    (pathname === "/"
      ? "home"
      : NAV_ITEMS.find((n) => pathname.startsWith(n.href) && n.href !== "/")
          ?.id);

  return (
    <div className="relative min-h-dvh bg-background">
      <DesktopHeader active={resolvedActive} />

      <main
        className={cn(
          "mx-auto w-full max-w-6xl px-4 md:px-6",
          "pb-24 pt-6",
          "md:pb-8 md:pt-24"
        )}
      >
        {children}
      </main>

      <MobileTabBar active={resolvedActive} />
    </div>
  );
}

export function AppShellMinimal({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-background">{children}</div>
  );
}

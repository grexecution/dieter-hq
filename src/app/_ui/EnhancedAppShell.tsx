/**
 * Enhanced App Shell with AI Integration
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
  MessageSquare,
  LayoutGrid,
  Calendar,
  Bell,
  Search,
  Command,
  X,
  Check,
  AlertCircle,
  Info,
  ChevronRight,
  Menu,
  WifiOff,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  useCurrentView,
  useNotifications,
  useSyncStatus,
  useUnifiedStore,
  ViewType,
} from "@/lib/unified-store";

import {
  ViewTransition,
  useViewSwipeNavigation,
  PageLoadingIndicator,
} from "@/components/ViewTransition";

// ============================================================================
// Types
// ============================================================================

interface EnhancedAppShellProps {
  children: React.ReactNode;
}

// ============================================================================
// Nav Items
// ============================================================================

const NAV_ITEMS: Array<{
  view: ViewType;
  href: string;
  label: string;
  icon: typeof MessageSquare;
  shortcut: string;
}> = [
  {
    view: "chat",
    href: "/chat",
    label: "Chat",
    icon: MessageSquare,
    shortcut: "1",
  },
  {
    view: "kanban",
    href: "/kanban",
    label: "Kanban",
    icon: LayoutGrid,
    shortcut: "2",
  },
  {
    view: "calendar",
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    shortcut: "3",
  },
];

// ============================================================================
// Notification Panel
// ============================================================================

function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { notifications, markRead, clearAll, unreadCount } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case "error":
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-16 z-50 w-80 max-h-[70vh] overflow-hidden rounded-xl border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-foreground-secondary"
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-foreground-tertiary">
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted",
                      !notif.read && "bg-primary/5"
                    )}
                    onClick={() => markRead(notif.id)}
                  >
                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="mt-0.5 text-xs text-foreground-secondary">
                          {notif.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-foreground-tertiary">
                        {new Date(notif.timestamp).toLocaleTimeString("de-AT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {notif.actionUrl && (
                      <Link
                        href={notif.actionUrl}
                        className="text-primary hover:text-primary/80"
                        onClick={onClose}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Command Palette
// ============================================================================

function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { navigateWithAI, createTaskFromChat } = useUnifiedStore();

  const commands = [
    {
      id: "chat",
      label: "Go to Chat",
      icon: MessageSquare,
      action: () => router.push("/chat"),
    },
    {
      id: "kanban",
      label: "Go to Kanban",
      icon: LayoutGrid,
      action: () => router.push("/kanban"),
    },
    {
      id: "calendar",
      label: "Go to Calendar",
      icon: Calendar,
      action: () => router.push("/calendar"),
    },
    {
      id: "task",
      label: "Create Task",
      icon: Check,
      action: () => createTaskFromChat(query || "New Task"),
    },
  ];

  const filteredCommands = query
    ? commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const handleSelect = (action: () => void) => {
    action();
    onClose();
    setQuery("");
  };

  useEffect(() => {
    if (open) {
      setQuery("");
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-4 top-24 z-50 mx-auto max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 text-foreground-tertiary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-tertiary"
                autoFocus
              />
              <kbd className="hidden items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground-tertiary sm:inline-flex">
                ESC
              </kbd>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.action)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <cmd.icon className="h-4 w-4 text-foreground-tertiary" />
                  <span className="text-foreground">{cmd.label}</span>
                </button>
              ))}

              {query && (
                <button
                  onClick={async () => {
                    await navigateWithAI(query);
                    onClose();
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/10"
                >
                  <Command className="h-4 w-4" />
                  <span>Ask AI: "{query}"</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Status Indicator
// ============================================================================

function StatusIndicator() {
  const { isOnline, pendingSync } = useSyncStatus();

  if (isOnline && pendingSync === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
        isOnline
          ? "bg-warning/10 text-warning"
          : "bg-destructive/10 text-destructive"
      )}
    >
      {isOnline ? (
        <>
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
          <span>Syncing ({pendingSync})</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EnhancedAppShell({ children }: EnhancedAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { state, dispatch } = useUnifiedStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeView = (pathname?.split("/")[1] as ViewType) || "chat";

  useViewSwipeNavigation(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_COMMAND_PALETTE" });
      }

      if ((e.metaKey || e.ctrlKey) && ["1", "2", "3"].includes(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (NAV_ITEMS[idx]) {
          router.push(NAV_ITEMS[idx].href);
        }
      }

      if (e.key === "Escape") {
        if (state.commandPaletteOpen) {
          dispatch({ type: "TOGGLE_COMMAND_PALETTE" });
        }
        setNotificationsOpen(false);
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, router, state.commandPaletteOpen]);

  return (
    <div className="min-h-dvh bg-background">
      <PageLoadingIndicator show={state.isLoading} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/" className="font-semibold tracking-tight text-foreground">
              Dieter HQ
            </Link>

            <StatusIndicator />
          </div>

          {/* Center: Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.view;
              return (
                <Button
                  key={item.view}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    <kbd className="ml-1 hidden text-xs text-foreground-tertiary xl:inline">
                      ⌘{item.shortcut}
                    </kbd>
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 sm:flex"
              onClick={() => dispatch({ type: "TOGGLE_COMMAND_PALETTE" })}
            >
              <Search className="h-4 w-4" />
              <span className="text-xs text-foreground-secondary">Search</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs">
                ⌘K
              </kbd>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <span className="font-semibold text-foreground">Dieter HQ</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeView === item.view;
                  return (
                    <Link
                      key={item.view}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground-secondary hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <ViewTransition view={activeView}>{children}</ViewTransition>
      </main>

      {/* Modals */}
      <NotificationPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <CommandPalette
        open={state.commandPaletteOpen}
        onClose={() => dispatch({ type: "TOGGLE_COMMAND_PALETTE" })}
      />
    </div>
  );
}

export default EnhancedAppShell;

/**
 * Enhanced App Shell with AI Integration
 * 
 * Features:
 * - Unified state-connected navigation
 * - Smooth view transitions
 * - Command palette (⌘K)
 * - Notifications
 * - Swipe navigation on mobile
 * - Quick actions
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
  Wifi,
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

import { ViewTransition, useViewSwipeNavigation, PageLoadingIndicator } from "@/components/ViewTransition";

// ============================================================================
// TYPES
// ============================================================================

interface EnhancedAppShellProps {
  children: React.ReactNode;
}

// ============================================================================
// NAV ITEMS
// ============================================================================

const NAV_ITEMS: Array<{
  view: ViewType;
  href: string;
  label: string;
  icon: typeof MessageSquare;
  shortcut: string;
}> = [
  { view: 'chat', href: '/chat', label: 'Chat', icon: MessageSquare, shortcut: '1' },
  { view: 'kanban', href: '/kanban', label: 'Kanban', icon: LayoutGrid, shortcut: '2' },
  { view: 'calendar', href: '/calendar', label: 'Calendar', icon: Calendar, shortcut: '3' },
];

// ============================================================================
// NOTIFICATION PANEL
// ============================================================================

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markRead, clearAll, unreadCount } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <X className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-16 z-50 w-80 max-h-[70vh] overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-2xl dark:border-zinc-800/60 dark:bg-zinc-950/80"
          >
            <div className="flex items-center justify-between border-b border-white/20 px-4 py-3 dark:border-zinc-800/40">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 border-b border-white/10 px-4 py-3 transition-colors hover:bg-white/20 dark:border-zinc-800/20 dark:hover:bg-zinc-800/20",
                      !notif.read && "bg-blue-50/50 dark:bg-blue-900/10"
                    )}
                    onClick={() => markRead(notif.id)}
                  >
                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      {notif.message && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {notif.message}
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 mt-1">
                        {new Date(notif.timestamp).toLocaleTimeString('de-AT', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {notif.actionUrl && (
                      <Link
                        href={notif.actionUrl}
                        className="text-blue-500 hover:text-blue-600"
                        onClick={onClose}
                      >
                        <ChevronRight className="w-4 h-4" />
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
// COMMAND PALETTE
// ============================================================================

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { navigateWithAI, createTaskFromChat, createEventFromChat } = useUnifiedStore();

  const commands = [
    { id: 'chat', label: 'Go to Chat', icon: MessageSquare, action: () => router.push('/chat') },
    { id: 'kanban', label: 'Go to Kanban', icon: LayoutGrid, action: () => router.push('/kanban') },
    { id: 'calendar', label: 'Go to Calendar', icon: Calendar, action: () => router.push('/calendar') },
    { id: 'task', label: 'Create Task', icon: Check, action: () => createTaskFromChat(query || 'New Task') },
  ];

  const filteredCommands = query
    ? commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  const handleSelect = (action: () => void) => {
    action();
    onClose();
    setQuery('');
  };

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-4 top-24 z-50 mx-auto max-w-xl overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-zinc-800/60 dark:bg-zinc-950/90"
          >
            <div className="flex items-center gap-3 border-b border-white/20 px-4 py-3 dark:border-zinc-800/40">
              <Search className="w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                ESC
              </kbd>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.action)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <cmd.icon className="w-4 h-4 text-zinc-500" />
                  <span>{cmd.label}</span>
                </button>
              ))}
              
              {query && (
                <button
                  onClick={async () => {
                    await navigateWithAI(query);
                    onClose();
                    setQuery('');
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-500 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Command className="w-4 h-4" />
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
// STATUS INDICATOR
// ============================================================================

function StatusIndicator() {
  const { isOnline, pendingSync } = useSyncStatus();

  if (isOnline && pendingSync === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
        isOnline
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
      )}
    >
      {isOnline ? (
        <>
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
          <span>Syncing ({pendingSync})</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnhancedAppShell({ children }: EnhancedAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { navigate } = useCurrentView();
  const { unreadCount } = useNotifications();
  const { state, dispatch } = useUnifiedStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Determine active view from pathname
  const activeView = pathname?.split('/')[1] as ViewType || 'chat';

  // Enable swipe navigation on mobile
  useViewSwipeNavigation(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_COMMAND_PALETTE' });
      }

      // View shortcuts: ⌘1, ⌘2, ⌘3
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (NAV_ITEMS[idx]) {
          router.push(NAV_ITEMS[idx].href);
        }
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        if (state.commandPaletteOpen) {
          dispatch({ type: 'TOGGLE_COMMAND_PALETTE' });
        }
        setNotificationsOpen(false);
        setMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, router, state.commandPaletteOpen]);

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(900px_circle_at_80%_15%,rgba(168,85,247,0.10),transparent_60%),radial-gradient(700px_circle_at_50%_90%,rgba(34,197,94,0.08),transparent_60%),linear-gradient(to_br,rgba(255,255,255,0.9),rgba(250,250,250,1))] dark:bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(59,130,246,0.10),transparent_55%),radial-gradient(900px_circle_at_80%_15%,rgba(168,85,247,0.10),transparent_60%),radial-gradient(700px_circle_at_50%_90%,rgba(34,197,94,0.08),transparent_60%),linear-gradient(to_br,rgba(9,9,11,1),rgba(24,24,27,1))]">
      
      {/* Loading indicator */}
      <PageLoadingIndicator show={state.isLoading} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 shadow-sm backdrop-blur-2xl supports-[backdrop-filter]:bg-white/45 dark:border-zinc-800/60 dark:bg-zinc-950/55 dark:supports-[backdrop-filter]:bg-zinc-950/35">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          {/* Left: Logo & Mobile menu */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <Link href="/" className="font-semibold tracking-tight">
              Dieter HQ
            </Link>
            
            <StatusIndicator />
          </div>

          {/* Center: Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.view;
              return (
                <Button
                  key={item.view}
                  asChild
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2',
                    isActive && 'shadow-sm'
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    <kbd className="hidden xl:inline ml-1 text-xs text-zinc-400">
                      ⌘{item.shortcut}
                    </kbd>
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Command palette trigger */}
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex gap-2 text-zinc-500"
              onClick={() => dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })}
            >
              <Search className="w-4 h-4" />
              <span className="text-xs">Search</span>
              <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800">
                ⌘K
              </kbd>
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
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
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/30 bg-white/95 backdrop-blur-2xl dark:border-zinc-800/60 dark:bg-zinc-950/95 lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/20 px-4 py-4 dark:border-zinc-800/40">
                <span className="font-semibold">Dieter HQ</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X className="w-5 h-5" />
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
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content with view transitions */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <ViewTransition view={activeView}>
          {children}
        </ViewTransition>
      </main>

      {/* Modals */}
      <NotificationPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <CommandPalette
        open={state.commandPaletteOpen}
        onClose={() => dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })}
      />
    </div>
  );
}

export default EnhancedAppShell;

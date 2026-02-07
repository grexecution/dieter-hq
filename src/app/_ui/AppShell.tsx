"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageCircle,
  Calendar,
  LayoutGrid,
  Settings,
  X,
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

const MENU_ITEMS = [
  { href: "/", icon: Home, label: "Home", id: "home" },
  { href: "/chat", icon: MessageCircle, label: "Chat", id: "chat" },
  { href: "/calendar", icon: Calendar, label: "Kalender", id: "calendar" },
  { href: "/kanban", icon: LayoutGrid, label: "Tasks", id: "kanban" },
  { type: "divider" as const },
  { href: "/settings", icon: Settings, label: "Settings", id: "settings" },
] as const;

interface AppShellProps {
  children: React.ReactNode;
  active?: "chat" | "kanban" | "calendar" | "events" | "home";
}

// ============================================
// Animated Burger Icon
// ============================================

function BurgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative h-5 w-6">
      <motion.span
        className="absolute left-0 top-0 h-0.5 w-full rounded-full bg-current"
        animate={{
          rotate: isOpen ? 45 : 0,
          y: isOpen ? 9 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute left-0 top-[9px] h-0.5 w-full rounded-full bg-current"
        animate={{
          opacity: isOpen ? 0 : 1,
          scaleX: isOpen ? 0 : 1,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-current"
        animate={{
          rotate: isOpen ? -45 : 0,
          y: isOpen ? -9 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      />
    </div>
  );
}

// ============================================
// Slide-out Menu Panel
// ============================================

function MobileMenu({
  isOpen,
  onClose,
  active,
}: {
  isOpen: boolean;
  onClose: () => void;
  active?: string;
}) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <motion.nav
            className={cn(
              "fixed right-0 top-0 z-50 h-full w-72",
              // Futuristic glass effect
              "border-l border-white/10 bg-zinc-900/95 backdrop-blur-xl",
              // Subtle glow on the edge
              "shadow-[-8px_0_32px_rgba(99,102,241,0.15)]"
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            aria-label="Mobile navigation menu"
          >
            {/* Menu Header */}
            <div className="flex h-14 items-center justify-between border-b border-white/5 px-5 pt-safe">
              <span className="text-sm font-medium text-zinc-400">Menu</span>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex flex-col gap-1 p-4">
              {MENU_ITEMS.map((item, index) => {
                if ("type" in item && item.type === "divider") {
                  return (
                    <div
                      key={`divider-${index}`}
                      className="my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    />
                  );
                }

                if (!("href" in item)) return null;

                const isActive = active === item.id;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      // Base styles
                      "group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                      // Active state - futuristic glow
                      isActive
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white active:scale-[0.98]"
                    )}
                  >
                    {/* Active indicator glow */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-indigo-500/10"
                        layoutId="activeMenuItem"
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      />
                    )}
                    
                    {/* Icon with subtle glow when active */}
                    <span
                      className={cn(
                        "relative z-10 transition-all",
                        isActive && "drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                    </span>
                    
                    <span className="relative z-10">{item.label}</span>

                    {/* Active line indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
                        layoutId="activeIndicator"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Footer with Theme Toggle */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 p-4 pb-safe">
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-zinc-400">Erscheinungsbild</span>
                <ThemeToggle />
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
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
// Mobile Header - Futuristic with Burger Menu
// ============================================

export function MobileHeader({ active }: { active?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 md:hidden">
        {/* Safe area + header container with futuristic styling */}
        <div
          className={cn(
            "pt-safe",
            // Futuristic glass morphism
            "border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl",
            // Subtle bottom glow
            "shadow-[0_1px_0_rgba(99,102,241,0.1),0_4px_20px_rgba(0,0,0,0.3)]"
          )}
        >
          <nav className="flex h-14 items-center justify-between px-4">
            {/* Logo + Brand - Left Side */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition-all active:scale-95"
            >
              {/* Logo with subtle glow */}
              <span
                className={cn(
                  "text-xl transition-all",
                  "drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]",
                  "group-hover:drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                )}
              >
                🐕
              </span>
              {/* Brand text with gradient */}
              <span
                className={cn(
                  "text-base font-bold tracking-tight",
                  // Futuristic gradient text
                  "bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent",
                  // Subtle text glow
                  "drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                )}
              >
                Dieter HQ
              </span>
            </Link>

            {/* Burger Menu Button - Right Side */}
            <button
              onClick={toggleMenu}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                // Futuristic button style
                isMenuOpen
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white active:scale-95"
              )}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {/* Subtle glow ring when active */}
              {isMenuOpen && (
                <motion.div
                  className="absolute inset-0 rounded-xl ring-1 ring-indigo-500/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
              <BurgerIcon isOpen={isMenuOpen} />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} active={active} />
    </>
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
          // Mobile: top padding for mobile header (h-14 + safe-area)
          "pt-[calc(3.5rem+env(safe-area-inset-top))] pb-6",
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

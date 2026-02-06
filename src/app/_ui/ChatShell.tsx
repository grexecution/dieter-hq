"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Settings } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

interface ChatShellProps {
  children: React.ReactNode;
}

// Compact Header for Chat
function ChatHeader() {
  return (
    <header className="sticky left-0 right-0 top-0 z-50">
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          {/* Back button */}
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {/* Title - tiny */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="flex items-center gap-0.5 text-[9px] font-medium text-zinc-400 dark:text-zinc-500">
              <span className="text-[8px]">💬</span>
              <span>Chat</span>
            </span>
          </div>

          {/* Actions - fixed width to prevent layout shift */}
          <div className="flex shrink-0 items-center gap-0.5">
            <ThemeToggle />
            <Link
              href="/settings"
              className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <Settings className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function ChatShell({ children }: ChatShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Compact Header */}
      <ChatHeader />

      {/* Main Content - Full Height */}
      <main className="flex flex-1 flex-col">
        <motion.div
          className="flex flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

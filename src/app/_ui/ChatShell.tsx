"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Settings } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface ChatShellProps {
  children: React.ReactNode;
}

// Compact Header for Chat
function ChatHeader() {
  return (
    <header className="sticky left-0 right-0 top-0 z-50">
      <div className="glass-medium border-b border-white/10 dark:border-white/5">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          {/* Back button */}
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-white/10 hover:text-foreground hover-press"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {/* Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-sm font-semibold">Chat</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

export function ChatShell({ children }: ChatShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.05),transparent)]">
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

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

interface ChatShellProps {
  children: React.ReactNode;
}

function ChatHeader() {
  return (
    <header className="sticky left-0 right-0 top-0 z-50">
      <div className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
          {/* Back button */}
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {/* Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <span className="text-base">💬</span>
              <span>Chat</span>
            </h1>
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
    <div className="relative flex min-h-dvh flex-col bg-background">
      <ChatHeader />

      <main className="flex flex-1 flex-col">
        <motion.div
          className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4 md:py-6"
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

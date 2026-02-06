"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine effective theme (handle "system" preference)
  const getEffectiveTheme = () => {
    if (theme === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return "light";
    }
    return theme;
  };

  const effectiveTheme = mounted ? getEffectiveTheme() : "light";

  const toggleTheme = () => {
    setTheme(effectiveTheme === "dark" ? "light" : "dark");
  };

  // Avoid flash on initial render
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400"
      >
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-all duration-150 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
    >
      <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" strokeWidth={1.75} />
      <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" strokeWidth={1.75} />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

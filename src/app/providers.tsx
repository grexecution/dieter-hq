"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { PWAInitializer } from "@/components/PWAInitializer";
import { UnifiedStoreProvider } from "@/lib/unified-store";
import { useViewPreloader } from "@/components/ViewTransition";

function ViewPreloaderEffect() {
  useViewPreloader();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <UnifiedStoreProvider>
        <PWAInitializer />
        <ViewPreloaderEffect />
        {children}
      </UnifiedStoreProvider>
    </ThemeProvider>
  );
}

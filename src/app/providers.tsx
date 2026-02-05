"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { PWAInitializer } from "@/components/PWAInitializer";
import { UnifiedStoreProvider } from "@/lib/unified-store";
import { useViewPreloader } from "@/components/ViewTransition";
import { useRouter } from "next/navigation";

function ViewPreloaderEffect() {
  useViewPreloader();
  return null;
}

function HeroUIWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  return (
    <HeroUIProvider navigate={router.push}>
      {children}
    </HeroUIProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <HeroUIWrapper>
        <UnifiedStoreProvider>
          <PWAInitializer />
          <ViewPreloaderEffect />
          {children}
        </UnifiedStoreProvider>
      </HeroUIWrapper>
    </ThemeProvider>
  );
}

/**
 * Responsive utility functions and hooks for Dieter HQ
 * Mobile-first responsive design helpers
 */

import { useEffect, useState } from "react";
import { designTokens } from "../tokens";

/**
 * Breakpoint type from design tokens
 */
export type Breakpoint = keyof typeof designTokens.breakpoints;

/**
 * Device type based on screen size
 */
export type DeviceType = "mobile" | "tablet" | "desktop";

/**
 * Parse breakpoint string to number
 */
export function parseBreakpoint(breakpoint: Breakpoint): number {
  return parseInt(designTokens.breakpoints[breakpoint]);
}

/**
 * Check if current viewport matches a media query
 */
export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(
    `(min-width: ${designTokens.breakpoints[breakpoint]})`
  ).matches;
}

/**
 * Get current device type based on viewport width
 */
export function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "mobile";

  const width = window.innerWidth;

  if (width >= parseBreakpoint("lg")) return "desktop";
  if (width >= parseBreakpoint("md")) return "tablet";
  return "mobile";
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if device has notch/safe area
 */
export function hasSafeArea(): boolean {
  if (typeof window === "undefined") return false;
  // Check for safe-area-inset support
  return CSS.supports("padding-top: env(safe-area-inset-top)");
}

/**
 * Hook: Get current breakpoint
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === "undefined") return "sm";

    const width = window.innerWidth;
    if (width >= parseBreakpoint("2xl")) return "2xl";
    if (width >= parseBreakpoint("xl")) return "xl";
    if (width >= parseBreakpoint("lg")) return "lg";
    if (width >= parseBreakpoint("md")) return "md";
    return "sm";
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= parseBreakpoint("2xl")) {
        setBreakpoint("2xl");
      } else if (width >= parseBreakpoint("xl")) {
        setBreakpoint("xl");
      } else if (width >= parseBreakpoint("lg")) {
        setBreakpoint("lg");
      } else if (width >= parseBreakpoint("md")) {
        setBreakpoint("md");
      } else {
        setBreakpoint("sm");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
}

/**
 * Hook: Get current device type
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(getDeviceType);

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
}

/**
 * Hook: Check if viewport matches a breakpoint
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
    // Legacy browsers
    else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

/**
 * Hook: Get viewport dimensions
 */
export function useViewportSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

/**
 * Hook: Detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook: Detect if mobile keyboard is open (iOS)
 */
export function useKeyboardOpen(): boolean {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isIOS()) return;

    const handleResize = () => {
      // On iOS, when keyboard opens, the viewport height decreases
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      
      // If viewport is significantly smaller than window, keyboard is likely open
      setIsOpen(viewportHeight < windowHeight * 0.75);
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  return isOpen;
}

/**
 * Responsive value helper
 * Returns different values based on current breakpoint
 */
export function useResponsiveValue<T>(values: {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}): T | undefined {
  const breakpoint = useBreakpoint();

  // Return value for current breakpoint or next smaller one
  if (breakpoint === "2xl" && values["2xl"]) return values["2xl"];
  if (["2xl", "xl"].includes(breakpoint) && values.xl) return values.xl;
  if (["2xl", "xl", "lg"].includes(breakpoint) && values.lg) return values.lg;
  if (["2xl", "xl", "lg", "md"].includes(breakpoint) && values.md)
    return values.md;
  return values.sm;
}

/**
 * Get responsive CSS value
 * Example: getResponsiveCSS({ sm: '1rem', md: '1.5rem', lg: '2rem' })
 */
export function getResponsiveCSS(values: {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
}): string {
  let css = "";

  if (values.sm) css += values.sm;
  if (values.md)
    css += `; @media (min-width: ${designTokens.breakpoints.md}) { ${values.md} }`;
  if (values.lg)
    css += `; @media (min-width: ${designTokens.breakpoints.lg}) { ${values.lg} }`;
  if (values.xl)
    css += `; @media (min-width: ${designTokens.breakpoints.xl}) { ${values.xl} }`;
  if (values["2xl"])
    css += `; @media (min-width: ${designTokens.breakpoints["2xl"]}) { ${values["2xl"]} }`;

  return css;
}

/**
 * Accessibility utilities for Dieter HQ
 * Helpers for WCAG compliance and keyboard navigation
 */

import { useEffect, useState } from "react";

/**
 * Focus trap utilities
 */

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details',
  'summary',
] as const;

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS.join(","))
  ).filter((el) => {
    // Filter out hidden elements
    return (
      el.offsetWidth > 0 &&
      el.offsetHeight > 0 &&
      window.getComputedStyle(el).visibility !== "hidden"
    );
  });
}

/**
 * Trap focus within an element (useful for modals, dialogs)
 */
export function trapFocus(
  element: HTMLElement,
  options?: {
    initialFocus?: HTMLElement;
    returnFocus?: HTMLElement;
  }
): () => void {
  const focusableElements = getFocusableElements(element);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  // Store previously focused element
  const previouslyFocused = options?.returnFocus || (document.activeElement as HTMLElement);

  // Focus initial element
  const initialElement = options?.initialFocus || firstFocusable;
  initialElement?.focus();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener("keydown", handleKeyDown);

  // Return cleanup function
  return () => {
    element.removeEventListener("keydown", handleKeyDown);
    previouslyFocused?.focus();
  };
}

/**
 * Hook: Trap focus within an element
 */
export function useFocusTrap(
  enabled: boolean,
  ref: React.RefObject<HTMLElement>,
  options?: {
    initialFocus?: HTMLElement;
    returnFocus?: HTMLElement;
  }
) {
  useEffect(() => {
    if (!enabled || !ref.current) return;
    return trapFocus(ref.current, options);
  }, [enabled, ref, options]);
}

/**
 * Announce to screen readers
 */
export function announce(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  const announcer = document.createElement("div");
  announcer.setAttribute("role", priority === "assertive" ? "alert" : "status");
  announcer.setAttribute("aria-live", priority);
  announcer.className = "sr-only";
  announcer.textContent = message;

  document.body.appendChild(announcer);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

/**
 * Hook: Announce messages to screen readers
 */
export function useAnnounce() {
  return announce;
}

/**
 * Generate unique ID for accessibility
 */
let idCounter = 0;
export function generateId(prefix = "dieter-hq"): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Hook: Generate unique ID
 */
export function useId(prefix?: string): string {
  const [id] = useState(() => generateId(prefix));
  return id;
}

/**
 * Check color contrast ratio (WCAG)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color contrast meets WCAG standards
 */
export function meetsContrastRequirement(
  color1: string,
  color2: string,
  level: "AA" | "AAA" = "AA",
  size: "normal" | "large" = "normal"
): boolean {
  const ratio = getContrastRatio(color1, color2);

  const requirements = {
    AA: {
      normal: 4.5,
      large: 3,
    },
    AAA: {
      normal: 7,
      large: 4.5,
    },
  };

  return ratio >= requirements[level][size];
}

/**
 * Hook: Detect keyboard navigation mode
 */
export function useKeyboardNavigation(): boolean {
  const [isUsingKeyboard, setIsUsingKeyboard] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        setIsUsingKeyboard(true);
      }
    };

    const handleMouseDown = () => {
      setIsUsingKeyboard(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return isUsingKeyboard;
}

/**
 * Hook: Detect if user is using screen reader
 * Note: This is not 100% reliable, use with caution
 */
export function useScreenReader(): boolean {
  const [isScreenReader, setIsScreenReader] = useState(false);

  useEffect(() => {
    // Check for common screen reader indicators
    const hasAriaLive = document.querySelector('[aria-live]') !== null;
    const hasAriaAtomic = document.querySelector('[aria-atomic]') !== null;
    
    setIsScreenReader(hasAriaLive || hasAriaAtomic);
  }, []);

  return isScreenReader;
}

/**
 * Create ARIA label from React children
 */
export function getAriaLabel(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) {
    return children.map(getAriaLabel).join(" ");
  }
  return "";
}

/**
 * Skip link component helper
 */
export function createSkipLink(
  targetId: string,
  label: string = "Skip to main content"
) {
  return {
    href: `#${targetId}`,
    label,
    className: "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg",
  };
}

/**
 * Visually hidden class (accessible to screen readers)
 */
export const srOnlyClass =
  "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0";

/**
 * Focus visible class (only show focus ring for keyboard users)
 */
export const focusVisibleClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * ARIA attributes helper
 */
export function getAriaAttributes(props: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  pressed?: boolean;
  selected?: boolean;
  current?: boolean | "page" | "step" | "location" | "date" | "time";
  disabled?: boolean;
  hidden?: boolean;
  live?: "off" | "polite" | "assertive";
  atomic?: boolean;
  relevant?: "additions" | "removals" | "text" | "all";
}): Record<string, any> {
  const attrs: Record<string, any> = {};

  if (props.label) attrs["aria-label"] = props.label;
  if (props.labelledBy) attrs["aria-labelledby"] = props.labelledBy;
  if (props.describedBy) attrs["aria-describedby"] = props.describedBy;
  if (props.expanded !== undefined) attrs["aria-expanded"] = props.expanded;
  if (props.pressed !== undefined) attrs["aria-pressed"] = props.pressed;
  if (props.selected !== undefined) attrs["aria-selected"] = props.selected;
  if (props.current !== undefined) attrs["aria-current"] = props.current;
  if (props.disabled) attrs["aria-disabled"] = true;
  if (props.hidden) attrs["aria-hidden"] = true;
  if (props.live) attrs["aria-live"] = props.live;
  if (props.atomic !== undefined) attrs["aria-atomic"] = props.atomic;
  if (props.relevant) attrs["aria-relevant"] = props.relevant;

  return attrs;
}

/**
 * Dieter HQ Design System — Component Class Patterns
 * 
 * Reusable Tailwind class compositions for consistent UI.
 * Import and spread these in your components.
 * 
 * Usage:
 *   import { buttonStyles, cardStyles } from '@/design-system/components';
 *   <button className={buttonStyles.primary}>Click</button>
 */

// =============================================================================
// BUTTONS
// =============================================================================

export const buttonBase = [
  "inline-flex items-center justify-center",
  "font-medium",
  "transition-colors duration-normal",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

export const buttonStyles = {
  // Primary — main CTA, use sparingly
  primary: [
    buttonBase,
    "bg-primary-600 text-white",
    "hover:bg-primary-700",
    "focus-visible:ring-primary-500",
  ].join(" "),

  // Secondary — default button
  secondary: [
    buttonBase,
    "bg-zinc-100 text-zinc-900",
    "hover:bg-zinc-200",
    "focus-visible:ring-zinc-500",
    "dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
  ].join(" "),

  // Ghost — subtle, no background
  ghost: [
    buttonBase,
    "text-zinc-600",
    "hover:bg-zinc-100 hover:text-zinc-900",
    "focus-visible:ring-zinc-500",
    "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
  ].join(" "),

  // Outline — bordered
  outline: [
    buttonBase,
    "border border-zinc-300 bg-transparent text-zinc-900",
    "hover:bg-zinc-100",
    "focus-visible:ring-zinc-500",
    "dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
  ].join(" "),

  // Destructive — danger actions
  destructive: [
    buttonBase,
    "bg-error-600 text-white",
    "hover:bg-error-700",
    "focus-visible:ring-error-500",
  ].join(" "),

  // Link — looks like a link
  link: [
    buttonBase,
    "text-primary-600 underline-offset-4",
    "hover:underline",
    "dark:text-primary-400",
  ].join(" "),
} as const;

export const buttonSizes = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-10 px-5 text-base rounded-lg",
  icon: "h-9 w-9 rounded-md",
} as const;

// =============================================================================
// CARDS
// =============================================================================

export const cardStyles = {
  // Default card — subtle border
  default: [
    "rounded-lg border border-zinc-200 bg-white",
    "dark:border-zinc-800 dark:bg-zinc-900",
  ].join(" "),

  // Elevated — with shadow
  elevated: [
    "rounded-lg border border-zinc-200 bg-white shadow-md",
    "dark:border-zinc-800 dark:bg-zinc-900",
  ].join(" "),

  // Interactive — hover state
  interactive: [
    "rounded-lg border border-zinc-200 bg-white",
    "transition-all duration-normal",
    "hover:border-zinc-300 hover:shadow-sm",
    "dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
  ].join(" "),

  // Ghost — no border, subtle bg
  ghost: [
    "rounded-lg bg-zinc-50",
    "dark:bg-zinc-800/50",
  ].join(" "),
} as const;

export const cardPadding = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

// =============================================================================
// INPUTS
// =============================================================================

export const inputBase = [
  "flex w-full rounded-md border bg-transparent px-3 py-2",
  "text-sm placeholder:text-zinc-400",
  "transition-colors duration-normal",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

export const inputStyles = {
  default: [
    inputBase,
    "border-zinc-300 text-zinc-900",
    "focus-visible:ring-primary-500",
    "dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500",
  ].join(" "),

  error: [
    inputBase,
    "border-error-500 text-zinc-900",
    "focus-visible:ring-error-500",
    "dark:border-error-500 dark:text-zinc-100",
  ].join(" "),

  success: [
    inputBase,
    "border-success-500 text-zinc-900",
    "focus-visible:ring-success-500",
    "dark:border-success-500 dark:text-zinc-100",
  ].join(" "),
} as const;

export const inputSizes = {
  sm: "h-8 text-sm",
  md: "h-9 text-sm",
  lg: "h-10 text-base",
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const headingStyles = {
  // Page title — ONLY use 2xl here
  h1: "text-2xl font-semibold text-zinc-900 dark:text-zinc-100",
  
  // Section heading
  h2: "text-xl font-semibold text-zinc-900 dark:text-zinc-100",
  
  // Subsection
  h3: "text-lg font-medium text-zinc-900 dark:text-zinc-100",
  
  // Small heading
  h4: "text-base font-medium text-zinc-900 dark:text-zinc-100",
} as const;

export const textStyles = {
  // Body text
  body: "text-base text-zinc-700 dark:text-zinc-300",
  
  // Secondary text
  secondary: "text-sm text-zinc-500 dark:text-zinc-400",
  
  // Muted/tertiary text
  muted: "text-sm text-zinc-400 dark:text-zinc-500",
  
  // Small/caption text
  caption: "text-xs text-zinc-500 dark:text-zinc-400",
  
  // Code/mono text
  code: "font-mono text-sm bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded",
  
  // Link
  link: "text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline-offset-4 hover:underline",
} as const;

// =============================================================================
// BADGES / TAGS
// =============================================================================

export const badgeBase = [
  "inline-flex items-center rounded-full px-2.5 py-0.5",
  "text-xs font-medium",
].join(" ");

export const badgeStyles = {
  default: [
    badgeBase,
    "bg-zinc-100 text-zinc-700",
    "dark:bg-zinc-800 dark:text-zinc-300",
  ].join(" "),

  primary: [
    badgeBase,
    "bg-primary-100 text-primary-700",
    "dark:bg-primary-900/30 dark:text-primary-400",
  ].join(" "),

  success: [
    badgeBase,
    "bg-success-100 text-success-700",
    "dark:bg-success-900/30 dark:text-success-400",
  ].join(" "),

  warning: [
    badgeBase,
    "bg-warning-100 text-warning-700",
    "dark:bg-warning-900/30 dark:text-warning-400",
  ].join(" "),

  error: [
    badgeBase,
    "bg-error-100 text-error-700",
    "dark:bg-error-900/30 dark:text-error-400",
  ].join(" "),

  info: [
    badgeBase,
    "bg-info-100 text-info-700",
    "dark:bg-info-900/30 dark:text-info-400",
  ].join(" "),
} as const;

// =============================================================================
// DIVIDERS
// =============================================================================

export const dividerStyles = {
  horizontal: "h-px w-full bg-zinc-200 dark:bg-zinc-800",
  vertical: "h-full w-px bg-zinc-200 dark:bg-zinc-800",
} as const;

// =============================================================================
// OVERLAYS
// =============================================================================

export const overlayStyles = {
  // Modal backdrop
  backdrop: [
    "fixed inset-0 z-overlay",
    "bg-black/50 backdrop-blur-sm",
    "animate-fade-in",
  ].join(" "),

  // Modal container
  modal: [
    "fixed left-1/2 top-1/2 z-modal -translate-x-1/2 -translate-y-1/2",
    "w-full max-w-lg",
    "rounded-xl border border-zinc-200 bg-white p-6 shadow-xl",
    "animate-scale-in",
    "dark:border-zinc-800 dark:bg-zinc-900",
  ].join(" "),

  // Dropdown/popover
  popover: [
    "z-popover",
    "rounded-lg border border-zinc-200 bg-white p-2 shadow-lg",
    "animate-fade-in-up",
    "dark:border-zinc-800 dark:bg-zinc-900",
  ].join(" "),

  // Tooltip
  tooltip: [
    "z-tooltip",
    "rounded-md bg-zinc-900 px-2 py-1 text-xs text-white",
    "animate-fade-in",
    "dark:bg-zinc-100 dark:text-zinc-900",
  ].join(" "),
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const containerStyles = {
  // Default container
  default: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
  
  // Narrow container (for content)
  narrow: "mx-auto w-full max-w-3xl px-4 sm:px-6",
  
  // Wide container
  wide: "mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8",
  
  // Full width
  full: "w-full px-4 sm:px-6 lg:px-8",
} as const;

export const stackStyles = {
  // Vertical stack with gap options
  vertical: {
    xs: "flex flex-col gap-1",
    sm: "flex flex-col gap-2",
    md: "flex flex-col gap-4",
    lg: "flex flex-col gap-6",
    xl: "flex flex-col gap-8",
  },
  
  // Horizontal stack with gap options
  horizontal: {
    xs: "flex flex-row items-center gap-1",
    sm: "flex flex-row items-center gap-2",
    md: "flex flex-row items-center gap-4",
    lg: "flex flex-row items-center gap-6",
    xl: "flex flex-row items-center gap-8",
  },
} as const;

// =============================================================================
// FOCUS STATES
// =============================================================================

export const focusStyles = {
  // Default focus ring
  ring: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
  
  // Focus within (for containers)
  within: "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2",
  
  // No focus ring (for custom handling)
  none: "focus:outline-none focus-visible:outline-none",
} as const;

// =============================================================================
// SCROLLBARS
// =============================================================================

export const scrollbarStyles = {
  // Hidden scrollbar (still scrollable)
  hidden: "scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  
  // Thin scrollbar
  thin: "[scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.300)_transparent] dark:[scrollbar-color:theme(colors.zinc.700)_transparent]",
} as const;

// =============================================================================
// UTILITY PATTERNS
// =============================================================================

export const utilityPatterns = {
  // Center content
  center: "flex items-center justify-center",
  
  // Screen reader only
  srOnly: "sr-only",
  
  // Truncate text
  truncate: "truncate",
  
  // Line clamp
  lineClamp: {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
  },
  
  // Aspect ratios
  aspect: {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  },
} as const;

// =============================================================================
// COMPONENT BUILDER HELPER
// =============================================================================

/**
 * Combines class names, filtering out falsy values.
 * Simple alternative to clsx/cn for internal use.
 */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

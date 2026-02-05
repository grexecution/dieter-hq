// Type definitions for design tokens
export type ColorTheme = "light" | "dark";
export type SpacingKey = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type FontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
export type FontWeight = "normal" | "medium" | "semibold" | "bold";
export type BorderRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export type Shadow = "none" | "sm" | "md" | "lg" | "xl" | "2xl";
export type Blur = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

export const designTokens = {
  colors: {
    primary: {
      DEFAULT: "#10b981",
      foreground: "#ffffff",
    },
    background: "#09090b",
    foreground: "#fafafa",
    muted: "#27272a",
    accent: "#18181b",
  },
  typography: {
    fontFamily: {
      sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      mono: ["var(--font-geist-mono)", "monospace"],
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
};

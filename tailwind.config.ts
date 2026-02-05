import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Dieter HQ Tailwind Configuration
 * 
 * Uses design tokens from src/design-system/tokens.ts
 * DO NOT add arbitrary values — use the token system.
 */

// Inline tokens to avoid build-time import issues
// These MUST match src/design-system/tokens.ts exactly

const fontFamily = {
  sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Consolas", "monospace"],
};

// Strict font size scale — 2xl is ONLY for main headings
const fontSize = {
  xs: ["0.75rem", { lineHeight: "1rem" }],       // 12px
  sm: ["0.875rem", { lineHeight: "1.25rem" }],   // 14px
  base: ["1rem", { lineHeight: "1.5rem" }],      // 16px
  lg: ["1.125rem", { lineHeight: "1.75rem" }],   // 18px
  xl: ["1.25rem", { lineHeight: "1.75rem" }],    // 20px
  "2xl": ["1.5rem", { lineHeight: "2rem" }],     // 24px — MAIN HEADINGS ONLY
} as const;

// Zinc neutral palette
const zinc = {
  50: "#fafafa",
  100: "#f4f4f5",
  200: "#e4e4e7",
  300: "#d4d4d8",
  400: "#a1a1aa",
  500: "#71717a",
  600: "#52525b",
  700: "#3f3f46",
  800: "#27272a",
  900: "#18181b",
  950: "#09090b",
};

// Indigo primary palette
const indigo = {
  50: "#eef2ff",
  100: "#e0e7ff",
  200: "#c7d2fe",
  300: "#a5b4fc",
  400: "#818cf8",
  500: "#6366f1",
  600: "#4f46e5",
  700: "#4338ca",
  800: "#3730a3",
  900: "#312e81",
  950: "#1e1b4b",
};

// Status colors
const emerald = {
  50: "#ecfdf5",
  100: "#d1fae5",
  200: "#a7f3d0",
  300: "#6ee7b7",
  400: "#34d399",
  500: "#10b981",
  600: "#059669",
  700: "#047857",
  800: "#065f46",
  900: "#064e3b",
  950: "#022c22",
};

const amber = {
  50: "#fffbeb",
  100: "#fef3c7",
  200: "#fde68a",
  300: "#fcd34d",
  400: "#fbbf24",
  500: "#f59e0b",
  600: "#d97706",
  700: "#b45309",
  800: "#92400e",
  900: "#78350f",
  950: "#451a03",
};

const red = {
  50: "#fef2f2",
  100: "#fee2e2",
  200: "#fecaca",
  300: "#fca5a5",
  400: "#f87171",
  500: "#ef4444",
  600: "#dc2626",
  700: "#b91c1c",
  800: "#991b1b",
  900: "#7f1d1d",
  950: "#450a0a",
};

const blue = {
  50: "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#3b82f6",
  600: "#2563eb",
  700: "#1d4ed8",
  800: "#1e40af",
  900: "#1e3a8a",
  950: "#172554",
};

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    // Override default font sizes with our strict scale
    fontSize,
    extend: {
      // Color system
      colors: {
        // Raw palettes for direct use (e.g., bg-zinc-900)
        zinc,
        indigo,
        emerald,
        amber,
        red,
        blue,

        // Semantic tokens (CSS variables for theme switching)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        background: {
          DEFAULT: "hsl(var(--background))",
          secondary: "hsl(var(--background-secondary))",
          tertiary: "hsl(var(--background-tertiary))",
          elevated: "hsl(var(--background-elevated))",
        },
        
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          secondary: "hsl(var(--foreground-secondary))",
          tertiary: "hsl(var(--foreground-tertiary))",
        },
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          ...indigo, // Include full scale for primary-500, etc.
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          ...emerald,
        },
        
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          ...amber,
        },
        
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
          ...red,
        },
        
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          ...blue,
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },

      // Border radius — consistent curve system
      borderRadius: {
        none: "0",
        sm: "0.25rem",    // 4px
        DEFAULT: "0.375rem", // 6px
        md: "0.5rem",     // 8px
        lg: "0.75rem",    // 12px
        xl: "1rem",       // 16px
        "2xl": "1.5rem",  // 24px
        "3xl": "2rem",    // 32px
        full: "9999px",
      },

      // Shadows — subtle, layered
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        DEFAULT: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        none: "none",
      },

      // Font families
      fontFamily,

      // Z-index scale
      zIndex: {
        hide: "-1",
        auto: "auto",
        base: "0",
        docked: "10",
        dropdown: "1000",
        sticky: "1100",
        banner: "1200",
        overlay: "1300",
        modal: "1400",
        popover: "1500",
        skipLink: "1600",
        toast: "1700",
        tooltip: "1800",
      },

      // Animation keyframes
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeOut: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        slideInLeft: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        slideOutRight: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        slideOutLeft: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        scaleOut: {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },

      // Animations
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        "fade-in": "fadeIn 150ms ease-out",
        "fade-out": "fadeOut 150ms ease-in",
        "fade-in-up": "fadeInUp 200ms ease-out",
        "fade-in-down": "fadeInDown 200ms ease-out",
        "slide-in-right": "slideInRight 200ms ease-out",
        "slide-in-left": "slideInLeft 200ms ease-out",
        "slide-out-right": "slideOutRight 200ms ease-in",
        "slide-out-left": "slideOutLeft 200ms ease-in",
        "scale-in": "scaleIn 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "scale-out": "scaleOut 150ms ease-in",
        spin: "spin 1s linear infinite",
        pulse: "pulse 2s ease-in-out infinite",
      },

      // Backdrop blur
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "40px",
        "3xl": "64px",
      },

      // Transition durations from tokens
      transitionDuration: {
        instant: "0ms",
        fast: "100ms",
        normal: "150ms",
        medium: "200ms",
        slow: "300ms",
        slower: "400ms",
        slowest: "500ms",
      },

      // Transition timing functions
      transitionTimingFunction: {
        linear: "linear",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        out: "cubic-bezier(0, 0, 0.2, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [animate],
};

export default config;

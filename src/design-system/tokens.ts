/**
 * Design Tokens for Dieter HQ
 * iOS-inspired design system with frosted glass aesthetics
 * Mobile-first, responsive, and theme-aware
 */

export const designTokens = {
  // Color System
  colors: {
    // Base colors - HSL format for easy manipulation
    light: {
      // Surface colors
      background: {
        primary: '0 0% 100%',        // Pure white
        secondary: '210 40% 98%',    // Off-white
        tertiary: '210 40% 96.1%',   // Light gray
        elevated: '0 0% 100%',       // For cards/modals
      },
      foreground: {
        primary: '222.2 84% 4.9%',   // Near black
        secondary: '215.4 16.3% 46.9%', // Medium gray
        tertiary: '215 20.2% 65.1%', // Light gray text
        inverse: '210 40% 98%',      // For dark backgrounds
      },
      // Brand colors
      accent: {
        blue: '211 100% 50%',        // iOS blue
        purple: '271 81% 56%',       // iOS purple
        pink: '330 81% 60%',         // iOS pink
        red: '0 84.2% 60.2%',        // iOS red
        orange: '28 100% 54%',       // iOS orange
        yellow: '48 100% 54%',       // iOS yellow
        green: '142 71% 45%',        // iOS green
        teal: '174 72% 42%',         // iOS teal
      },
      // UI states
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '211 100% 50%',          // Focus ring
      divider: '214.3 31.8% 91.4%',
    },
    dark: {
      // Surface colors - elevated surfaces are lighter in dark mode (iOS style)
      background: {
        primary: '240 10% 3.9%',     // Near black
        secondary: '222.2 84% 4.9%', // Dark gray
        tertiary: '217.2 32.6% 17.5%', // Lighter dark
        elevated: '240 5% 8%',       // Elevated surfaces
      },
      foreground: {
        primary: '210 40% 98%',      // Near white
        secondary: '215 20.2% 65.1%', // Medium gray
        tertiary: '215.4 16.3% 46.9%', // Dark gray text
        inverse: '222.2 84% 4.9%',   // For light backgrounds
      },
      // Brand colors - slightly muted for dark mode
      accent: {
        blue: '211 100% 55%',
        purple: '271 81% 61%',
        pink: '330 81% 65%',
        red: '0 84.2% 65%',
        orange: '28 100% 59%',
        yellow: '48 100% 59%',
        green: '142 71% 50%',
        teal: '174 72% 47%',
      },
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '211 100% 55%',
      divider: '217.2 32.6% 17.5%',
    },
  },

  // Spacing System (based on 4px base unit)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  // Typography System
  typography: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"SF Pro Display"',
        '"SF Pro Text"',
        'system-ui',
        'sans-serif',
      ],
      mono: [
        '"SF Mono"',
        'ui-monospace',
        'Monaco',
        'Consolas',
        'monospace',
      ],
    },
    fontSize: {
      // iOS-inspired scale
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    letterSpacing: {
      tighter: '-0.02em',
      tight: '-0.01em',
      normal: '0',
      wide: '0.01em',
      wider: '0.02em',
    },
  },

  // Border Radius (iOS-style rounded corners)
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },

  // Shadows (iOS-inspired)
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    // Frosted glass specific
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    'glass-lg': '0 16px 48px 0 rgba(31, 38, 135, 0.2)',
  },

  // Blur values for frosted glass
  blur: {
    none: '0',
    sm: '4px',
    base: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px',
  },

  // Animation & Transitions (iOS-inspired easing)
  animation: {
    duration: {
      fast: '150ms',
      base: '200ms',
      medium: '300ms',
      slow: '400ms',
      slower: '500ms',
    },
    easing: {
      // iOS standard easing
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
      // iOS spring-like easing
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    toast: 1600,
    tooltip: 1700,
  },

  // Breakpoints (mobile-first)
  breakpoints: {
    sm: '640px',   // Mobile landscape
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1280px',  // Large desktop
    '2xl': '1536px', // Extra large
  },

  // Glass morphism presets
  glass: {
    // Light mode glass
    light: {
      subtle: {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(8px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      },
      medium: {
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      strong: {
        background: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(16px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
    },
    // Dark mode glass
    dark: {
      subtle: {
        background: 'rgba(20, 20, 30, 0.7)',
        backdropFilter: 'blur(8px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
      medium: {
        background: 'rgba(20, 20, 30, 0.6)',
        backdropFilter: 'blur(12px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      },
      strong: {
        background: 'rgba(20, 20, 30, 0.5)',
        backdropFilter: 'blur(16px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      },
    },
  },
} as const;

// Type exports
export type ColorTheme = keyof typeof designTokens.colors;
export type SpacingKey = keyof typeof designTokens.spacing;
export type FontSize = keyof typeof designTokens.typography.fontSize;
export type FontWeight = keyof typeof designTokens.typography.fontWeight;
export type BorderRadius = keyof typeof designTokens.borderRadius;
export type Shadow = keyof typeof designTokens.shadows;
export type Blur = keyof typeof designTokens.blur;
export type Breakpoint = keyof typeof designTokens.breakpoints;

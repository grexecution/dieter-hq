/**
 * Design System Tokens
 * 
 * Centralized design tokens for consistent styling across the application.
 * These values are used by Tailwind CSS config and components.
 */

export const designTokens = {
  // Typography
  typography: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        'SF Pro Text',
        'SF Pro Display',
        'Inter',
        'system-ui',
        'sans-serif',
      ],
      mono: [
        'SF Mono',
        'Fira Code',
        'Monaco',
        'Menlo',
        'monospace',
      ],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },

  // Colors (semantic, not raw values)
  colors: {
    brand: {
      primary: 'hsl(217, 91%, 60%)', // Blue
      secondary: 'hsl(263, 70%, 50%)', // Purple
      accent: 'hsl(142, 71%, 45%)', // Green
    },
    semantic: {
      success: 'hsl(142, 76%, 36%)',
      warning: 'hsl(43, 96%, 56%)',
      error: 'hsl(0, 84%, 60%)',
      info: 'hsl(199, 89%, 48%)',
    },
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
    glassDark: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },

  // Animation
  animation: {
    durations: {
      fast: '150ms',
      base: '200ms',
      medium: '300ms',
      slow: '400ms',
      verySlow: '600ms',
    },
    easings: {
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index scale
  zIndex: {
    dropdown: 50,
    sticky: 100,
    modal: 200,
    overlay: 300,
    toast: 400,
    tooltip: 500,
  },

  // Glass effect values
  glass: {
    blur: {
      light: '8px',
      medium: '16px',
      strong: '24px',
    },
    opacity: {
      light: {
        bg: 0.4,
        border: 0.3,
      },
      dark: {
        bg: 0.3,
        border: 0.2,
      },
    },
  },
} as const;

export type DesignTokens = typeof designTokens;

// Utility function to get CSS variable value
export function getCSSVar(name: string): string {
  return `var(--${name})`;
}

// Export commonly used token groups
export const { typography, spacing, colors, borderRadius, shadows, animation } = designTokens;

// Type exports for design system
export type ColorTheme = 'light' | 'dark' | 'system';
export type SpacingKey = keyof typeof designTokens.spacing;
export type FontSize = keyof typeof designTokens.typography.fontSize;
export type FontWeight = keyof typeof designTokens.typography.fontWeight;
export type BorderRadius = keyof typeof designTokens.borderRadius;
export type Shadow = keyof typeof designTokens.shadows;
export type Blur = keyof typeof designTokens.glass.blur;
export type Breakpoint = keyof typeof designTokens.breakpoints;

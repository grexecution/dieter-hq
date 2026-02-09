# Design Tokens: Figma → Tailwind

## Workflow

1. Figma MCP liefert Design Tokens
2. Tokens in `tailwind.config.ts` übertragen
3. CSS Custom Properties für dynamische Werte

## Farben

### Aus Figma MCP extrahieren:
```json
{
  "colors": {
    "primary": { "500": "#3B82F6", "600": "#2563EB" },
    "secondary": { "500": "#10B981" },
    "neutral": { "50": "#F9FAFB", "900": "#111827" }
  }
}
```

### In tailwind.config.ts:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',  // Main
          600: '#2563EB',  // Hover
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          // ... same pattern
        },
      },
    },
  },
}
```

## Typography

### Aus Figma MCP:
```json
{
  "typography": {
    "fontFamily": {
      "heading": "Inter",
      "body": "Inter"
    },
    "fontSize": {
      "h1": { "size": "48px", "lineHeight": "1.2", "weight": "700" },
      "h2": { "size": "36px", "lineHeight": "1.25", "weight": "600" },
      "body": { "size": "16px", "lineHeight": "1.6", "weight": "400" }
    }
  }
}
```

### In tailwind.config.ts:
```ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      'display-xl': ['4rem', { lineHeight: '1.1', fontWeight: '700' }],
      'display-lg': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
      'display-md': ['2.25rem', { lineHeight: '1.25', fontWeight: '600' }],
      'display-sm': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
      'body-lg': ['1.125rem', { lineHeight: '1.6' }],
      'body': ['1rem', { lineHeight: '1.6' }],
      'body-sm': ['0.875rem', { lineHeight: '1.5' }],
    },
  },
}
```

## Spacing

### Figma Spacing System (8px Grid):
```ts
theme: {
  extend: {
    spacing: {
      '18': '4.5rem',   // 72px
      '22': '5.5rem',   // 88px
      '30': '7.5rem',   // 120px
    },
    padding: {
      'section': '5rem',      // Vertical section padding
      'section-sm': '3rem',   // Mobile section padding
    },
  },
}
```

## Border Radius

```ts
theme: {
  extend: {
    borderRadius: {
      'xl': '1rem',      // 16px - Cards
      '2xl': '1.5rem',   // 24px - Large cards
      '3xl': '2rem',     // 32px - Hero elements
    },
  },
}
```

## Shadows

```ts
theme: {
  extend: {
    boxShadow: {
      'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      'button': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },
  },
}
```

## CSS Custom Properties (design-tokens.css)

```css
:root {
  /* Colors */
  --color-primary: 59 130 246;      /* RGB for opacity support */
  --color-secondary: 16 185 129;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Inter', system-ui, sans-serif;
  
  /* Spacing */
  --section-padding: 5rem;
  --container-padding: 1.5rem;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}

@media (max-width: 768px) {
  :root {
    --section-padding: 3rem;
    --container-padding: 1rem;
  }
}
```

## Utility: cn() Helper

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

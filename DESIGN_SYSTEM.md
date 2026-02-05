# Dieter HQ Design System

## 🎨 Overview

The Dieter HQ design system is an iOS-inspired, mobile-first UI framework featuring frosted glass aesthetics (glassmorphism), smooth animations, and a comprehensive design token system.

## 📐 Design Principles

### 1. **Mobile-First & Responsive**
- All components are designed for mobile devices first
- Progressive enhancement for tablets and desktops
- Touch-friendly targets (minimum 44x44px)
- Safe area support for notched devices

### 2. **iOS-Inspired Aesthetics**
- Frosted glass (glassmorphism) effects
- Smooth, spring-like animations
- System font stack (SF Pro)
- Elevated surface hierarchy

### 3. **Accessibility**
- WCAG 2.1 AA compliant color contrasts
- Keyboard navigation support
- Screen reader friendly
- Focus indicators

### 4. **Performance**
- CSS custom properties for theming
- Hardware-accelerated animations
- Minimal repaints/reflows
- Optimized backdrop filters

---

## 🎯 Design Tokens

Design tokens are located in `/src/design-system/tokens.ts` and define the foundation of the design system.

### Color System

#### Light Mode
```css
--background: 0 0% 100%              /* Pure white */
--foreground: 222.2 84% 4.9%         /* Near black */
--primary: 211 100% 50%              /* iOS blue */
--accent: 211 100% 50%               /* Interactive elements */
```

#### Dark Mode
```css
--background: 240 10% 3.9%           /* Near black */
--foreground: 210 40% 98%            /* Near white */
--primary: 211 100% 55%              /* Lighter blue for contrast */
```

**Note:** Dark mode uses elevated surfaces that are *lighter* than the background (iOS style).

### Spacing Scale

Based on a 4px base unit:

```typescript
spacing: {
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  // ... etc
}
```

### Typography

#### Font Family
- **Sans:** SF Pro Display, SF Pro Text, system-ui
- **Mono:** SF Mono, Monaco, Consolas

#### Scale
```typescript
fontSize: {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  2xl: '1.5rem',    // 24px
  // ... etc
}
```

#### Font Weights
- **light:** 300
- **normal:** 400
- **medium:** 500
- **semibold:** 600
- **bold:** 700

### Border Radius

iOS-style rounded corners:
```typescript
borderRadius: {
  sm: '0.375rem',   // 6px
  base: '0.5rem',   // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  2xl: '1.5rem',    // 24px
  full: '9999px',
}
```

---

## 🧊 Frosted Glass System

### Glass Variants

#### Subtle Glass
```tsx
<div className="glass">
  // Light, minimal blur
</div>
```

#### Medium Glass
```tsx
<div className="glass-medium">
  // Medium blur, good for cards
</div>
```

#### Strong Glass
```tsx
<div className="glass-strong">
  // Heavy blur, for prominent elements
</div>
```

### Elevated Glass

Add shadow for floating effect:
```tsx
<div className="glass-elevated">
  // Glass + shadow
</div>
```

### Glass Properties

```css
/* Light Mode */
--glass-bg: rgba(255, 255, 255, 0.7)
--glass-border: rgba(255, 255, 255, 0.3)
backdrop-filter: blur(12px) saturate(180%)

/* Dark Mode */
--glass-bg: rgba(20, 20, 30, 0.7)
--glass-border: rgba(255, 255, 255, 0.1)
backdrop-filter: blur(12px) saturate(180%)
```

---

## 🧩 Component Library

### GlassCard

Frosted glass card component with multiple variants.

```tsx
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";

<GlassCard variant="medium" elevated interactive>
  <GlassCardHeader>
    <GlassCardTitle>Card Title</GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    Content goes here
  </GlassCardContent>
</GlassCard>
```

**Props:**
- `variant`: `"subtle" | "medium" | "strong"`
- `elevated`: `boolean` - Add shadow
- `interactive`: `boolean` - Add hover effects
- `padding`: `"none" | "sm" | "base" | "lg" | "xl"`

### GlassButton

iOS-style button with glass and solid variants.

```tsx
import { GlassButton } from "@/components/ui/glass-button";

<GlassButton variant="glass-primary" size="lg">
  Click me
</GlassButton>
```

**Variants:**
- `glass` - Subtle glass effect
- `glass-primary` - Glass with primary accent
- `glass-secondary` - Glass with secondary accent
- `glass-destructive` - Glass with destructive color
- `primary` - Solid primary button
- `secondary` - Solid secondary button
- `outline` - Outlined button
- `ghost` - No background

**Sizes:**
- `sm`, `base`, `lg`, `xl`
- `icon`, `icon-sm`, `icon-lg` - Square icon buttons

**Additional Props:**
- `loading`: `boolean` - Show loading spinner

### GlassInput

Glass input field with icon support.

```tsx
import { GlassInput } from "@/components/ui/glass-input";
import { Search } from "lucide-react";

<GlassInput
  variant="glass"
  inputSize="lg"
  icon={<Search />}
  iconPosition="left"
  placeholder="Search..."
  error={false}
  helperText="Helper text"
/>
```

**Props:**
- `variant`: `"glass" | "glass-medium" | "outline" | "filled"`
- `inputSize`: `"sm" | "base" | "lg"`
- `icon`: React node
- `iconPosition`: `"left" | "right"`
- `error`: `boolean`
- `helperText`: `string`

### GlassNav

Navigation bar with frosted glass background.

```tsx
import { GlassNav, GlassNavGroup, GlassNavItem } from "@/components/ui/glass-nav";
import { Home, Search, Settings } from "lucide-react";

<GlassNav position="bottom" blur safeArea>
  <GlassNavGroup>
    <GlassNavItem active icon={<Home />} label="Home" href="/" />
    <GlassNavItem icon={<Search />} label="Search" href="/search" />
    <GlassNavItem icon={<Settings />} label="Settings" href="/settings" />
  </GlassNavGroup>
</GlassNav>
```

**GlassNav Props:**
- `position`: `"top" | "bottom" | "static"`
- `blur`: `boolean` - Enable backdrop blur
- `safeArea`: `boolean` - Add safe area padding

### GlassModal

Modal dialog with glass background.

```tsx
import {
  GlassModal,
  GlassModalTrigger,
  GlassModalContent,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
  GlassModalFooter,
} from "@/components/ui/glass-modal";

<GlassModal>
  <GlassModalTrigger asChild>
    <button>Open Modal</button>
  </GlassModalTrigger>
  <GlassModalContent>
    <GlassModalHeader>
      <GlassModalTitle>Modal Title</GlassModalTitle>
      <GlassModalDescription>
        Modal description text
      </GlassModalDescription>
    </GlassModalHeader>
    <div>Modal content</div>
    <GlassModalFooter>
      <GlassButton>Confirm</GlassButton>
    </GlassModalFooter>
  </GlassModalContent>
</GlassModal>
```

---

## 🎬 Animations

### Animation Utilities

```tsx
// Fade in
<div className="animate-fade-in">Content</div>

// Fade in with upward motion
<div className="animate-fade-in-up">Content</div>

// Slide in from right
<div className="animate-slide-in-right">Content</div>

// Scale in (spring effect)
<div className="animate-scale-in">Content</div>

// Pulse
<div className="animate-pulse">Content</div>
```

### Transition Utilities

```tsx
// Smooth transition (iOS standard easing)
<div className="transition-smooth">Content</div>

// Spring transition
<div className="transition-spring">Content</div>

// Lift on hover
<button className="hover-lift">Button</button>

// Press effect
<button className="hover-press">Button</button>
```

### Custom Animations

Animation durations and easing functions:
```css
--duration-fast: 150ms
--duration-base: 200ms
--duration-medium: 300ms
--duration-slow: 400ms

--easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1)
--easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

---

## 📱 Responsive Design

### Breakpoints

```typescript
breakpoints: {
  sm: '640px',    // Mobile landscape
  md: '768px',    // Tablet
  lg: '1024px',   // Desktop
  xl: '1280px',   // Large desktop
  '2xl': '1536px' // Extra large
}
```

### Usage

```tsx
// Tailwind classes
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>
```

### Mobile Utilities

```tsx
// Hide on mobile, show on desktop
<div className="desktop-only">Desktop content</div>

// Show on mobile, hide on desktop
<div className="mobile-only">Mobile content</div>

// Safe area padding
<div className="safe-padding">Content</div>
<div className="safe-padding-bottom">Bottom content</div>

// Full viewport height (with safe areas)
<div className="vh-full-safe">Full height</div>
```

---

## 🌓 Dark Mode

### Implementation

Dark mode uses the `.dark` class on the root element:

```tsx
// Toggle dark mode
<html className="dark">
```

### Theme-Aware Components

All components automatically adapt to dark mode using CSS variables.

```tsx
// No special props needed
<GlassCard>
  {/* Automatically adapts to dark mode */}
</GlassCard>
```

### Dark Mode Specific Styles

```css
.dark .custom-element {
  /* Dark mode specific styles */
}
```

---

## ♿ Accessibility

### Focus Management

All interactive elements have visible focus indicators:
```css
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Keyboard Navigation

- Tab navigation through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals/dropdowns
- Arrow keys for navigation lists

### Screen Readers

- Semantic HTML elements
- ARIA labels where needed
- `sr-only` class for screen-reader-only text

```tsx
<button>
  <Icon />
  <span className="sr-only">Button label</span>
</button>
```

### Touch Targets

Minimum touch target size: 44x44px (iOS guideline)

```css
@media (pointer: coarse) {
  button, a, input {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## 🛠️ Usage Examples

### Complete Page Example

```tsx
import { GlassCard, GlassButton, GlassInput, GlassNav } from "@/components/ui";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation */}
      <GlassNav position="top">
        <div className="flex items-center justify-between h-16">
          <h1>Dieter HQ</h1>
          <button>Menu</button>
        </div>
      </GlassNav>

      {/* Main content */}
      <main className="safe-padding pt-24 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search */}
          <GlassInput
            placeholder="Search..."
            icon={<SearchIcon />}
          />

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <GlassCard variant="medium" elevated interactive>
              <GlassCardHeader>
                <GlassCardTitle>Card 1</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p>Card content</p>
              </GlassCardContent>
            </GlassCard>
            {/* More cards... */}
          </div>
        </div>
      </main>

      {/* Bottom navigation */}
      <GlassNav position="bottom">
        <GlassNavGroup>
          <GlassNavItem active icon={<Home />} label="Home" />
          <GlassNavItem icon={<Search />} label="Search" />
          <GlassNavItem icon={<Settings />} label="Settings" />
        </GlassNavGroup>
      </GlassNav>
    </div>
  );
}
```

---

## 🔧 Customization

### Override Design Tokens

In your `tailwind.config.ts`:

```typescript
import { designTokens } from "./src/design-system/tokens";

export default {
  theme: {
    extend: {
      colors: {
        // Override or extend colors
        brand: {
          primary: '#your-color',
        },
      },
    },
  },
};
```

### Custom Glass Variants

In your CSS:

```css
.glass-custom {
  background: rgba(255, 100, 100, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 100, 100, 0.2);
}
```

---

## 📚 Resources

- **Design Tokens:** `/src/design-system/tokens.ts`
- **Global Styles:** `/src/app/globals.css`
- **Components:** `/src/components/ui/glass-*.tsx`
- **Examples:** `/src/components/examples/` (to be created)

## 🤝 Contributing

When adding new components:

1. Follow the existing naming convention (`glass-*.tsx`)
2. Use design tokens from `tokens.ts`
3. Ensure mobile-first responsive design
4. Include dark mode support
5. Add proper TypeScript types
6. Test on iOS Safari for glass effects

---

**Built with ❤️ for Dieter HQ**

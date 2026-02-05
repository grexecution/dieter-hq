# Dieter HQ Design System

> iOS-inspired, glassmorphism-first design system for professional AI dashboard interfaces.

## 🎨 Design Principles

### 1. **Depth Through Glass**
Frosted glass creates visual hierarchy without harsh separations. Lighter elements float above darker backgrounds.

### 2. **Motion With Purpose**
Every animation serves UX—fast for feedback (150ms), medium for transitions (300ms), slow for attention (400ms+).

### 3. **Touch-First, Mouse-Enhanced**
44px minimum touch targets. Hover states are enhancements, not requirements.

### 4. **Dark Mode Primary**
Design for dark mode first, then ensure light mode works. Dark mode is the default experience.

### 5. **Whitespace is UI**
Generous spacing creates breathing room. Never cram elements together.

---

## 📁 File Structure

```
src/
├── design-system/
│   ├── tokens.ts         # Design tokens (typography, spacing, colors, etc.)
│   ├── index.ts          # Barrel exports
│   └── utils/            # Design system utilities
├── components/ui/
│   ├── glass-*.tsx       # Glass component variants
│   ├── *.tsx             # Base shadcn/ui components
│   └── index.ts          # Component exports
├── app/
│   ├── globals.css       # CSS custom properties & base styles
│   └── design-system/    # Design system showcase page
```

---

## 🎨 Color System

### Semantic Colors (CSS Variables)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | White | Near black | Page background |
| `--foreground` | Dark slate | Light gray | Primary text |
| `--primary` | Blue 500 | Blue 400 | Actions, links |
| `--secondary` | Gray 100 | Gray 800 | Secondary elements |
| `--muted` | Gray 100 | Gray 800 | Disabled, subtle |
| `--destructive` | Red 500 | Red 400 | Errors, delete |
| `--success` | Green 500 | Green 400 | Confirmations |
| `--warning` | Orange 500 | Orange 400 | Warnings |

### Glass Variables

```css
--glass-bg: rgba(255, 255, 255, 0.7);        /* Light mode */
--glass-bg: rgba(20, 20, 30, 0.7);           /* Dark mode */
--glass-border: rgba(255, 255, 255, 0.3);    /* Light mode */
--glass-border: rgba(255, 255, 255, 0.1);    /* Dark mode */
```

---

## 🧱 Components

### Glass Components

| Component | Variants | Usage |
|-----------|----------|-------|
| `GlassCard` | subtle, medium, strong | Content containers |
| `GlassButton` | glass, glass-primary, glass-secondary | Interactive elements |
| `GlassInput` | glass, glass-medium, outline, filled | Form inputs |
| `GlassModal` | - | Dialogs, overlays |
| `GlassNav` | top, bottom | Navigation bars |

### Glass Card Usage

```tsx
<GlassCard variant="medium" elevated interactive>
  <GlassCardHeader>
    <GlassCardTitle>Title</GlassCardTitle>
    <GlassCardDescription>Description</GlassCardDescription>
  </GlassCardHeader>
  <GlassCardContent>Content</GlassCardContent>
  <GlassCardFooter>Actions</GlassCardFooter>
</GlassCard>
```

### Glass Button Variants

```tsx
// Glass variants (translucent)
<GlassButton variant="glass">Default Glass</GlassButton>
<GlassButton variant="glass-primary">Primary Glass</GlassButton>
<GlassButton variant="glass-destructive">Destructive Glass</GlassButton>

// Solid variants
<GlassButton variant="primary">Solid Primary</GlassButton>
<GlassButton variant="outline">Outline</GlassButton>
<GlassButton variant="ghost">Ghost</GlassButton>
```

---

## 📐 Spacing Scale

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `1` | 0.25rem (4px) | Tight padding |
| `2` | 0.5rem (8px) | Icon gaps |
| `3` | 0.75rem (12px) | Component padding |
| `4` | 1rem (16px) | Section gaps |
| `6` | 1.5rem (24px) | Card padding |
| `8` | 2rem (32px) | Section spacing |
| `12` | 3rem (48px) | Large sections |

---

## ✍️ Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", 
             "SF Pro Text", system-ui, sans-serif;
```

### Type Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 0.75rem | 400 | Labels, captions |
| `text-sm` | 0.875rem | 400 | Body small |
| `text-base` | 1rem | 400 | Body |
| `text-lg` | 1.125rem | 500 | Emphasis |
| `text-xl` | 1.25rem | 600 | Subheadings |
| `text-2xl` | 1.5rem | 600 | Headings |
| `text-3xl+` | 1.875rem+ | 700 | Page titles |

---

## 🎬 Animation

### Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Micro-interactions |
| `--duration-base` | 200ms | Standard transitions |
| `--duration-medium` | 300ms | Element appearances |
| `--duration-slow` | 400ms | Complex animations |

### Easing Functions

```css
--easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);   /* Default */
--easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Bouncy */
```

### Utility Classes

```tsx
// Transitions
<div className="transition-smooth">...</div>
<div className="transition-spring">...</div>

// Hover effects
<div className="hover-lift">...</div>   /* Lift on hover */
<div className="hover-press">...</div>  /* Press on click */

// Animations
<div className="animate-fade-in">...</div>
<div className="animate-fade-in-up">...</div>
<div className="animate-scale-in">...</div>
```

---

## 📱 Responsive Design

### Breakpoints

| Token | Value | Devices |
|-------|-------|---------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Safe Areas

```tsx
// Notch-safe padding
<div className="safe-padding">...</div>
<div className="safe-padding-bottom">...</div>

// Full viewport height (including mobile browser chrome)
<div className="vh-full-safe">...</div>
```

### Touch Targets

All interactive elements have minimum 44×44px touch targets on touch devices (`pointer: coarse`).

---

## 🎯 Patterns

### Chat Message Bubble

```tsx
<div className={cn(
  "rounded-2xl px-4 py-3 backdrop-blur-2xl",
  isUser 
    ? "bg-white/20 text-white ring-1 ring-white/20" 
    : "bg-white/55 text-zinc-900 ring-1 ring-white/40 dark:bg-zinc-950/35 dark:text-zinc-50"
)}>
  {content}
</div>
```

### Kanban Card

```tsx
<div className="glass rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
  {/* Priority indicator */}
  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-red-500" />
  {/* Content */}
</div>
```

### Form Input Group

```tsx
<div className="space-y-2">
  <Label className="text-xs text-muted-foreground">Label</Label>
  <GlassInput variant="glass" placeholder="Enter value..." />
  <p className="text-xs text-muted-foreground">Helper text</p>
</div>
```

---

## ✅ Do's and Don'ts

### ✅ Do

- Use glass variants for floating elements
- Maintain consistent spacing with the scale
- Provide hover states for interactive elements
- Test on both light and dark modes
- Use semantic color tokens, not raw values
- Animate with purpose

### ❌ Don't

- Mix glass and solid elements randomly
- Use shadows without backdrop blur
- Skip loading/disabled states
- Hard-code colors
- Over-animate (motion sickness)
- Forget mobile touch targets

---

## 🔗 References

- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)

---

*Last updated: February 2026*

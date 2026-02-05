# Design System Implementation Guide

## 📋 Overview

This guide helps you implement the Dieter HQ design system into your existing Next.js application or create new pages using the glass UI components.

---

## ✅ Prerequisites

- Next.js 14+ with App Router
- Tailwind CSS 3.4+
- TypeScript
- React 18+

---

## 🚀 Getting Started

### Step 1: Install Dependencies

The design system uses these key dependencies (likely already installed):

```bash
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-slot
npm install lucide-react
```

### Step 2: Setup Theme Provider

Wrap your app with the `ThemeProvider` in your root layout:

```tsx
// src/app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="dieter-hq-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 3: Import Components

Use the centralized export:

```tsx
import { 
  GlassCard, 
  GlassButton, 
  GlassInput 
} from "@/components/ui";

import { 
  useTheme, 
  useBreakpoint,
  useDeviceType 
} from "@/design-system";
```

---

## 📱 Creating a New Page

### Example: Dashboard Page

```tsx
// src/app/dashboard/page.tsx
"use client";

import { 
  GlassCard, 
  GlassCardHeader, 
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassNav,
  GlassNavGroup,
  GlassNavItem,
} from "@/components/ui";
import { Home, Activity, Settings } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <GlassNav position="top">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <GlassButton variant="glass" size="icon">
            ⚙️
          </GlassButton>
        </div>
      </GlassNav>

      {/* Main Content */}
      <main className="safe-padding pt-24 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search */}
          <GlassInput
            placeholder="Search..."
            variant="glass"
            inputSize="lg"
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard variant="medium" elevated>
              <GlassCardHeader>
                <GlassCardTitle>Total Users</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-3xl font-bold">1,234</p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard variant="medium" elevated>
              <GlassCardHeader>
                <GlassCardTitle>Active Now</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-3xl font-bold">89</p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard variant="medium" elevated>
              <GlassCardHeader>
                <GlassCardTitle>Revenue</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-3xl font-bold">$12,345</p>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <GlassNav position="bottom">
        <GlassNavGroup>
          <GlassNavItem active icon={<Home />} label="Home" href="/" />
          <GlassNavItem icon={<Activity />} label="Activity" href="/activity" />
          <GlassNavItem icon={<Settings />} label="Settings" href="/settings" />
        </GlassNavGroup>
      </GlassNav>
    </div>
  );
}
```

---

## 🔄 Migrating Existing Components

### Migration Checklist

- [ ] Replace `<div>` cards with `<GlassCard>`
- [ ] Replace `<button>` with `<GlassButton>`
- [ ] Replace `<input>` with `<GlassInput>`
- [ ] Add `safe-padding` to mobile layouts
- [ ] Replace custom modals with `<GlassModal>`
- [ ] Update navigation bars to use `<GlassNav>`
- [ ] Test on iOS Safari for glass effects
- [ ] Test dark mode toggle
- [ ] Verify accessibility (keyboard nav, screen readers)
- [ ] Test responsive breakpoints

### Before & After Examples

#### Button Migration

**Before:**
```tsx
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>
```

**After:**
```tsx
<GlassButton variant="primary" size="base">
  Click me
</GlassButton>
```

#### Card Migration

**Before:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
  <h3 className="text-xl font-bold">Title</h3>
  <p>Content</p>
</div>
```

**After:**
```tsx
<GlassCard variant="medium" elevated padding="lg">
  <GlassCardHeader>
    <GlassCardTitle>Title</GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    <p>Content</p>
  </GlassCardContent>
</GlassCard>
```

#### Input Migration

**Before:**
```tsx
<input
  type="text"
  className="border rounded px-3 py-2"
  placeholder="Search..."
/>
```

**After:**
```tsx
<GlassInput
  variant="glass"
  placeholder="Search..."
  icon={<SearchIcon />}
  iconPosition="left"
/>
```

---

## 🎨 Theming & Customization

### Custom Colors

Extend colors in `tailwind.config.ts`:

```ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#your-color',
          secondary: '#your-color',
        },
      },
    },
  },
};
```

Then use in CSS variables (`globals.css`):

```css
:root {
  --primary: 211 100% 50%;  /* Your custom primary */
}
```

### Custom Glass Variants

Create custom glass effects in your CSS:

```css
.glass-brand {
  background: rgba(100, 100, 255, 0.6);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(100, 100, 255, 0.2);
}
```

### Override Component Styles

Use `className` prop to extend or override:

```tsx
<GlassCard 
  variant="medium" 
  className="border-2 border-primary"
>
  Custom styled card
</GlassCard>
```

---

## 📱 Mobile Optimization

### Safe Areas (Notched Devices)

Always use safe area utilities on mobile:

```tsx
<main className="safe-padding pt-24 pb-24">
  {/* Content automatically respects notch areas */}
</main>
```

### Touch Targets

All interactive elements have minimum 44x44px touch targets on mobile automatically.

### Prevent iOS Zoom

Input font sizes are automatically set to 16px on mobile to prevent zoom.

### iOS-Specific Optimizations

```tsx
import { isIOS, useKeyboardOpen } from "@/design-system";

function MyComponent() {
  const isKeyboardOpen = useKeyboardOpen();
  
  return (
    <div className={isKeyboardOpen ? "pb-0" : "pb-safe"}>
      {/* Adjust layout when keyboard is open */}
    </div>
  );
}
```

---

## ♿ Accessibility Best Practices

### Always Provide Labels

```tsx
// ❌ Bad
<GlassButton variant="glass" size="icon">
  <HeartIcon />
</GlassButton>

// ✅ Good
<GlassButton variant="glass" size="icon" aria-label="Like">
  <HeartIcon />
  <span className="sr-only">Like</span>
</GlassButton>
```

### Use Semantic HTML

```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<GlassButton onClick={handleClick}>Click me</GlassButton>
```

### Focus Management in Modals

```tsx
import { useFocusTrap } from "@/design-system";

function MyModal() {
  const modalRef = useRef(null);
  useFocusTrap(isOpen, modalRef);
  
  return <div ref={modalRef}>{/* Modal content */}</div>;
}
```

### Announce Dynamic Content

```tsx
import { useAnnounce } from "@/design-system";

function MyComponent() {
  const announce = useAnnounce();
  
  const handleSuccess = () => {
    announce("Item added to cart", "polite");
  };
}
```

---

## 🎬 Animation Guidelines

### Use Appropriate Transitions

```tsx
// For standard interactions
<div className="transition-smooth">Content</div>

// For delightful interactions
<GlassButton className="transition-spring">
  Special Action
</GlassButton>
```

### Respect Reduced Motion

```tsx
import { usePrefersReducedMotion } from "@/design-system";

function AnimatedComponent() {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return (
    <div className={prefersReducedMotion ? "" : "animate-fade-in"}>
      Content
    </div>
  );
}
```

---

## 🧪 Testing

### Visual Testing

Test on these browsers:
- [ ] Safari (iOS) - Primary target for glass effects
- [ ] Chrome (Desktop & Mobile)
- [ ] Firefox
- [ ] Edge

### Responsive Testing

Test at these breakpoints:
- [ ] 375px (iPhone SE)
- [ ] 390px (iPhone 12/13/14)
- [ ] 768px (iPad portrait)
- [ ] 1024px (iPad landscape)
- [ ] 1440px (Desktop)

### Accessibility Testing

- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader (VoiceOver on iOS/Mac, NVDA on Windows)
- [ ] Color contrast (use browser dev tools)
- [ ] Focus indicators visible
- [ ] Touch targets adequate size

---

## 🐛 Common Issues & Solutions

### Glass Effect Not Showing

**Problem:** Frosted glass effect not visible.

**Solution:**
1. Ensure parent has background content (glass needs something to blur)
2. Check browser support (Safari best, Chrome/Firefox may have limitations)
3. Verify `backdrop-filter` is not disabled by browser settings

### Performance Issues

**Problem:** Laggy animations or scrolling.

**Solution:**
1. Reduce number of glass elements on page
2. Use `glass-subtle` instead of `glass-strong`
3. Avoid nesting multiple glass elements
4. Use `will-change: transform` sparingly

### Dark Mode Not Working

**Problem:** Components not adapting to dark mode.

**Solution:**
1. Ensure `ThemeProvider` wraps your app
2. Check `<html>` has `.dark` class when dark mode active
3. Verify CSS variables are defined in both `:root` and `.dark`

### Mobile Layout Issues

**Problem:** Content cut off by notch or overlapping navigation.

**Solution:**
1. Use `safe-padding` utility
2. Add `pt-24` to account for top nav
3. Add `pb-24` to account for bottom nav
4. Use `vh-full-safe` for full-height sections

---

## 📚 Additional Resources

- **Design System Docs:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Quick Reference:** [DESIGN_SYSTEM_QUICK_REF.md](./DESIGN_SYSTEM_QUICK_REF.md)
- **Component Examples:** `/src/components/examples/design-system-showcase.tsx`
- **Design Tokens:** `/src/design-system/tokens.ts`

---

## 🤝 Contributing

When adding new components to the design system:

1. **Follow naming conventions:** `glass-*.tsx` for glass components
2. **Use CVA for variants:** Consistent variant API
3. **Include TypeScript types:** Full type safety
4. **Support all themes:** Test in light and dark mode
5. **Mobile-first:** Design for mobile, enhance for desktop
6. **Document props:** JSDoc comments for all props
7. **Add to exports:** Update `/src/components/ui/index.ts`
8. **Update docs:** Add to `DESIGN_SYSTEM.md`

---

## 🎯 Next Steps

1. Review the [showcase page](./src/components/examples/design-system-showcase.tsx)
2. Start with a simple page using 2-3 components
3. Gradually migrate existing components
4. Customize theme to match your brand
5. Share feedback and improvements!

---

**Need help? Check the docs or create an issue!**

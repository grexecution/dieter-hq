# Design System Quick Reference

## 🚀 Quick Start

```bash
# Import components
import { GlassCard, GlassButton, GlassInput } from "@/components/ui";
import { useTheme } from "@/components/theme-provider";
import { useBreakpoint, useDeviceType } from "@/design-system/utils/responsive";
```

---

## 🎨 Glass Components

### GlassCard
```tsx
<GlassCard variant="medium" elevated interactive padding="lg">
  <GlassCardHeader>
    <GlassCardTitle>Title</GlassCardTitle>
    <GlassCardDescription>Description</GlassCardDescription>
  </GlassCardHeader>
  <GlassCardContent>Content</GlassCardContent>
  <GlassCardFooter>Footer</GlassCardFooter>
</GlassCard>
```

### GlassButton
```tsx
<GlassButton variant="glass-primary" size="lg" loading={false}>
  Click me
</GlassButton>
```

### GlassInput
```tsx
<GlassInput
  variant="glass"
  icon={<SearchIcon />}
  iconPosition="left"
  error={false}
  helperText="Helper text"
/>
```

### GlassNav
```tsx
<GlassNav position="bottom" blur safeArea>
  <GlassNavGroup>
    <GlassNavItem active icon={<Home />} label="Home" />
  </GlassNavGroup>
</GlassNav>
```

### GlassModal
```tsx
<GlassModal>
  <GlassModalTrigger>Open</GlassModalTrigger>
  <GlassModalContent>
    <GlassModalHeader>
      <GlassModalTitle>Title</GlassModalTitle>
    </GlassModalHeader>
    Content
  </GlassModalContent>
</GlassModal>
```

---

## 🎯 Utility Classes

### Glass Effects
```css
.glass              /* Subtle glass */
.glass-medium       /* Medium glass */
.glass-strong       /* Strong glass */
.glass-elevated     /* Glass + shadow */
```

### Animations
```css
.animate-fade-in
.animate-fade-in-up
.animate-slide-in-right
.animate-scale-in
.animate-pulse
```

### Transitions
```css
.transition-smooth  /* iOS standard easing */
.transition-spring  /* Spring-like easing */
.hover-lift        /* Lift on hover */
.hover-press       /* Press effect */
```

### Responsive
```css
.desktop-only      /* Hide on mobile */
.mobile-only       /* Hide on desktop */
.safe-padding      /* Safe area padding */
.vh-full-safe      /* Full height with safe areas */
```

---

## 📐 Design Tokens

### Colors
```tsx
bg-background         bg-background-secondary
text-foreground       text-foreground-secondary
bg-primary           text-primary-foreground
bg-success           bg-destructive
border-border        ring-ring
```

### Spacing
```tsx
p-1  p-2  p-3  p-4  p-6  p-8  p-12  p-16
m-1  m-2  m-3  m-4  m-6  m-8  m-12  m-16
gap-1  gap-2  gap-4  gap-6  gap-8
```

### Border Radius
```tsx
rounded-sm  rounded-base  rounded-lg
rounded-xl  rounded-2xl   rounded-full
```

### Shadows
```tsx
shadow-sm  shadow-base  shadow-md
shadow-lg  shadow-xl    shadow-glass
```

---

## 🌓 Theme

### Provider Setup
```tsx
import { ThemeProvider } from "@/components/theme-provider";

<ThemeProvider defaultTheme="system">
  <App />
</ThemeProvider>
```

### Use Theme
```tsx
const { theme, setTheme } = useTheme();

<button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
  Toggle
</button>
```

---

## 📱 Responsive Hooks

```tsx
const breakpoint = useBreakpoint();  // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
const deviceType = useDeviceType();  // 'mobile' | 'tablet' | 'desktop'
const isMobile = useMediaQuery("(max-width: 768px)");
const { width, height } = useViewportSize();
const prefersReducedMotion = usePrefersReducedMotion();
```

### Responsive Values
```tsx
const padding = useResponsiveValue({
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
});
```

---

## ♿ Accessibility

### Focus Trap
```tsx
const ref = useRef(null);
useFocusTrap(isOpen, ref);
```

### Announcements
```tsx
const announce = useAnnounce();
announce("Item added to cart", "polite");
```

### Screen Reader Only
```tsx
<span className="sr-only">Hidden text</span>
```

### ARIA Attributes
```tsx
const attrs = getAriaAttributes({
  label: "Close dialog",
  expanded: isOpen,
  pressed: isActive,
});

<button {...attrs}>Button</button>
```

---

## 🎬 Animation Tokens

```css
--duration-fast: 150ms
--duration-base: 200ms
--duration-medium: 300ms
--duration-slow: 400ms

--easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1)
--easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

---

## 📏 Breakpoints

```tsx
sm: '640px'    // Mobile landscape
md: '768px'    // Tablet
lg: '1024px'   // Desktop
xl: '1280px'   // Large desktop
2xl: '1536px'  // Extra large
```

---

## 🎨 Component Variants Cheat Sheet

### GlassCard
- **variant:** subtle | medium | strong
- **elevated:** true | false
- **interactive:** true | false
- **padding:** none | sm | base | lg | xl

### GlassButton
- **variant:** glass | glass-primary | glass-secondary | glass-destructive | primary | secondary | destructive | outline | ghost | link
- **size:** sm | base | lg | xl | icon | icon-sm | icon-lg
- **loading:** true | false

### GlassInput
- **variant:** glass | glass-medium | outline | filled
- **inputSize:** sm | base | lg
- **error:** true | false
- **icon:** ReactNode
- **iconPosition:** left | right

### GlassNav
- **position:** top | bottom | static
- **blur:** true | false
- **safeArea:** true | false

---

## 💡 Pro Tips

1. **Always use `glass-medium` for cards** - Best balance of blur and readability
2. **Use `safe-padding` on mobile** - Respects notch areas
3. **Prefer `hover-press` over `hover-lift`** - More iOS-like
4. **Use `transition-spring` for important actions** - Adds delight
5. **Always provide `helperText` for inputs** - Better UX
6. **Use `loading` prop on buttons** - Better feedback
7. **Add `sr-only` labels to icon buttons** - Accessibility
8. **Use `useDeviceType` for conditional rendering** - Better than CSS media queries for complex logic
9. **Always test on actual iOS devices** - Frosted glass behaves differently

---

## 🔧 Common Patterns

### Form with Glass
```tsx
<GlassCard variant="medium" padding="lg">
  <form className="space-y-4">
    <GlassInput
      placeholder="Email"
      icon={<Mail />}
      helperText="We'll never share your email"
    />
    <GlassInput
      type="password"
      placeholder="Password"
      icon={<Lock />}
    />
    <GlassButton variant="primary" size="lg" className="w-full">
      Sign In
    </GlassButton>
  </form>
</GlassCard>
```

### Bottom Tab Bar (iOS-style)
```tsx
<GlassNav position="bottom">
  <GlassNavGroup>
    <GlassNavItem active icon={<Home />} label="Home" href="/" />
    <GlassNavItem icon={<Search />} label="Search" href="/search" />
    <GlassNavItem icon={<User />} label="Profile" href="/profile" />
  </GlassNavGroup>
</GlassNav>
```

### Confirmation Modal
```tsx
<GlassModal>
  <GlassModalTrigger asChild>
    <GlassButton variant="glass-destructive">Delete</GlassButton>
  </GlassModalTrigger>
  <GlassModalContent>
    <GlassModalHeader>
      <GlassModalTitle>Are you sure?</GlassModalTitle>
      <GlassModalDescription>
        This action cannot be undone.
      </GlassModalDescription>
    </GlassModalHeader>
    <GlassModalFooter>
      <GlassButton variant="glass">Cancel</GlassButton>
      <GlassButton variant="destructive">Delete</GlassButton>
    </GlassModalFooter>
  </GlassModalContent>
</GlassModal>
```

---

**For full documentation, see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**

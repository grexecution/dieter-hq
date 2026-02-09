# Responsive Strategy

## Prinzip: Desktop-First, dann runterdröseln

```
Desktop (1440px+)  →  Figma 1:1 (Pixel-Perfect)
         ↓
Tablet (768-1024px) →  Eigene Initiative
         ↓
Mobile (< 768px)    →  Eigene Initiative, Touch-First
```

## Breakpoints

```ts
// tailwind.config.ts (Default Breakpoints)
screens: {
  'sm': '640px',    // Large phones
  'md': '768px',    // Tablets
  'lg': '1024px',   // Small laptops
  'xl': '1280px',   // Laptops
  '2xl': '1536px',  // Large screens
}
```

### Empfohlene Strategie

```tsx
// Mobile-First in Tailwind, aber Desktop-Design zuerst bauen

// Desktop (Base für diese Komponente)
<div className="lg:grid lg:grid-cols-2 lg:gap-16">
  
  {/* Tablet: Stack oder 2 Spalten? */}
  <div className="md:grid md:grid-cols-2 md:gap-8">
    
    {/* Mobile: Stack */}
    <div className="flex flex-col gap-4">
```

## Was von Figma übernehmen

✅ **Immer übernehmen:**
- Farben
- Fonts & Typography
- Content (Texte, Bilder)
- Component-Struktur
- Desktop Layout

## Was selbst entscheiden

🧠 **Eigene Initiative:**

### Navigation
```tsx
// Desktop: Horizontal Nav
<nav className="hidden lg:flex gap-8">

// Mobile: Hamburger Menu
<MobileMenu className="lg:hidden" />
```

### Grid → Stack
```tsx
// Desktop: 3 Spalten
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Touch Targets
```tsx
// Minimum 44x44px für Touch
<button className="min-h-[44px] min-w-[44px] p-3">
```

### Font Scaling
```tsx
// Responsive Font Sizes
<h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
```

### Padding Scaling
```tsx
// Section Padding
<section className="py-12 md:py-16 lg:py-24">
```

---

## Responsive Patterns

### Hero Section
```tsx
// Desktop: Split layout
// Tablet: Stack, smaller image
// Mobile: Stack, text first

<section className="
  flex flex-col gap-8
  lg:flex-row lg:items-center lg:gap-16
">
  <div className="lg:w-1/2">
    <h1 className="text-3xl md:text-4xl lg:text-5xl">...</h1>
  </div>
  <div className="lg:w-1/2">
    <Image ... />
  </div>
</section>
```

### Features Grid
```tsx
// Desktop: 3-4 columns
// Tablet: 2 columns
// Mobile: 1 column

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
```

### Cards
```tsx
// Horizontal → Vertical on mobile
<div className="
  flex flex-col gap-4
  md:flex-row md:items-center md:gap-8
">
```

### Navigation
```tsx
// Desktop: Horizontal links
// Mobile: Hamburger + Drawer

<header>
  {/* Desktop Nav */}
  <nav className="hidden lg:flex items-center gap-8">
    <Link href="/">Home</Link>
    <Link href="/about">About</Link>
  </nav>
  
  {/* Mobile Menu Button */}
  <button className="lg:hidden">
    <MenuIcon />
  </button>
</header>
```

---

## Mobile-Specific Considerations

### Touch Targets
- Minimum 44x44px
- Genug Abstand zwischen Elementen
- Kein Hover-only Content

### Text Readability
- Min 16px für Body Text
- Ausreichend Kontrast
- Nicht zu lange Zeilen (max ~70 chars)

### Performance
- Lazy load below-the-fold images
- Smaller image sizes für Mobile
- Weniger Animationen

### Forms
- Full-width inputs
- Große Touch-Bereiche
- Native Keyboard Types

```tsx
<input 
  type="email" 
  inputMode="email"
  className="w-full p-4 text-base"
/>
```

---

## Testing

### Viewport Testing
1. Chrome DevTools → Responsive Mode
2. Test: 375px (iPhone), 768px (iPad), 1024px (Laptop), 1440px (Desktop)

### Real Device Testing
- iPhone Safari
- Android Chrome
- iPad Safari

### Checkliste
```markdown
- [ ] Desktop 1440px: Pixel-Perfect (Figma Match)
- [ ] Laptop 1024px: Layout funktioniert
- [ ] Tablet 768px: Grid stacked/angepasst
- [ ] Mobile 375px: Single column, Touch-friendly
- [ ] Navigation: Desktop links, Mobile hamburger
- [ ] Fonts: Lesbar auf allen Größen
- [ ] Touch targets: Min 44px
```

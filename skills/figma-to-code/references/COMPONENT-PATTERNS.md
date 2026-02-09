# Component Patterns

## Pattern Recognition

### Hero Section
**Erkennungsmerkmale:**
- Große Headline (H1)
- Subheadline/Description
- 1-2 CTA Buttons
- Optional: Bild, Video, Animation

```tsx
interface HeroProps {
  headline: string
  subheadline?: string
  primaryCta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  image?: { src: string; alt: string }
  variant?: 'centered' | 'split' | 'fullwidth'
}
```

**Variants:**
- `centered` — Text zentriert, Bild darunter
- `split` — Text links, Bild rechts (oder umgekehrt)
- `fullwidth` — Bild als Background

---

### Features Section
**Erkennungsmerkmale:**
- Grid/Liste mit Items
- Icon + Headline + Text pro Item
- Oft 3, 4 oder 6 Items

```tsx
interface FeaturesProps {
  headline?: string
  subheadline?: string
  features: Array<{
    icon: React.ReactNode
    title: string
    description: string
  }>
  columns?: 2 | 3 | 4
  variant?: 'cards' | 'simple' | 'icons-left'
}
```

**Variants:**
- `cards` — Jedes Feature in einer Card
- `simple` — Ohne Cards, nur Layout
- `icons-left` — Icon links, Text rechts

---

### Testimonials Section
**Erkennungsmerkmale:**
- Zitat-Text
- Avatar/Bild
- Name + Rolle/Firma
- Optional: Rating Stars

```tsx
interface TestimonialsProps {
  headline?: string
  testimonials: Array<{
    quote: string
    author: {
      name: string
      role?: string
      company?: string
      avatar?: string
    }
    rating?: number
  }>
  variant?: 'carousel' | 'grid' | 'single'
}
```

**Variants:**
- `carousel` — Slider mit Arrows/Dots
- `grid` — Alle sichtbar im Grid
- `single` — Ein großes Testimonial

---

### CTA Section
**Erkennungsmerkmale:**
- Kurze, kraftvolle Headline
- 1-2 Buttons
- Oft farbiger/dunkler Hintergrund

```tsx
interface CtaProps {
  headline: string
  description?: string
  primaryCta: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  variant?: 'simple' | 'card' | 'fullwidth'
  background?: 'primary' | 'dark' | 'gradient'
}
```

---

### FAQ Section
**Erkennungsmerkmale:**
- Frage + Antwort Paare
- Meist Accordion-Style
- Manchmal 2-spaltig

```tsx
interface FaqProps {
  headline?: string
  faqs: Array<{
    question: string
    answer: string
  }>
  variant?: 'accordion' | 'two-column' | 'simple'
}
```

---

### Pricing Section
**Erkennungsmerkmale:**
- 2-4 Pricing Cards
- Preis prominent
- Feature-Liste
- CTA pro Card
- Oft "Popular" Badge

```tsx
interface PricingProps {
  headline?: string
  plans: Array<{
    name: string
    price: string | number
    period?: 'month' | 'year'
    description?: string
    features: string[]
    cta: { label: string; href: string }
    featured?: boolean
  }>
}
```

---

### Stats Section
**Erkennungsmerkmale:**
- Große Zahlen
- Kleine Labels
- 3-4 Stats nebeneinander

```tsx
interface StatsProps {
  stats: Array<{
    value: string | number
    label: string
    prefix?: string
    suffix?: string
  }>
  variant?: 'simple' | 'cards' | 'centered'
}
```

---

### Logos Section
**Erkennungsmerkmale:**
- Logo-Reihe
- "Trusted by" / "As seen in"
- Meist grayscale

```tsx
interface LogosProps {
  headline?: string
  logos: Array<{
    src: string
    alt: string
    href?: string
  }>
  grayscale?: boolean
}
```

---

### Team Section
**Erkennungsmerkmale:**
- Fotos
- Namen + Rollen
- Optional: Social Links

```tsx
interface TeamProps {
  headline?: string
  members: Array<{
    name: string
    role: string
    image: string
    bio?: string
    social?: {
      linkedin?: string
      twitter?: string
    }
  }>
}
```

---

### Contact Section
**Erkennungsmerkmale:**
- Kontaktformular
- Kontaktdaten (Email, Phone, Address)
- Oft mit Map

```tsx
interface ContactProps {
  headline?: string
  form?: boolean
  details?: {
    email?: string
    phone?: string
    address?: string
  }
  showMap?: boolean
}
```

---

## Component Variants vs New Components

### Regel: Gleiche Struktur = Variant

```tsx
// Diese sind ALLE Variants von <HeroSection />:
// - Hero mit blauem Background
// - Hero mit Bild rechts
// - Hero mit Video
// - Hero zentriert

<HeroSection 
  variant="split"
  background="primary"
  mediaType="image"
/>
```

### Regel: Andere Struktur = Neuer Component

```tsx
// Diese sind VERSCHIEDENE Components:
// - Hero (große Headline, CTA)
// - PageHeader (kleine Headline, Breadcrumbs)
// - Banner (schmaler Streifen, Announcement)
```

---

## Shared Components

Diese werden überall wiederverwendet:

```
components/ui/
├── button.tsx         # Alle Button Variants
├── heading.tsx        # H1-H6 mit Styles
├── text.tsx           # Paragraph Styles
├── container.tsx      # Max-Width Container
├── section.tsx        # Section Wrapper mit Padding
├── card.tsx           # Card Container
├── badge.tsx          # Labels, Tags
├── input.tsx          # Form Inputs
└── icon.tsx           # Icon Wrapper
```

### Button Variants

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

// Verwendung:
<Button variant="primary" size="lg">Get Started</Button>
<Button variant="outline">Learn More</Button>
```

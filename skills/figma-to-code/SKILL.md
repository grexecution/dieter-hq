---
name: figma-to-code
description: |
  Pixel-Perfect Figma-to-Code Workflow für Next.js 15+ Projekte.
  Kombiniert Figma MCP Daten mit Screenshot-Abgleich für 1:1 Umsetzung.
  
  Trigger: Figma umsetzen, Design implementieren, Website aus Figma bauen,
  Figma to Code, Design to Code, Pixel-Perfect, Figma MCP.
  
  Features: MCP+Screenshot Hybrid, Component Recognition, Fixed Next.js Setup,
  SEO & Speed built-in, Headless CMS ready, skaliert für 50-100 Seiten.
metadata:
  openclaw:
    emoji: "🎨"
    requires:
      bins: [node, npx]
---

# Figma-to-Code Skill 🎨

**Pixel-Perfect Websites aus Figma Designs — in Minuten, nicht Stunden.**

## Kernprinzip: MCP + Screenshot Hybrid

1. **MCP** liefert Struktur, Farben, Fonts, Spacing
2. **Screenshots** sind die visuelle Ground Truth
3. **Desktop 1:1** matchen, dann Tablet/Mobile mit Initiative

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIGMA-TO-CODE WORKFLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: Setup                                                 │
│  ─────────────────                                              │
│  • Next.js Boilerplate klonen                                   │
│  • Design Tokens aus Figma MCP extrahieren                      │
│  • tailwind.config.ts anpassen                                  │
│                                                                 │
│  PHASE 2: Component Mapping                                     │
│  ──────────────────────────                                     │
│  • Figma Frames analysieren                                     │
│  • Bekannte Patterns erkennen (Hero, CTA, Testimonials...)      │
│  • Component Library planen                                     │
│                                                                 │
│  PHASE 3: Section-by-Section Build                              │
│  ─────────────────────────────────                              │
│  • Pro Sektion:                                                 │
│    1. MCP Daten holen                                           │
│    2. Component bauen                                           │
│    3. Screenshot vergleichen                                    │
│    4. Pixel-Perfect adjustieren                                 │
│                                                                 │
│  PHASE 4: Responsive                                            │
│  ───────────────────                                            │
│  • Desktop ist fertig (1:1 aus Figma)                           │
│  • Tablet: eigene Initiative, Design-Intent behalten            │
│  • Mobile: eigene Initiative, Touch-optimiert                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Project Setup

### 1.1 Boilerplate initialisieren

```bash
# Option A: Unser Starter Template
npx create-next-app@latest PROJECT_NAME --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Dann Basis-Struktur anlegen
```

### 1.2 Projekt-Struktur (Fixed Setup)

```
src/
├── app/
│   ├── (marketing)/              # Öffentliche Seiten
│   │   ├── page.tsx              # Homepage
│   │   ├── about/page.tsx
│   │   └── [slug]/page.tsx       # Dynamic pages
│   ├── (legal)/                  # Legal Pages
│   │   ├── impressum/page.tsx
│   │   ├── datenschutz/page.tsx
│   │   └── agb/page.tsx
│   ├── api/                      # API Routes
│   ├── layout.tsx                # Root Layout
│   ├── globals.css
│   ├── fonts.ts                  # next/font Setup
│   ├── sitemap.ts                # Dynamic Sitemap
│   └── robots.ts                 # robots.txt
├── components/
│   ├── ui/                       # Atomic Components
│   │   ├── button.tsx
│   │   ├── heading.tsx
│   │   ├── text.tsx
│   │   └── container.tsx
│   ├── sections/                 # Page Sections
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── testimonials.tsx
│   │   ├── cta.tsx
│   │   └── faq.tsx
│   ├── layout/                   # Layout Components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── navigation.tsx
│   │   └── mobile-menu.tsx
│   └── shared/                   # Shared Components
│       ├── logo.tsx
│       ├── social-links.tsx
│       └── cookie-banner.tsx
├── lib/
│   ├── utils.ts                  # cn() helper
│   ├── fonts.ts                  # Font definitions
│   └── metadata.ts               # SEO helpers
├── styles/
│   └── design-tokens.css         # CSS Custom Properties
├── content/                      # CMS Content (optional)
│   └── pages/
└── types/
    └── index.ts
```

### 1.3 Design Tokens aus Figma MCP

Figma MCP liefert:
- Colors (Primary, Secondary, Neutral, Semantic)
- Typography (Font families, sizes, weights, line-heights)
- Spacing (padding, margins, gaps)
- Border radius, shadows, etc.

→ Extrahieren und in `tailwind.config.ts` + `design-tokens.css` übertragen.

Referenz: [references/DESIGN-TOKENS.md](references/DESIGN-TOKENS.md)

---

## Phase 2: Component Recognition

### 2.1 Bekannte Section-Patterns

Der Skill erkennt diese Standard-Patterns automatisch:

| Pattern | Erkennungsmerkmale | Component |
|---------|-------------------|-----------|
| **Hero** | Große Headline, CTA Button, oft Bild/Video | `<HeroSection />` |
| **Features** | Grid/Liste mit Icons + Text | `<FeaturesSection />` |
| **Testimonials** | Zitate, Avatare, Namen | `<TestimonialsSection />` |
| **CTA** | Headline + Button, oft farbiger BG | `<CtaSection />` |
| **FAQ** | Fragen + Antworten, Accordion | `<FaqSection />` |
| **Pricing** | Karten mit Preisen, Feature-Listen | `<PricingSection />` |
| **Team** | Fotos + Namen + Rollen | `<TeamSection />` |
| **Stats** | Große Zahlen + Labels | `<StatsSection />` |
| **Logos** | Logo-Reihe, "Trusted by" | `<LogosSection />` |
| **Contact** | Formular, Kontaktdaten | `<ContactSection />` |

### 2.2 Component Variants

Gleicher Component-Typ, andere Farben/Styles → **Variants, nicht neue Components!**

```tsx
// ❌ FALSCH: Separate Components
<HeroBlue />
<HeroGreen />

// ✅ RICHTIG: Variants
<HeroSection variant="primary" />   // Blaue Version
<HeroSection variant="secondary" /> // Grüne Version
```

### 2.3 Mapping-Strategie

1. Alle Figma Frames durchgehen
2. Für jeden Frame: Pattern erkennen oder "Custom" markieren
3. Component Library planen bevor Code geschrieben wird
4. Wiederverwendbare Components identifizieren

Referenz: [references/COMPONENT-PATTERNS.md](references/COMPONENT-PATTERNS.md)

---

## Phase 3: Section-by-Section Build

### 3.1 Workflow pro Section

```
┌─────────────────────────────────────────────────────────────┐
│ SECTION BUILD LOOP                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. MCP: Figma-Daten für Section holen                      │
│     → Layout, Farben, Fonts, Spacing, Text                  │
│                                                             │
│  2. CODE: Component bauen                                   │
│     → Tailwind classes, responsive defaults                 │
│                                                             │
│  3. SCREENSHOT: Figma Screenshot dieser Section             │
│     → Desktop-Viewport (1440px oder 1920px)                 │
│                                                             │
│  4. COMPARE: Side-by-side Vergleich                         │
│     → Browser DevTools vs Screenshot                        │
│     → Pixel-Differenzen identifizieren                      │
│                                                             │
│  5. ADJUST: Feintuning                                      │
│     → Spacing, Font-Sizes, Line-Heights                     │
│     → Bis 1:1 Match auf Desktop                             │
│                                                             │
│  6. COMMIT: Section fertig                                  │
│     → Git commit, nächste Section                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Screenshot-Abgleich Workflow

1. **Figma Screenshot machen** (Section isoliert, Desktop Viewport)
2. **Browser öffnen** (localhost:3000, DevTools auf 1440px)
3. **Overlay-Vergleich** (Screenshot als Overlay, Opacity 50%)
4. **Differenzen fixen** bis Match

Tools:
- Browser DevTools
- Figma Screenshot Export
- Optional: PerfectPixel Browser Extension

Referenz: [references/SCREENSHOT-WORKFLOW.md](references/SCREENSHOT-WORKFLOW.md)

---

## Phase 4: Responsive Design

### 4.1 Desktop-First, dann runterdröseln

```
Desktop (1440px+) → Figma 1:1
         ↓
Tablet (768-1024px) → Eigene Initiative
         ↓
Mobile (< 768px) → Eigene Initiative, Touch-optimiert
```

### 4.2 Responsive-Regeln

**Von Figma übernehmen:**
- Farben, Fonts, Grundlayout
- Content, Texte, Bilder
- Component-Struktur

**Selbst entscheiden:**
- Breakpoint-Verhalten
- Mobile Navigation (Hamburger, Drawer)
- Touch-Targets (min 44px)
- Stack-Reihenfolge
- Font-Size Scaling

### 4.3 Tailwind Breakpoints

```tsx
// Standard Breakpoints
<div className="
  px-4          // Mobile default
  md:px-8       // Tablet (768px+)
  lg:px-16      // Desktop (1024px+)
  xl:px-24      // Large Desktop (1280px+)
">
```

Referenz: [references/RESPONSIVE-STRATEGY.md](references/RESPONSIVE-STRATEGY.md)

---

## Built-in: Speed & SEO

### Speed Optimization

```tsx
// Image Optimization
import Image from 'next/image'
<Image src="/hero.jpg" width={1200} height={600} priority />

// Font Loading
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap' })

// Lazy Loading
import dynamic from 'next/dynamic'
const HeavyComponent = dynamic(() => import('./heavy'), { ssr: false })
```

### SEO Built-in

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: { default: 'Site Title', template: '%s | Site Title' },
  description: 'Site description',
  openGraph: { images: '/og-image.jpg' },
}

// app/sitemap.ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://example.com', lastModified: new Date() },
    // ... dynamic pages
  ]
}
```

Referenz: [references/SEO-SPEED.md](references/SEO-SPEED.md)

---

## Headless CMS Ready

### Vorbereitet für:

1. **Sanity** (Empfohlen)
   - Studio in `/studio`
   - GROQ queries in `/lib/sanity`

2. **Strapi** (Self-hosted)
   - API calls in `/lib/strapi`

3. **Payload CMS** (Next.js native)
   - Direkte Integration

4. **Markdown/MDX** (Einfachste Lösung)
   - Content in `/content`
   - MDX components

Struktur für CMS-Ready:

```
src/
├── lib/
│   ├── cms/
│   │   ├── client.ts      # CMS Client
│   │   ├── queries.ts     # Queries
│   │   └── types.ts       # Content Types
├── content/               # Local content (Fallback)
```

---

## Checkliste: Neue Website

```markdown
## Setup
- [ ] Next.js Projekt initialisiert
- [ ] Tailwind konfiguriert mit Design Tokens
- [ ] Fonts eingebunden (next/font)
- [ ] Basis-Layout (Header, Footer)

## Components
- [ ] Component Library geplant
- [ ] UI Components (Button, Heading, Text, Container)
- [ ] Section Components identifiziert

## Pages
- [ ] Homepage
- [ ] Alle Unterseiten
- [ ] Impressum & Datenschutz

## Responsive
- [ ] Desktop 1:1 (Figma Match)
- [ ] Tablet angepasst
- [ ] Mobile optimiert

## SEO & Speed
- [ ] Metadata pro Seite
- [ ] Sitemap generiert
- [ ] robots.txt
- [ ] Lighthouse Score > 90

## Launch
- [ ] Domain konfiguriert
- [ ] Analytics eingebunden
- [ ] Cookie Banner DSGVO-konform
```

---

## Referenzen

- [references/DESIGN-TOKENS.md](references/DESIGN-TOKENS.md) — Figma Tokens → Tailwind
- [references/COMPONENT-PATTERNS.md](references/COMPONENT-PATTERNS.md) — Section Patterns
- [references/SCREENSHOT-WORKFLOW.md](references/SCREENSHOT-WORKFLOW.md) — Pixel-Perfect Abgleich
- [references/RESPONSIVE-STRATEGY.md](references/RESPONSIVE-STRATEGY.md) — Responsive Regeln
- [references/SEO-SPEED.md](references/SEO-SPEED.md) — Performance & SEO
- [references/NEXTJS-BOILERPLATE.md](references/NEXTJS-BOILERPLATE.md) — Projekt-Setup

---

*Built for Bluemonkeys — Pixel-Perfect Websites, Every Time.* 🐵

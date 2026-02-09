# Next.js Boilerplate Setup

## Quick Start

```bash
# Create Next.js App
npx create-next-app@latest PROJECT_NAME \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd PROJECT_NAME

# Install Dependencies
npm install clsx tailwind-merge
npm install framer-motion  # Optional: Animationen
npm install lucide-react   # Icons

# Dev Server
npm run dev
```

---

## Projekt-Struktur

```
PROJECT_NAME/
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Öffentliche Seiten
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── services/
│   │   │   │   └── page.tsx
│   │   │   └── contact/
│   │   │       └── page.tsx
│   │   ├── (legal)/              # Legal Pages (anderes Layout?)
│   │   │   ├── layout.tsx        # Optional: Schmaleres Layout
│   │   │   ├── impressum/
│   │   │   │   └── page.tsx
│   │   │   ├── datenschutz/
│   │   │   │   └── page.tsx
│   │   │   └── agb/
│   │   │       └── page.tsx
│   │   ├── api/                  # API Routes (falls nötig)
│   │   ├── layout.tsx            # Root Layout
│   │   ├── globals.css           # Tailwind + Custom CSS
│   │   ├── sitemap.ts            # Dynamic Sitemap
│   │   ├── robots.ts             # robots.txt
│   │   └── not-found.tsx         # 404 Page
│   ├── components/
│   │   ├── ui/                   # Atomic/Shared Components
│   │   │   ├── button.tsx
│   │   │   ├── heading.tsx
│   │   │   ├── text.tsx
│   │   │   ├── container.tsx
│   │   │   ├── section.tsx
│   │   │   ├── card.tsx
│   │   │   └── input.tsx
│   │   ├── sections/             # Page Sections
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   ├── testimonials.tsx
│   │   │   ├── cta.tsx
│   │   │   ├── faq.tsx
│   │   │   └── contact-form.tsx
│   │   ├── layout/               # Layout Components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── navigation.tsx
│   │   │   └── mobile-menu.tsx
│   │   └── shared/               # Shared across sections
│   │       ├── logo.tsx
│   │       ├── social-links.tsx
│   │       └── cookie-banner.tsx
│   ├── lib/
│   │   ├── utils.ts              # cn() helper, etc.
│   │   ├── fonts.ts              # Font definitions
│   │   └── metadata.ts           # SEO helpers
│   ├── styles/
│   │   └── design-tokens.css     # CSS Custom Properties
│   └── types/
│       └── index.ts              # TypeScript types
├── public/
│   ├── images/                   # Static images
│   ├── fonts/                    # Local fonts (falls nötig)
│   ├── og-image.jpg              # Open Graph Image
│   └── favicon.ico
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

---

## Essential Files

### lib/utils.ts
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### lib/fonts.ts
```ts
import { Inter, Playfair_Display } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})
```

### app/layout.tsx
```tsx
import type { Metadata } from 'next'
import { inter, playfair } from '@/lib/fonts'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Company Name',
    template: '%s | Company Name',
  },
  description: 'Your site description.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

### app/globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 59 130 246;
    --color-secondary: 16 185 129;
    
    --section-padding: 5rem;
    --container-padding: 1.5rem;
  }
  
  @media (max-width: 768px) {
    :root {
      --section-padding: 3rem;
      --container-padding: 1rem;
    }
  }
  
  html {
    scroll-behavior: smooth;
  }
  
  body {
    @apply bg-white text-gray-900;
  }
}
```

### tailwind.config.ts
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Add more colors from Figma
      },
      // Add more design tokens
    },
  },
  plugins: [],
}

export default config
```

---

## Basic Components

### components/ui/container.tsx
```tsx
import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'default' | 'narrow' | 'wide'
}

export function Container({ 
  children, 
  className,
  size = 'default' 
}: ContainerProps) {
  return (
    <div className={cn(
      'mx-auto px-4 md:px-6 lg:px-8',
      size === 'narrow' && 'max-w-3xl',
      size === 'default' && 'max-w-6xl',
      size === 'wide' && 'max-w-7xl',
      className
    )}>
      {children}
    </div>
  )
}
```

### components/ui/section.tsx
```tsx
import { cn } from '@/lib/utils'

interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section 
      id={id}
      className={cn('py-16 md:py-20 lg:py-24', className)}
    >
      {children}
    </section>
  )
}
```

### components/ui/button.tsx
```tsx
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ButtonProps {
  children: React.ReactNode
  href?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

export function Button({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  
  const classes = cn(baseStyles, variants[variant], sizes[size], className)
  
  if (href) {
    return <Link href={href} className={classes}>{children}</Link>
  }
  
  return <button onClick={onClick} className={classes}>{children}</button>
}
```

---

## Legal Pages Template

### app/(legal)/impressum/page.tsx
```tsx
import { Metadata } from 'next'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'

export const metadata: Metadata = {
  title: 'Impressum',
  robots: { index: false, follow: false },
}

export default function ImpressumPage() {
  return (
    <Section>
      <Container size="narrow">
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>
        
        <div className="prose prose-gray max-w-none">
          <h2>Angaben gemäß § 5 TMG / § 5 ECG</h2>
          <p>
            Firmenname GmbH<br />
            Musterstraße 1<br />
            1234 Musterstadt<br />
            Österreich
          </p>
          
          <h2>Kontakt</h2>
          <p>
            Telefon: +43 123 456789<br />
            E-Mail: office@example.com
          </p>
          
          {/* Add more sections */}
        </div>
      </Container>
    </Section>
  )
}
```

---

## Deployment Ready

### next.config.mjs
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Add CMS domains
    ],
  },
}

export default nextConfig
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix"
  }
}
```

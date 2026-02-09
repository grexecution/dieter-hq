# SEO & Speed Optimization

## Built-in von Anfang an

Diese Optimierungen sind **Standard** — nicht optional.

---

## SEO Setup

### Root Layout Metadata

```tsx
// app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'Company Name',
    template: '%s | Company Name',
  },
  description: 'Your main description here.',
  keywords: ['keyword1', 'keyword2'],
  authors: [{ name: 'Company Name' }],
  creator: 'Company Name',
  openGraph: {
    type: 'website',
    locale: 'de_AT',
    url: 'https://example.com',
    siteName: 'Company Name',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Company Name',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Company Name',
    description: 'Your description',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}
```

### Per-Page Metadata

```tsx
// app/about/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',  // Wird zu "About Us | Company Name"
  description: 'Learn more about our company.',
  openGraph: {
    title: 'About Us',
    description: 'Learn more about our company.',
  },
}
```

### Dynamic Metadata

```tsx
// app/blog/[slug]/page.tsx
import { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  }
}
```

---

## Sitemap

```tsx
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://example.com'
  
  // Static pages
  const staticPages = [
    '',
    '/about',
    '/contact',
    '/impressum',
    '/datenschutz',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
  
  // Dynamic pages (from CMS)
  const posts = await getPosts()
  const dynamicPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
  
  return [...staticPages, ...dynamicPages]
}
```

---

## Robots.txt

```tsx
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

---

## Speed Optimization

### Image Optimization

```tsx
import Image from 'next/image'

// Hero Image (above the fold)
<Image
  src="/hero.jpg"
  alt="Hero description"
  width={1200}
  height={600}
  priority  // Preload für above-the-fold
  quality={85}
/>

// Below the fold (lazy load by default)
<Image
  src="/feature.jpg"
  alt="Feature"
  width={600}
  height={400}
  loading="lazy"  // Default
/>

// Fill container
<div className="relative aspect-video">
  <Image
    src="/video-thumb.jpg"
    alt="Video"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>
```

### Font Optimization

```tsx
// app/fonts.ts
import { Inter, Playfair_Display } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',  // Wichtig!
  variable: '--font-sans',
})

export const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

// app/layout.tsx
<body className={`${inter.variable} ${playfair.variable}`}>
```

### Code Splitting

```tsx
import dynamic from 'next/dynamic'

// Heavy components lazy laden
const HeavyChart = dynamic(() => import('@/components/chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // Nur Client
})

// Modal lazy laden
const Modal = dynamic(() => import('@/components/modal'))
```

### Preloading Critical Resources

```tsx
// app/layout.tsx
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
</head>
```

---

## Performance Checklist

### Lighthouse Targets
```
Performance: > 90
Accessibility: > 90
Best Practices: > 90
SEO: > 90
```

### Core Web Vitals
```
LCP (Largest Contentful Paint): < 2.5s
FID (First Input Delay): < 100ms
CLS (Cumulative Layout Shift): < 0.1
```

### Checklist
```markdown
## Images
- [ ] next/image für alle Bilder
- [ ] priority für above-the-fold
- [ ] sizes Attribut für responsive
- [ ] WebP/AVIF (automatisch)

## Fonts
- [ ] next/font verwendet
- [ ] display: swap
- [ ] Nur benötigte Subsets

## JavaScript
- [ ] Keine großen Bundles
- [ ] Dynamic imports für Heavy Components
- [ ] Tree shaking funktioniert

## CSS
- [ ] Tailwind purge aktiv (automatisch)
- [ ] Keine unused CSS

## SEO
- [ ] Metadata auf allen Seiten
- [ ] sitemap.xml generiert
- [ ] robots.txt vorhanden
- [ ] Strukturierte Daten (optional)
- [ ] Canonical URLs

## Accessibility
- [ ] Alt-Texte für Bilder
- [ ] ARIA Labels
- [ ] Keyboard Navigation
- [ ] Fokus-Styles
```

---

## Structured Data (Optional)

```tsx
// app/layout.tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Company Name',
      url: 'https://example.com',
      logo: 'https://example.com/logo.png',
      sameAs: [
        'https://twitter.com/company',
        'https://linkedin.com/company/company',
      ],
    }),
  }}
/>
```

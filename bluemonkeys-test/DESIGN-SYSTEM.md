# Design System — Cruip "Simple" Template Nachbau

## 📋 Referenz
- **Original:** https://cruip.com/demos/simple/
- **Typ:** SaaS Landing Page
- **Stil:** Clean, Modern, Professional

---

## 1. 🎨 Color Palette

### Primary — Indigo/Purple
```
Primary:       #6366F1  (Indigo 500)
Primary Light: #818CF8  (Indigo 400) — Hover
Primary Dark:  #4F46E5  (Indigo 600)
```

### Background
```
Light:      #FFFFFF
Surface:    #F9FAFB  (Gray 50)
Dark:       #0F172A  (Slate 900) — Feature Section
```

### Text
```
Heading:    #111827  (Gray 900)
Body:       #4B5563  (Gray 600)
Muted:      #9CA3AF  (Gray 400)
On Dark:    #FFFFFF
On Dark Muted: #94A3B8 (Slate 400)
```

### Accent
```
Green:      #22C55E  (für Success/Checkmarks)
```

---

## 2. ✍️ Typography

### Font
- **Family:** Inter (Google Fonts)
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Scale
| Element | Style | Size |
|---------|-------|------|
| H1 (Hero) | `text-4xl md:text-5xl font-bold` | 36-48px |
| H2 | `text-3xl md:text-4xl font-bold` | 30-36px |
| H3 | `text-xl font-semibold` | 20px |
| Body | `text-base text-gray-600` | 16px |
| Small | `text-sm text-gray-500` | 14px |
| Nav | `text-sm font-medium` | 14px |

---

## 3. 🔲 Stilistik

### Border Radius
- **Buttons:** `rounded-full` (pill shape)
- **Cards/Terminal:** `rounded-xl` (12px)
- **Small Elements:** `rounded-lg` (8px)

### Shadows
- **Terminal Box:** `shadow-xl`
- **Cards:** `shadow-sm`
- **Buttons:** Keine/minimal

### Spacing
- **Section:** `py-12 md:py-20`
- **Container:** `max-w-6xl mx-auto px-4 sm:px-6`

---

## 4. 🔘 Buttons

### Primary (Filled)
```tsx
className="px-5 py-2.5 bg-primary text-white text-sm font-medium 
           rounded-full hover:bg-primary-dark transition-colors"
```

### Secondary (Outline)
```tsx
className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm 
           font-medium rounded-full hover:border-gray-400 transition-colors"
```

### Nav Button
```tsx
className="px-4 py-2 bg-gray-900 text-white text-sm font-medium 
           rounded-full hover:bg-gray-800 transition-colors"
```

---

## 5. 📐 Layout

### Header
- Sticky, white background
- Logo left, Nav center, Buttons right
- Border bottom on scroll

### Sections
1. **Hero** — White, centered, terminal mockup
2. **Logo Cloud** — White, logos in row
3. **Testimonial** — White, single quote centered
4. **Features** — Dark (Slate 900), globe visual

---

## ✅ Checklist

- [x] Primary: #6366F1
- [x] Dark Section: #0F172A
- [x] Font: Inter
- [x] Buttons: rounded-full (pill)
- [x] Terminal: rounded-xl with shadow
- [x] Clean, minimal design

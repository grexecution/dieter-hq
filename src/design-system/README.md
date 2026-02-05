# Dieter HQ Design System

Professional design system inspired by Linear, Vercel, and Raycast.

## 🎯 Philosophy

1. **Consistency over creativity** — Use the system, don't fight it
2. **Constraints are features** — Limited choices = faster decisions
3. **Tokens are truth** — All values come from `tokens.ts`

---

## 📐 Spacing

Use Tailwind's built-in spacing scale. **No arbitrary values.**

```tsx
// ✅ Good
<div className="p-4 gap-3 mt-6">

// ❌ Bad
<div className="p-[13px] gap-[7px] mt-[22px]">
```

Common spacing:
| Token | Size | Use Case |
|-------|------|----------|
| `1` | 4px | Icon padding, tight gaps |
| `2` | 8px | Compact spacing, badges |
| `3` | 12px | Default component padding |
| `4` | 16px | Card padding, section gaps |
| `6` | 24px | Section separation |
| `8` | 32px | Large section gaps |

---

## 🔤 Typography

Strict scale. **No arbitrary font sizes.**

| Class | Size | Use |
|-------|------|-----|
| `text-xs` | 12px | Captions, labels |
| `text-sm` | 14px | Secondary text, buttons |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Emphasized body |
| `text-xl` | 20px | Section headings |
| `text-2xl` | 24px | **Page titles ONLY** |

```tsx
// ✅ Good — clear hierarchy
<h1 className="text-2xl font-semibold">Page Title</h1>
<h2 className="text-xl font-semibold">Section</h2>
<p className="text-base text-zinc-700">Body text...</p>
<span className="text-sm text-zinc-500">Secondary</span>

// ❌ Bad — arbitrary sizes, no hierarchy
<h1 className="text-[28px]">Title</h1>
<p className="text-[15px]">Text</p>
```

### Typography Patterns

```tsx
import { headingStyles, textStyles } from '@/design-system/components';

<h1 className={headingStyles.h1}>Dashboard</h1>
<p className={textStyles.body}>Welcome back!</p>
<span className={textStyles.muted}>Last updated 2 hours ago</span>
```

---

## 🎨 Colors

### Neutral: Zinc

Use Zinc for all neutral UI elements.

| Token | Dark Mode Use | Light Mode Use |
|-------|---------------|----------------|
| `zinc-950` | Background | — |
| `zinc-900` | Cards, elevated | Text |
| `zinc-800` | Borders, dividers | — |
| `zinc-700` | Secondary borders | — |
| `zinc-500` | Muted text | Muted text |
| `zinc-400` | Placeholders | — |
| `zinc-100` | — | Backgrounds |
| `zinc-50` | — | Elevated surfaces |

### Primary: Indigo

Subtle, professional accent color.

```tsx
// Primary actions
<button className="bg-primary-600 hover:bg-primary-700">Save</button>

// Links
<a className="text-primary-600 hover:text-primary-700">Learn more</a>

// Focus rings
<input className="focus:ring-primary-500" />
```

### Status Colors

| Semantic | Palette | Use |
|----------|---------|-----|
| `success` | Emerald | Confirmations, completed |
| `warning` | Amber | Warnings, pending |
| `error` | Red | Errors, destructive |
| `info` | Blue | Information, tips |

```tsx
<Badge className={badgeStyles.success}>Active</Badge>
<Badge className={badgeStyles.error}>Failed</Badge>
```

---

## 🧩 Component Patterns

Import from `@/design-system/components`:

### Buttons

```tsx
import { buttonStyles, buttonSizes, cx } from '@/design-system/components';

<button className={cx(buttonStyles.primary, buttonSizes.md)}>
  Save Changes
</button>

<button className={cx(buttonStyles.ghost, buttonSizes.sm)}>
  Cancel
</button>

<button className={cx(buttonStyles.destructive, buttonSizes.md)}>
  Delete
</button>
```

**Variants:**
- `primary` — Main CTA (use sparingly)
- `secondary` — Default button
- `ghost` — Subtle, no background
- `outline` — Bordered
- `destructive` — Danger actions
- `link` — Text link style

**Sizes:**
- `sm` — Height 32px
- `md` — Height 36px (default)
- `lg` — Height 40px
- `icon` — Square 36px

### Cards

```tsx
import { cardStyles, cardPadding, cx } from '@/design-system/components';

<div className={cx(cardStyles.default, cardPadding.md)}>
  Card content
</div>

<div className={cx(cardStyles.interactive, cardPadding.lg)}>
  Clickable card with hover state
</div>
```

**Variants:**
- `default` — Subtle border
- `elevated` — With shadow
- `interactive` — Hover state
- `ghost` — No border, subtle bg

### Inputs

```tsx
import { inputStyles, inputSizes, cx } from '@/design-system/components';

<input 
  className={cx(inputStyles.default, inputSizes.md)}
  placeholder="Enter email..."
/>

// With error state
<input 
  className={cx(inputStyles.error, inputSizes.md)}
  aria-invalid="true"
/>
```

### Badges

```tsx
import { badgeStyles } from '@/design-system/components';

<span className={badgeStyles.default}>Draft</span>
<span className={badgeStyles.success}>Active</span>
<span className={badgeStyles.warning}>Pending</span>
<span className={badgeStyles.error}>Failed</span>
```

### Overlays

```tsx
import { overlayStyles } from '@/design-system/components';

// Modal backdrop
<div className={overlayStyles.backdrop} />

// Modal container
<div className={overlayStyles.modal}>
  <h2 className={headingStyles.h2}>Confirm Action</h2>
  ...
</div>

// Popover/dropdown
<div className={overlayStyles.popover}>
  Menu items...
</div>

// Tooltip
<div className={overlayStyles.tooltip}>
  Helpful hint
</div>
```

---

## 📦 Layout Patterns

### Containers

```tsx
import { containerStyles } from '@/design-system/components';

<div className={containerStyles.default}>
  Max width 1280px, responsive padding
</div>

<div className={containerStyles.narrow}>
  Max width 768px, for content/articles
</div>
```

### Stacks

```tsx
import { stackStyles } from '@/design-system/components';

<div className={stackStyles.vertical.md}>
  <Item />
  <Item />
  <Item />
</div>

<div className={stackStyles.horizontal.sm}>
  <Icon />
  <Label />
</div>
```

---

## 🔄 Animations

Available animation classes:

| Class | Use |
|-------|-----|
| `animate-fade-in` | Subtle appearance |
| `animate-fade-in-up` | Entry from below |
| `animate-scale-in` | Modals, popovers |
| `animate-slide-in-right` | Drawers, panels |
| `animate-spin` | Loading spinners |
| `animate-pulse` | Skeleton loaders |

---

## 🎹 Z-Index Layers

Don't use arbitrary z-index values:

| Token | Value | Use |
|-------|-------|-----|
| `z-dropdown` | 1000 | Dropdown menus |
| `z-sticky` | 1100 | Sticky headers |
| `z-overlay` | 1300 | Backdrop overlays |
| `z-modal` | 1400 | Modal dialogs |
| `z-popover` | 1500 | Popovers, tooltips |
| `z-toast` | 1700 | Toast notifications |

```tsx
<div className="z-modal">Modal content</div>
```

---

## ✅ Do's and Don'ts

### ✅ Do

- Use semantic color tokens (`text-primary-600`, not `text-indigo-600`)
- Use spacing from the scale (`p-4`, not `p-[17px]`)
- Use font sizes from the scale (`text-sm`, not `text-[13px]`)
- Import patterns from `components.ts`
- Use `dark:` variants for dark mode

### ❌ Don't

- Use arbitrary values (`p-[23px]`, `text-[15px]`)
- Use `text-2xl` for anything other than main page titles
- Create one-off color values
- Mix different button styles inconsistently
- Skip focus states

---

## 📁 File Structure

```
src/design-system/
├── tokens.ts        # Core design tokens
├── components.ts    # Reusable class patterns
├── index.ts         # Public exports
├── README.md        # This file
└── utils/
    ├── responsive.ts
    └── accessibility.ts
```

---

## 🔧 Extending the System

Need a new pattern? Add it to `components.ts`:

```tsx
// In components.ts
export const newComponentStyles = {
  default: "...",
  variant: "...",
} as const;

// Then use it
import { newComponentStyles } from '@/design-system/components';
```

**Never add arbitrary values in components.** If a token doesn't exist, ask yourself: "Should this be in the system, or am I overengineering?"

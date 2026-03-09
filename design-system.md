# InvoiceFlow Design System
## Visual Reference & Implementation Guide

> Derived from visual analysis of the Maze UI reference screens. No content, copy, or branding from the reference has been used — only design patterns, spatial logic, and aesthetic principles.

---

## 1. Design Philosophy

### Core Aesthetic
**Clean SaaS Confidence.** The UI is calm, structured, and purposeful. It never shouts. Information is presented at a comfortable density — not sparse, not cluttered. Every element earns its space. The overall feeling is: *professional tool made by people who care about craft.*

### Key Principles
- **Whitespace is structural, not decorative.** Large breathing room between sections signals hierarchy and reduces cognitive load.
- **Typography does the heavy lifting.** Size contrast between headings and body creates drama without requiring decorative elements.
- **Color is used sparingly for meaning.** The palette is predominantly neutral. Accent colors appear only when they communicate something: action, status, or brand.
- **Cards are the primary container pattern.** Content lives in clean, lightly bordered or shadow-separated cards, never in raw columns.
- **Navigation is quiet.** The sidebar and top nav are subdued — they exist to serve content, not compete with it.

---

## 2. Color System

### Base Palette

```css
:root {
  /* Backgrounds */
  --color-bg-base:        #F5F4F0;  /* Warm off-white — the canvas */
  --color-bg-surface:     #FFFFFF;  /* Cards, modals, panels */
  --color-bg-subtle:      #F0EFEB;  /* Hover states, secondary areas */
  --color-bg-inverse:     #1C1C1C;  /* Dark footer, dark panels */

  /* Borders */
  --color-border-default: #E4E2DC;  /* Card and section borders */
  --color-border-subtle:  #EEEDE9;  /* Table row dividers, light separators */
  --color-border-strong:  #C8C5BC;  /* Focused inputs, active states */

  /* Text */
  --color-text-primary:   #1A1A1A;  /* Headlines, key content */
  --color-text-secondary: #6B6860;  /* Subtext, labels, meta */
  --color-text-tertiary:  #9E9B93;  /* Placeholder, disabled */
  --color-text-inverse:   #FFFFFF;  /* Text on dark backgrounds */

  /* Brand Accent — Teal/Cyan family */
  --color-accent-primary:   #0D9488;  /* Primary CTA, active nav, key highlights */
  --color-accent-hover:     #0B8078;  /* Hover state for primary */
  --color-accent-subtle:    #CCFBF1;  /* Accent backgrounds, badges */
  --color-accent-text:      #0F766E;  /* Accent-colored text */

  /* Status Colors */
  --color-success:          #16A34A;
  --color-success-subtle:   #DCFCE7;
  --color-warning:          #D97706;
  --color-warning-subtle:   #FEF3C7;
  --color-danger:           #DC2626;
  --color-danger-subtle:    #FEE2E2;
  --color-info:             #2563EB;
  --color-info-subtle:      #DBEAFE;

  /* Neutral Grays (for charts, secondary UI) */
  --color-gray-100:         #F4F3EF;
  --color-gray-200:         #E9E7E1;
  --color-gray-300:         #D4D1C9;
  --color-gray-400:         #A8A49A;
  --color-gray-500:         #7C786E;
  --color-gray-600:         #575349;
  --color-gray-700:         #3A3730;
  --color-gray-800:         #252219;
  --color-gray-900:         #141210;
}
```

### Color Usage Rules

- The warm off-white (`#F5F4F0`) is the **app background**. Not pure white, not gray — warm and slightly toasted. This is a signature detail of the reference aesthetic.
- White (`#FFFFFF`) is reserved for **surface elements** (cards, modals, inputs). This creates natural depth.
- The teal accent appears on: active navigation items, primary buttons, progress indicators, and chart highlights.
- Dark sections (footer, admin sidebar areas) use `#1C1C1C` — near-black with warmth, not cold black.
- Status colors are only used in context of real status data (invoice badges, alert banners). Never decorative.

---

## 3. Typography

### Font Stack

```css
/* Primary: Clean geometric sans-serif for UI and headings */
--font-primary: 'DM Sans', 'Geist', sans-serif;

/* Secondary/Display: Used for large marketing-style headings (landing page) */
--font-display: 'Fraunces', 'Playfair Display', serif;

/* Monospace: Invoice numbers, codes, amounts in tables */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

> **Implementation note:** The reference uses a large, confident display font for hero headings that contrasts sharply with the clean UI font used throughout the rest of the application. This two-font approach creates strong visual hierarchy between marketing/empty states and functional UI.

### Type Scale

```css
/* Display (landing page hero, empty state callouts) */
--text-display-xl:  clamp(48px, 8vw, 96px);   font-weight: 400; letter-spacing: -0.03em;
--text-display-lg:  clamp(36px, 5vw, 64px);   font-weight: 400; letter-spacing: -0.02em;

/* Headings (page titles, section headers) */
--text-heading-xl:  28px;   font-weight: 600; letter-spacing: -0.02em;
--text-heading-lg:  22px;   font-weight: 600; letter-spacing: -0.015em;
--text-heading-md:  18px;   font-weight: 600; letter-spacing: -0.01em;
--text-heading-sm:  15px;   font-weight: 600; letter-spacing: -0.01em;

/* Body */
--text-body-lg:     16px;   font-weight: 400; line-height: 1.6;
--text-body-md:     14px;   font-weight: 400; line-height: 1.5;
--text-body-sm:     13px;   font-weight: 400; line-height: 1.5;

/* Labels & Meta */
--text-label:       12px;   font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase;
--text-caption:     11px;   font-weight: 400; color: var(--color-text-tertiary);

/* Mono (numbers, IDs) */
--text-mono-md:     14px;   font-family: var(--font-mono); font-weight: 500;
--text-mono-sm:     12px;   font-family: var(--font-mono); font-weight: 400;
```

### Typography Behaviour
- **Page titles** are large and confident — `--text-heading-xl`. No decorative elements needed.
- **Section labels** above groups of content use `--text-label` — small, uppercase, tracked out, muted. These act as quiet signposts.
- **Invoice numbers and amounts** use `--font-mono` for legibility and a professional, document-like feel.
- Headings use **negative letter-spacing** (-0.01em to -0.03em). This is a key detail that makes text feel crafted rather than default.

---

## 4. Spacing System

Based on an 8px base unit with a 4px half-unit for tight contexts.

```css
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;
--space-20:  80px;
--space-24:  96px;
```

### Spacing Principles
- **Section-to-section spacing** inside a page: `--space-12` (48px) minimum.
- **Card internal padding:** `--space-6` (24px) on all sides. Tight cards: `--space-4` (16px).
- **Form fields:** `--space-3` (12px) vertical gap between inputs.
- **Navigation items:** `--space-2` (8px) vertical padding, `--space-4` (16px) horizontal padding.
- **Table rows:** `--space-3` (12px) vertical padding per row.
- The reference is generous with vertical breathing room. When in doubt, add more space above section headers.

---

## 5. Layout Architecture

### Application Shell

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed)  │  MAIN CONTENT AREA                │
│                         │                                   │
│  [Logo + Workspace]     │  TOP BAR (56px)                   │
│  ─────────────────      │  [Page Title]    [Actions]        │
│  Nav items              │  ─────────────────────────────    │
│  (icon + label)         │                                   │
│                         │  PAGE CONTENT                     │
│                         │  (max-width: 1200px, centered)    │
│  ─────────────────      │                                   │
│  Bottom nav items       │                                   │
│  (settings, support)    │                                   │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar Specifications
- **Width:** 240px (collapsed: 56px icon-only on mobile)
- **Background:** White (`#FFFFFF`) with a right border `1px solid var(--color-border-default)`
- **Top section:** Workspace switcher — avatar/logo, workspace name, role label, and swap icon. This is a distinct, slightly heavier block at the top.
- **Nav items:** Icon (20px) + label. Active state: accent-colored icon + text, subtle accent background pill. Inactive: gray icon + gray text.
- **Bottom items:** Settings, Support, Help — these live at the bottom of the sidebar, separated by a subtle divider.
- **No heavy shadows on sidebar.** The border alone separates it.

### Top Bar (within main content)
- **Height:** 56px
- **Background:** Matches the page background (warm off-white), not white
- **Contains:** Page title (heading-lg), optional breadcrumb, right-aligned action buttons
- **No visible border** — it floats above the content naturally

### Content Width
- **Max content width:** 1100px–1200px
- **Horizontal padding:** 40px on left and right
- Content is never full-bleed edge-to-edge — there is always breathing room

### Grid System
- **Dashboard cards:** 4-column grid at large screens, 2-column at medium, 1-column at small
- **Settings panels:** 2-column (nav on left ~220px, content on right)
- **Invoice creation form:** Single wide column, max-width 800px, centered
- **Modal dialogs:** 540px–740px wide, centered with backdrop overlay

---

## 6. Component Library

### 6.1 Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-text-primary);  /* Near-black, not accent */
  color: var(--color-text-inverse);
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease;
}
.btn-primary:hover {
  background: var(--color-gray-700);
  transform: translateY(-1px);
}

/* Secondary / Outline Button */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-border-strong);
  padding: 9px 19px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.btn-secondary:hover {
  background: var(--color-bg-subtle);
  border-color: var(--color-gray-400);
}

/* Accent / CTA Button (used sparingly — upgrade prompts, primary send action) */
.btn-accent {
  background: var(--color-accent-primary);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}
.btn-accent:hover {
  background: var(--color-accent-hover);
}

/* Ghost / Text Button */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
}
.btn-ghost:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}
```

**Button Hierarchy Rules:**
- Primary (black) = the main action on a page or modal. One per view.
- Accent (teal) = reserved for upgrade prompts and the invoice send action only.
- Secondary (outlined) = secondary actions alongside a primary.
- Ghost = tertiary actions, nav items, table row actions.

**Size variants:** Default (36px height), Small (30px height, 12px font), Large (44px height, 15px font).

---

### 6.2 Cards

```css
.card {
  background: #FFFFFF;
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  padding: var(--space-6);   /* 24px */
  /* No box-shadow by default — border is enough */
}

/* Elevated card (modals, dropdowns, tooltips) */
.card-elevated {
  background: #FFFFFF;
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* Interactive card (template selection, feature option cards) */
.card-interactive {
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.card-interactive:hover {
  border-color: var(--color-gray-400);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.card-interactive.selected {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}
```

**Border radius is 12px** for main cards. Smaller elements (badges, inputs, small buttons) use 6–8px. This is consistent throughout the reference.

---

### 6.3 Status Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;  /* Fully rounded pill */
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

/* Dot indicator (for live/stopped status) */
.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.badge-success  { background: var(--color-success-subtle);  color: var(--color-success); }
.badge-warning  { background: var(--color-warning-subtle);  color: var(--color-warning); }
.badge-danger   { background: var(--color-danger-subtle);   color: var(--color-danger);  }
.badge-info     { background: var(--color-info-subtle);     color: var(--color-info);    }
.badge-neutral  { background: var(--color-gray-200);        color: var(--color-gray-600); }
.badge-accent   { background: var(--color-accent-subtle);   color: var(--color-accent-text); }
```

**Invoice-specific badge mapping:**
- `draft` → neutral (gray)
- `sent` → info (blue)
- `overdue` → danger (red)
- `paid` → success (green)
- `voided` → neutral with strikethrough text style
- `partially paid` → warning (amber)

---

### 6.4 Data Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table thead tr {
  border-bottom: 1px solid var(--color-border-default);
}

.table thead th {
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: left;
}

.table tbody tr {
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background 100ms ease;
}

.table tbody tr:hover {
  background: var(--color-bg-subtle);
}

.table tbody tr:last-child {
  border-bottom: none;
}

.table tbody td {
  padding: 12px 16px;
  color: var(--color-text-primary);
  vertical-align: middle;
}
```

**Table design rules:**
- Column headers are small, uppercase, and muted — they label, they don't compete.
- Row hover is a very subtle background shift — barely noticeable but tactile.
- No vertical dividers between columns. Horizontal dividers only.
- Amount columns are right-aligned and use `--font-mono`.
- Action columns (edit, view, delete) use ghost icon buttons, hidden until row hover.

---

### 6.5 Form Inputs

```css
.input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--color-border-default);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
  background: #FFFFFF;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  outline: none;
}

.input::placeholder {
  color: var(--color-text-tertiary);
}

.input:focus {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.input:disabled {
  background: var(--color-bg-subtle);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

/* Input label */
.input-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  display: block;
}

/* Input group (label + input + optional helper) */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
```

**Toggle switches** follow the same teal accent on active state. The track is `--color-gray-300` when off, `--color-accent-primary` when on. The handle is always white.

---

### 6.6 Navigation (Sidebar Items)

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 100ms ease, color 100ms ease;
  text-decoration: none;
}

.nav-item:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: var(--color-accent-subtle);
  color: var(--color-accent-text);
  font-weight: 500;
}

.nav-item .nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-item.active .nav-icon {
  opacity: 1;
  color: var(--color-accent-primary);
}

/* Nav section label */
.nav-section-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  padding: 8px 12px 4px;
  margin-top: 8px;
}
```

---

### 6.7 Modals & Dialogs

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 640px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  padding: var(--space-8);  /* 32px */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.modal-close:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}
```

**Two-panel modals** (like template selection): left panel is a light-gray sidebar (`var(--color-bg-subtle)`) with categorised nav, right panel is white with the content grid. The two panels sit flush inside the modal card.

---

### 6.8 Progress & Step Indicators

```css
/* Linear progress bar (used in multi-step flows: Build > Share > Results > Report) */
.progress-steps {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.progress-step {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.progress-step.active {
  color: var(--color-text-primary);
  font-weight: 600;
}

.progress-step.completed {
  color: var(--color-text-secondary);
}

.progress-separator {
  color: var(--color-text-tertiary);
  margin: 0 4px;
}

/* Thin top-of-card progress line */
.progress-line {
  height: 3px;
  background: var(--color-accent-primary);
  border-radius: 2px;
  transition: width 300ms ease;
}
```

---

### 6.9 Notification / Alert Banners

```css
.alert-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: var(--space-4);
}

.alert-banner.info    { background: var(--color-info-subtle);    color: var(--color-info); }
.alert-banner.warning { background: var(--color-warning-subtle); color: var(--color-warning); }
.alert-banner.success { background: var(--color-success-subtle); color: var(--color-success); }
.alert-banner.danger  { background: var(--color-danger-subtle);  color: var(--color-danger); }
```

**Upgrade banners** (plan limit prompts) are a special pattern: full-width muted banner at the top of a page with a brief message and a teal CTA button inline on the right. Not alarming, but visible.

---

## 7. Landing Page Design

### Structure

The landing page uses a noticeably **different visual register** from the app interior. Where the app is structured and dense, the landing page is expansive and editorial.

```
┌─────────────────────────────────────────────────────────────┐
│  TOP NAV (sticky, transparent → white on scroll)            │
│  [Logo]  [Links]              [Log in]  [CTA button]        │
├─────────────────────────────────────────────────────────────┤
│  HERO SECTION                                               │
│  Background: warm off-white (#F5F4F0)                       │
│                                                             │
│  Large display-font headline (left-aligned, large)          │
│  Subheading paragraph (muted, smaller)                      │
│  Two buttons: Primary (black) + Secondary (outlined)        │
│                                                             │
│  Right side: Floating UI preview cards / mockup screenshots │
│  (positioned with slight overlap, drop shadows, rotation)   │
├─────────────────────────────────────────────────────────────┤
│  SOCIAL PROOF BAR (full-width, subtle)                      │
├─────────────────────────────────────────────────────────────┤
│  FEATURE SECTIONS (alternating layout, large whitespace)    │
├─────────────────────────────────────────────────────────────┤
│  DARK FOOTER (#1C1C1C)                                      │
│  [Logo + tagline]              [Navigation columns]         │
└─────────────────────────────────────────────────────────────┘
```

### Hero Section Details

- **Headline:** Display font (Fraunces), very large (`clamp(48px, 8vw, 80px)`), `font-weight: 400` (not bold — the size creates the impact), tight negative letter-spacing (-0.03em), black.
- **Subheadline:** DM Sans, 18–20px, `--color-text-secondary`, line-height 1.6, max-width 480px.
- **Background:** `#F5F4F0` — the warm off-white. Not pure white. This distinguishes the hero from the feature cards below.
- **Hero imagery:** Small floating cards/UI snippets positioned organically to the right of the text. They have drop shadows, white backgrounds, and show real product UI. Some may be slightly rotated (1–2 degrees). This is a signature pattern of the reference.

### Navigation Bar

```css
.landing-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
  height: 60px;
  background: rgba(245, 244, 240, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid transparent;
  transition: border-color 200ms ease;
}

.landing-nav.scrolled {
  border-bottom-color: var(--color-border-default);
  background: rgba(255, 255, 255, 0.95);
}
```

- Nav links are medium weight, dark gray, 14–15px.
- "Log in" is a simple ghost/text button.
- The main CTA ("Get started") is a solid black button — not accent. Black CTAs on warm backgrounds have more visual weight.

### Dark Footer

```css
.landing-footer {
  background: #1C1C1C;
  color: rgba(255, 255, 255, 0.65);
  padding: 48px;
}

.landing-footer .footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.landing-footer a:hover {
  color: #FFFFFF;
}
```

---

## 8. Dashboard-Specific Patterns

### Metric Cards (KPI strip)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Total Invoiced  │  │ Paid            │  │ Pending         │  │ Overdue         │
│                 │  │                 │  │                 │  │                 │
│ $24,500         │  │ $18,200         │  │ $4,800          │  │ $1,500          │
│ ↑ 12% vs last   │  │                 │  │ 3 invoices      │  │ 2 invoices      │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

- Each card: white background, border, 12px radius, 24px padding.
- Label: 12px uppercase muted. Amount: 28–32px, font-weight 600, `--font-mono`.
- Sub-label: 13px muted with count or percentage change.
- No accent colors on the metric number itself — black only. Status colors reserved for badges.

### "Needs Attention" Section

A card with a slightly amber-tinted left border accent (`border-left: 3px solid var(--color-warning)`) to signal priority without being alarming. Contains a table of overdue / due-soon invoices.

---

## 9. Iconography

- **Library:** Lucide Icons (consistent with shadcn/ui default)
- **Size:** 18px in nav, 16px inline in text/buttons, 20px in card headers
- **Color:** Inherits from text color or explicitly set to match context
- **Stroke width:** 1.5px (Lucide default — don't change this, it defines the visual weight)
- Icons are never used decoratively without purpose. Every icon has a label (either visible or as aria-label).

---

## 10. Motion & Interaction

### Principles
- **Transitions are fast.** 100–150ms for hovers and state changes. 200–300ms for appearing elements (modals, dropdowns). Never slow.
- **Easing:** `ease` or `ease-out` for entrances. `ease-in` for exits.
- **Confetti / celebration moments** (invoice sent, first payment received) use a burst animation — colorful confetti particles from the center of the screen, lasting ~2 seconds. This is a high-delight, low-frequency moment. The reference uses this pattern for task completion.

```css
/* Standard transition preset */
--transition-fast:    100ms ease;
--transition-default: 150ms ease;
--transition-slow:    250ms ease-out;
--transition-enter:   200ms ease-out;
--transition-exit:    150ms ease-in;
```

### Hover Micro-interactions
- Buttons lift slightly on hover (`transform: translateY(-1px)`)
- Interactive cards get a subtle shadow increase
- Table rows get a background tint
- Nav items get background fill

### Loading States
- Skeleton loaders that match the shape of the content (not generic spinners for page content)
- Spinner reserved for button loading states (replace button text with spinner inline)

---

## 11. Responsive Breakpoints

```css
--breakpoint-sm:  640px;   /* Mobile landscape */
--breakpoint-md:  768px;   /* Tablet */
--breakpoint-lg:  1024px;  /* Laptop */
--breakpoint-xl:  1280px;  /* Desktop */
--breakpoint-2xl: 1536px;  /* Wide */
```

- Below `md`: sidebar collapses to bottom tab bar or hamburger
- Below `lg`: dashboard cards go to 2-column
- Below `sm`: single column everything, modals become bottom sheets

---

## 12. Shadcn/UI Component Mapping

Since InvoiceFlow uses shadcn/ui, here is how this design system maps to shadcn component customisation:

| Component | Customisation Notes |
|---|---|
| `Button` | Default variant → near-black bg. Add `accent` variant for teal. Ghost stays gray. |
| `Card` | Add warm border `var(--color-border-default)`. Radius 12px. |
| `Badge` | Use filled pill variants. Map invoice statuses to shadcn color variants. |
| `Input` | Focus ring → teal accent. Label 13px 500 weight. |
| `Dialog` | Backdrop blur. Radius 16px. Larger padding (32px). |
| `Table` | Muted uppercase headers. Row hover subtle bg. |
| `Select` | Same as Input styling. |
| `Switch` | On state → teal accent. |
| `Tabs` | Underline style (not boxed). Active tab: black text + bottom border. |
| `Separator` | `var(--color-border-subtle)` — very light. |
| `Avatar` | Rounded, 2-letter fallback with gray bg. |
| `Tooltip` | Dark bg (`#1C1C1C`), white text, 8px padding, 8px radius. |

### globals.css base overrides

```css
@layer base {
  :root {
    --background: 43 20% 96%;          /* warm off-white */
    --foreground: 0 0% 10%;            /* near-black */
    --card: 0 0% 100%;                 /* white */
    --card-foreground: 0 0% 10%;
    --border: 40 12% 88%;              /* warm light border */
    --input: 40 12% 88%;
    --primary: 0 0% 10%;               /* black primary button */
    --primary-foreground: 0 0% 100%;
    --secondary: 40 12% 94%;           /* off-white secondary */
    --secondary-foreground: 0 0% 10%;
    --accent: 174 72% 31%;             /* teal accent */
    --accent-foreground: 0 0% 100%;
    --muted: 40 12% 94%;
    --muted-foreground: 30 5% 45%;
    --radius: 0.5rem;                  /* 8px base radius */
  }
}
```

---

## 13. Do's and Don'ts

### Do
- Use the warm off-white (`#F5F4F0`) as the app background, never pure white or cold gray
- Keep the sidebar quiet — nav items should not demand attention
- Use uppercase small labels to introduce sections and table columns
- Use `--font-mono` for invoice numbers, amounts, and IDs
- Keep status badges as pills with a dot prefix
- Use black (not teal) for primary action buttons in most contexts
- Give cards generous internal padding (24px+)
- Use negative letter-spacing on all headings

### Don't
- Don't use teal as a general-purpose color — it means "primary action" or "active state"
- Don't add box-shadows to elements that are already bordered
- Don't use bold weight on body text — use size and color contrast instead
- Don't center-align page content headers — left-align everything in the app interior
- Don't use more than 2 accent colors on a single screen
- Don't use heavy drop shadows — keep them soft and low-opacity
- Don't add decorative dividers or rules between every section — use whitespace instead

---

*This design system is a living document. Update it as new patterns emerge during development.*

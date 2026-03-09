# PDF Generation Approach
## Decision: `@react-pdf/renderer`

**Date:** March 2026  
**Status:** Decided

---

## Decision Summary

InvoiceFlow uses `@react-pdf/renderer` for all PDF invoice generation. PDFs are rendered server-side inside a Next.js server action or Convex function — no browser, no external service, no additional paid dependency.

---

## Why This Library

Three approaches were evaluated:

**`@react-pdf/renderer` (chosen)** — PDF layout is written in React-like JSX components and rendered entirely server-side. Self-contained, fast, no external API calls, and full control over output. The most common choice for invoice SaaS products in production.

**Headless browser (Puppeteer / Playwright)** — Renders an HTML page to PDF via a headless Chromium instance. Heavy, slow, and expensive to run on a serverless stack like Vercel. Not appropriate for this architecture.

**External PDF API (e.g. PDFShift)** — Sends an HTML template to a third-party service and receives a PDF back. Easy to implement but introduces a paid dependency, a network call on every invoice send, and a potential point of failure.

`@react-pdf/renderer` is the right fit: it runs cleanly in the existing stack, produces professional output when implemented properly, and keeps the codebase self-contained.

---

## What "Implemented Properly" Means

The limitations developers encounter with `@react-pdf/renderer` almost always come from misunderstanding its layout system — not from the library being incapable. The following practices ensure a professional, polished output.

### 1. Treat the PDF Template as a First-Class Design Component

The PDF invoice template is not an afterthought. It is a dedicated component (`InvoicePDF.tsx`) built specifically for the renderer. Do not attempt to reuse the web-facing invoice preview component — the two have different layout systems and different constraints. The PDF component should be purpose-built, well-structured, and styled independently.

### 2. Think React Native, Not CSS

The library uses a Flexbox-based layout system modelled closely on React Native — not the browser DOM. Developers should approach it as building a mobile layout, not a webpage. Columns, rows, spacing, and alignment all work via Flexbox props. Once this mental model clicks, the layout system is intuitive and capable.

### 3. Embed a Professional Custom Font

The default fonts make PDFs look generated. Embedding a professional typeface makes an immediate and significant difference. Use a clean, free font such as **Inter** or **Lato** (both available via Google Fonts as TTF files). Register the font once using `Font.register()` and apply it globally across the document.

```javascript
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ],
});
```

### 4. Accept Branding as Props

Every user has a brand color and company logo stored in their settings. The PDF component must accept these as props and apply them consistently throughout the document. This makes each invoice feel bespoke to the user's business rather than generic.

Branding touch points in the PDF:
- Header background or accent color (brand color)
- Logo image in the top-left header area
- Table header row background (brand color)
- Totals section accent line or highlight (brand color)
- Footer divider or accent

```typescript
interface InvoicePDFProps {
  invoice: InvoiceData;
  brandColor: string;       // hex e.g. "#1D4ED8"
  logoUrl: string | null;   // Convex file URL or null
  companyName: string;
  companyAddress: string;
  paymentInstructions: string;
}
```

### 5. Recommended PDF Layout Structure

```
┌─────────────────────────────────────────────┐
│  [Logo]          INVOICE                    │  ← Header (brand color bg or accent line)
│  Company Name    #INV-2026-0042             │
│  Company Address  Issue: Jan 1 / Due: Feb 1 │
├─────────────────────────────────────────────┤
│  Bill To:                                   │  ← Client section
│  Client Name / Company / Email              │
├─────────────────────────────────────────────┤
│  Description      Qty    Rate    Amount     │  ← Line items table
│  ─────────────────────────────────────────  │     (header row uses brand color)
│  Item one          2    $100    $200.00     │
│  Item two          1    $150    $150.00     │
├─────────────────────────────────────────────┤
│                    Subtotal:    $350.00     │  ← Totals block
│                    VAT (20%):   $70.00      │
│                    Sales Tax:   —           │
│                    Total:       $420.00     │
├─────────────────────────────────────────────┤
│  Notes / Payment Instructions               │  ← Footer
│  Reissued from INV-2026-0039 (if applicable)│
└─────────────────────────────────────────────┘
```

### 6. Rendering Location

PDF generation must happen server-side only — inside a Next.js server action or Convex HTTP action. Never render PDFs client-side. The rendered PDF buffer is either:

- Attached directly to the outgoing Resend email as a binary attachment, or
- Generated on demand when the client clicks "Download PDF" on the public invoice page (streamed as a response with `Content-Type: application/pdf`)

---

## Expected Output Quality

When implemented following the practices above, the resulting PDF will:

- Display the user's logo and brand color prominently
- Use clean, professional typography throughout
- Render a well-structured, aligned line items table
- Show a clear totals breakdown with individual tax lines
- Include payment instructions and notes in a clean footer section
- Be indistinguishable in quality from a document produced in a design tool

---

## Key Implementation Notes for Developers

- Install: `npm install @react-pdf/renderer`
- Font files (TTF) should be bundled with the project under `/public/fonts/` or fetched from a CDN at register time
- Use `pdf()` from `@react-pdf/renderer` to get a Node.js `Buffer` for email attachment
- Use `<PDFDownloadLink>` or stream via `pdf().toBuffer()` for the public download endpoint
- Test the PDF template early in development — it is harder to retrofit branding and layout after the data layer is complete
- The `StyleSheet.create()` API is the correct way to define styles — avoid inline style objects in hot paths

---

*This document supplements the main PRD and is intended as a reference for the developer implementing the PDF generation feature.*

# Product Requirements Document
## Invoisar — Web-Based Invoice Management Platform

**Version:** 1.0  
**Date:** March 2026  
**Status:** Ready for Development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
   - [2.1 Environment Setup Guide](#21-environment-setup-guide)
3. [User Roles](#3-user-roles)
4. [Authentication](#4-authentication)
   - [4.1 Clerk Webhook Handling](#41-clerk-webhook-handling)
5. [Dashboard](#5-dashboard)
6. [Client Management](#6-client-management)
7. [Invoice Management](#7-invoice-management)
8. [Email Delivery](#8-email-delivery)
9. [Public Invoice Page](#9-public-invoice-page)
10. [Payment Tracking](#10-payment-tracking)
11. [Analytics & AI Insights](#11-analytics--ai-insights)
12. [Notifications](#12-notifications)
13. [User Settings](#13-user-settings)
14. [Platform Admin](#14-platform-admin)
15. [Pricing Plans](#15-pricing-plans)
16. [Security Requirements](#16-security-requirements)
17. [Data Models](#17-data-models)
   - [17.1 Convex Schema](#171-convex-schema-implementation-reference)
18. [Status Flows](#18-status-flows)
19. [Out of Scope (v1)](#19-out-of-scope-v1)
20. [Landing Page Structure](#20-landing-page-structure)
21. [Error State Definitions](#21-error-state-definitions)
22. [API & Query-Mutation Structure](#22-api--query-mutation-structure)

---

## 1. Product Overview

InvoiceFlow is a web-based SaaS platform that enables freelancers and small businesses to create professional invoices, deliver them to clients by email, and track payment status — all from a single, clean interface. The platform is built for speed and simplicity: a user can go from sign-up to sending their first invoice in under five minutes.

### Core Value Propositions

- Fast invoice creation with line item presets (invoice templates)
- One-click email delivery with professionally branded PDF and HTML email
- Automatic overdue detection and manual payment recording with full audit history
- AI-powered insights to surface revenue trends and client payment behaviour
- A platform admin layer for user management, support, and feature control

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database & Backend | Convex |
| Authentication | Clerk |
| Email Delivery | Resend |
| PDF Generation | `react-pdf` / `@react-pdf/renderer` |
| AI Insights | Groq API (model configurable via `GROQ_MODEL_NAME` env variable) |
| Styling | Tailwind CSS |
| Hosting | Vercel (recommended) |

### Key Environment Variables

```
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
RESEND_API_KEY
GROQ_API_KEY
GROQ_MODEL_NAME           # e.g. llama3-8b-8192
CONVEX_DEPLOYMENT
NEXT_PUBLIC_CONVEX_URL
```

---

## 2.1 Environment Setup Guide

This section provides step-by-step instructions for setting up the development environment.

### Step 1: Clone and Install Dependencies

```bash
git clone <repo-url>
cd invoisar
npm install
```

### Step 2: Configure Clerk

1. Create a Clerk account at clerk.com
2. Create a new application
3. Configure OAuth providers (Google at minimum)
4. Add the following redirect URLs:
   - `http://localhost:3000` (development)
   - Your production domain (when deployed)
5. Create a user with the `platform_admin` role by adding a custom claim:
   - Go to Clerk Dashboard → Users → Select user
   - Add metadata: `{ "publicMetadata": { "role": "platform_admin" } }`

### Step 3: Configure Resend

1. Create a Resend account at resend.com
2. Verify your sending domain (or use Resend's test domain `resend.dev` for development)
3. Copy your API key

### Step 4: Configure Groq

1. Create a Groq account at groq.com
2. Copy your API key
3. Choose a model (recommended: `llama3-8b-8192`)

### Step 5: Set Up Convex

1. Run `npx convex dev` to start the local Convex server
2. This will create a `convex/` directory and prompt for authentication
3. Copy the deployment URL to your env variables

### Step 6: Create .env.local

```env
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=re_...
GROQ_API_KEY=gsk_...
GROQ_MODEL_NAME=llama3-8b-8192
NEXT_PUBLIC_CONVEX_URL=http://localhost:3000
```

### Step 7: Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to verify the setup.

---

## 4.1 Clerk Webhook Handling

When a new user signs up via Clerk, the system must automatically create a user record in Convex. This is handled via Clerk webhooks.

### Webhook Endpoint

Create a Next.js API route at `/api/webhooks/clerk` that listens for Clerk events.

### Required Events to Handle

| Event | Action |
|---|---|
| `user.created` | Create new user record in Convex with defaults |
| `user.updated` | Sync user metadata to Convex (e.g., display name changes) |
| `user.deleted` | Soft-delete or hard-delete the user in Convex (admin decision) |

### User Creation Defaults

When `user.created` fires, create a Convex user record with:

```typescript
{
  clerkUserId: event.data.id,
  email: event.data.email_addresses[0].email_address,
  displayName: event.data.first_name + " " + event.data.last_name,
  defaultCurrency: "USD",
  invoicePrefix: "INV",
  defaultPaymentTermsDays: 30,
  salesTaxEnabled: false,
  salesTaxRate: 0,
  vatEnabled: false,
  vatRate: 0,
  plan: "free",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### Webhook Security

- Verify the Clerk webhook signature using the webhook secret
- Store `CLERK_WEBHOOK_SECRET` in environment variables

### Invoice Number Sequence Init

On first user creation, also initialize the invoice sequence counter for the current year in a separate counter collection or within the user record.

---

## 3. User Roles

There are two distinct roles in the system:

**Regular User** — A business owner or freelancer who signs up, manages their own clients and invoices, and operates entirely within their own data scope. Users never see data belonging to other users.

**Platform Admin** — A privileged internal operator role assigned manually (not self-serve). Platform admins access a separate admin panel to manage users, review platform health, control feature flags, and handle support tickets. The admin panel is accessible at `/admin` and gated by a Clerk `role` claim of `platform_admin`.

---

## 4. Authentication

Authentication is handled entirely by Clerk. No custom auth logic is required.

### Sign Up
- Email/password and OAuth (Google at minimum) supported
- On first sign-in, Convex should create a `users` record seeded with sensible defaults (default currency: USD, invoice prefix: "INV", Net 30 payment terms)
- New users land on the Dashboard after sign-up

### Sign In
- Standard Clerk sign-in flow
- Redirect to Dashboard on success

### Session Management
- Clerk handles token refresh, session expiry, and device management
- All Convex queries and mutations must validate the Clerk JWT and extract `userId` — no unauthenticated data access is permitted

---

## 5. Dashboard

The Dashboard is the first screen a user sees after sign-in. It provides a single-glance summary of their business health.

### Metric Cards (top of page)

| Card | Description |
|---|---|
| Total Invoiced | Sum of all non-voided invoice totals |
| Paid | Sum of invoices with status `paid` |
| Pending | Sum of invoices with status `sent` |
| Overdue | Sum of invoices with status `overdue` |

### Invoices Needing Attention

A filtered list showing all invoices with status `overdue` or `sent` with a due date within the next 7 days. Each row shows: client name, invoice number, amount, due date, and status badge. Clicking a row navigates to the invoice detail view.

### Recent Activity

The last 10 invoices created or updated, sorted by most recent. Shows invoice number, client, amount, and status.

### Quick Actions

- "New Invoice" button in the top-right of the dashboard
- "Add Client" shortcut link

---

## 6. Client Management

### Client Record Fields

| Field | Required | Notes |
|---|---|---|
| Name | Yes | Full name or contact person |
| Email | Yes | Used for invoice delivery |
| Company | No | Displayed on invoice |
| Phone | No | Optional contact info |
| Address | No | Optional, can appear on invoice |
| Notes | No | Internal notes, not shown to client |

### Features

**Add Client** — Form accessible from the Clients page and as a shortcut from the navigation. On save, the client is immediately available for invoice selection.

**Edit Client** — All fields editable at any time. Changes to client details do not retroactively update sent invoices (invoices are snapshots at time of creation).

**Delete Client** — Permitted only if the client has no associated invoices. If invoices exist, the user must void/archive those invoices first, or the system should soft-delete the client (mark as archived) so invoice history is preserved.

**Client List View** — Paginated or virtualized list with search by name, company, or email. Each row shows the client name, company, number of invoices, and total billed.

**Client Detail View** — Shows all invoices associated with this client, total billed, total paid, and outstanding balance.

---

## 7. Invoice Management

### 7.1 Invoice Creation

Invoices can be created from the Invoices page or via the Dashboard quick action button.

#### Invoice Header Fields

| Field | Required | Notes |
|---|---|---|
| Client | Yes | Select from existing clients, or enter new client details inline (see 7.2) |
| Invoice Number | Auto-generated | Format: `{PREFIX}-{YEAR}-{SEQUENCE}` e.g. `INV-2026-0042`. Prefix is set in user settings. Sequence auto-increments per user per year. User can override the number manually before sending. |
| Issue Date | Yes | Defaults to today |
| Due Date | Yes | Defaults to Issue Date + user's default payment terms (e.g. Net 30) |
| Currency | Yes | Defaults to user's default currency from settings. User can change per invoice. |
| Notes | No | Shown on the invoice and in the email. Ideal for bank details, payment instructions, or thank-you notes. Payment instructions from settings auto-populate here but are editable. |

#### Line Items

Each line item has:

| Field | Notes |
|---|---|
| Description | Free text |
| Quantity | Numeric, supports decimals |
| Unit Rate | Numeric, in selected currency |
| Amount | Calculated: Quantity × Rate (read-only) |

Users can add unlimited line items and reorder them via drag-and-drop.

#### Totals Calculation

```
Subtotal = sum of all line item amounts
Sales Tax Amount = Subtotal × (Sales Tax % / 100)   [if enabled for this invoice]
VAT Amount = Subtotal × (VAT % / 100)               [if enabled for this invoice]
Total = Subtotal + Sales Tax Amount + VAT Amount
```

Tax rates are set in user settings. On the invoice creation form, the user sees toggles to enable/disable Sales Tax and VAT independently for that specific invoice. The tax percentages themselves come from settings and are not editable per invoice (to keep it simple).

#### Invoice Templates (Line Item Presets)

Users can save a set of line items as a named template (e.g. "Monthly Retainer", "Web Design Package"). When creating a new invoice, a "Load Template" dropdown lets them pick a template, which populates the line items section. The user can then edit, add, or remove line items before saving.

Templates are managed from the Settings page.

#### Draft Saving

Invoices are auto-saved as `draft` status while being created. The user must explicitly click "Send Invoice" to transition to `sent` status.

### 7.2 Sending to a New (Non-Existing) Client

When creating an invoice, if the user wants to send to someone not in their client list, they can toggle to "New Recipient" mode and enter:

- Name (required)
- Email (required)
- Company (optional)

After the invoice is sent successfully, the app displays a prompt: **"Save [Name] as a client?"** with a one-click confirm button. If confirmed, a client record is created using those details.

### 7.3 Invoice Editing Rules

| Status | Editable? |
|---|---|
| `draft` | Yes, fully editable |
| `sent` | No. Invoice is locked. |
| `overdue` | No. Invoice is locked. |
| `paid` | No. Invoice is locked. |
| `voided` | No. |

Once an invoice has been sent, it becomes immutable. This protects the integrity of the record and matches standard accounting expectations.

### 7.4 Void & Reissue

Any non-draft invoice can be voided. Voiding requires:

- A **void reason** (short text field, required)
- Confirmation modal

On void, the invoice status changes to `voided` and a `voidedAt` timestamp and `voidReason` are stored. Voided invoices remain visible in the invoice list with a "Voided" badge and are excluded from all financial totals.

After voiding, the user is offered a **"Reissue"** button on the voided invoice detail page. This opens a new invoice creation form pre-populated with all the same line items, client, currency, notes, and tax settings from the voided invoice. The user can edit before sending. A new invoice number is auto-generated. The new invoice contains a reference field: "Reissued from [original invoice number]."

### 7.5 Invoice List View

The Invoices page shows all invoices with:

- Search by invoice number or client name
- Filter by status (all, draft, sent, overdue, paid, voided)
- Sort by date, due date, amount, or status
- Each row: invoice number, client, issue date, due date, amount, status badge, quick actions (send, view, void)

### 7.6 Invoice Detail View

Full view of a single invoice showing all fields, line items, totals, tax breakdown, and payment history log. Actions available depend on current status:

- **Draft:** Edit, Send, Delete
- **Sent:** View, Send Reminder, Void, Record Payment
- **Overdue:** View, Send Reminder, Void, Record Payment
- **Paid:** View, Void
- **Voided:** View, Reissue

---

## 8. Email Delivery

### Send Invoice

Triggered by clicking "Send Invoice" on a draft or from the invoice detail view. This action:

1. Generates a PDF of the invoice (see PDF spec below)
2. Sends an email via Resend to the client's email address
3. Attaches the PDF to the email
4. Includes a link to the public invoice page (read-only browser view)
5. Transitions invoice status from `draft` to `sent`
6. Records a `sentAt` timestamp

### Send Reminder

Available on invoices with status `sent` or `overdue`. Sends a follow-up email to the client referencing the original invoice. The reminder email includes the same public invoice link and PDF attachment. A `lastReminderSentAt` timestamp is recorded.

### Email Templates

Both the invoice email and reminder email are HTML emails rendered with the user's branding (logo, brand color). They include:

- User's company name and logo (from settings)
- Invoice number, issue date, due date, and total
- Itemised summary (not full line items — keep the email clean)
- Link to view the full invoice in browser
- User's payment instructions (from settings)
- "Download PDF" is available on the public invoice page

#### Invoice Email Template (Copy)

**Subject:** Invoice #[INVOICE_NUMBER] from [COMPANY_NAME]

**Body:**

```
Hi [CLIENT_NAME],

Please find attached invoice #[INVOICE_NUMBER] for [TOTAL_AMOUNT].

Due Date: [DUE_DATE]
Invoice Date: [ISSUE_DATE]

You can view and pay this invoice online:
[PUBLIC_INVOICE_URL]

[ITEMISED_SUMMARY]
Subtotal: [SUBTOTAL]
[TAG_LINE] (if tax enabled): [TAX_AMOUNT]
Total: [TOTAL_AMOUNT]

[PAYMENT_INSTRUCTIONS]

Thank you for your business!

[COMPANY_NAME]
```

#### Reminder Email Template (Copy)

**Subject:** Reminder: Invoice #[INVOICE_NUMBER] from [COMPANY_NAME] (Due: [DUE_DATE])

**Body:**

```
Hi [CLIENT_NAME],

This is a friendly reminder that invoice #[INVOICE_NUMBER] for [TOTAL_AMOUNT] is [due on/due since] [DUE_DATE].

Outstanding Balance: [OUTSTANDING_AMOUNT]

Please view and pay the invoice online:
[PUBLIC_INVOICE_URL]

If you've already sent payment, please ignore this reminder.

Thank you,
[COMPANY_NAME]
```

### PDF Specification

The PDF is generated server-side using `@react-pdf/renderer`. It reflects the user's branding (logo, brand color) and contains:

- User's logo and company name (header)
- User's address / contact info (from settings)
- Client's name, company, email, address (from client record at time of creation)
- Invoice number, issue date, due date
- Line items table (description, quantity, rate, amount)
- Subtotal, tax lines (if enabled), total
- Notes / payment instructions
- "Reissued from [X]" note if applicable

### Email Bounce / Failure Handling

If Resend returns a delivery failure, the invoice status should not change to `sent`. The UI should display an error notification and the invoice remains in `draft` status so the user can retry. A `lastEmailError` field on the invoice record stores the error message for debugging.

---

## 9. Public Invoice Page

Each invoice has a publicly accessible read-only page at:

```
/i/[token]
```

The `token` is a securely generated, unguessable UUID (not the invoice ID or number). This URL is included in every invoice and reminder email.

### What the page shows

- Full invoice layout (matches PDF design, rendered in HTML)
- User's branding (logo, brand color)
- Invoice status banner (e.g. "This invoice is overdue" or "This invoice has been paid")
- Download PDF button (triggers PDF generation on demand)

### What the page does NOT include

- No interactivity beyond PDF download
- No "Mark as Paid" button (payment is recorded by the sender only)
- No login required

### Security

The token must be sufficiently random (UUID v4 minimum) so that invoice URLs cannot be guessed or enumerated. No authentication is required to view the page, but the token acts as the access credential.

---

## 10. Payment Tracking

### Recording a Payment

From the invoice detail view (on `sent` or `overdue` invoices), the user can click "Record Payment." A modal collects:

| Field | Required | Notes |
|---|---|---|
| Amount | Yes | Can be partial (less than outstanding balance) |
| Date Received | Yes | Defaults to today |
| Payment Method | No | e.g. Bank Transfer, Cash, Card — free text or dropdown |
| Note | No | Internal note |

On save:

- A payment record is appended to the invoice's **payment history log**
- The `amountPaid` on the invoice is updated (sum of all payment records)
- If `amountPaid >= invoiceTotal`, the invoice status automatically transitions to `paid` and `paidAt` is recorded
- If `amountPaid < invoiceTotal`, the invoice status remains `sent` or `overdue` and shows "Partially Paid" as a sub-state indicator

### Payment History Log

Every invoice detail page shows a chronological log of all recorded payments:

```
Feb 3, 2026   $200.00   Bank Transfer   [Note if any]
Feb 20, 2026  $150.00   Card
```

Individual payment records cannot be deleted (to maintain audit integrity) but can be edited within 24 hours of creation.

### Overdue Detection

A Convex scheduled function (cron) runs daily at midnight UTC. It queries all invoices with status `sent` where `dueDate < today` and updates their status to `overdue`. Partially paid invoices follow the same rule — they become `overdue` based on due date regardless of partial payment status.

#### Cron Job Implementation

In `convex/scheduled.ts`:

```typescript
import { cronScheduler } from "./scheduler";

export const checkOverdueInvoices = cronScheduler(
  { cron: "0 0 * * *" }, // Run at midnight UTC daily
  async (ctx) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Query all sent invoices with dueDate < today
    const overdueInvoices = await ctx.db
      .query("invoices")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "sent"),
          q.lt(q.field("dueDate"), today.toISOString())
        )
      )
      .collect();

    // Update each to overdue
    for (const invoice of overdueInvoices) {
      await ctx.db.patch(invoice._id, {
        status: "overdue",
        updatedAt: new Date().toISOString(),
      });

      // Create notification for the user
      await ctx.db.insert("notifications", {
        userId: invoice.userId,
        type: "invoice_overdue",
        message: `Invoice ${invoice.invoiceNumber} for ${invoice.clientSnapshot?.name || "client"} is now overdue`,
        relatedEntityId: invoice._id,
        relatedEntityType: "invoice",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
);
```

Register this in `convex/scheduler.ts`:

```typescript
import { scheduleFunction } from "convex/server";
import { checkOverdueInvoices } from "./scheduled";

export const scheduler = scheduleFunction(
  "0 0 * * *", // Daily at midnight UTC
  checkOverdueInvoices
);
```

---

## 11. Analytics & AI Insights

### Analytics Page

The Analytics page has two tabs: **Overview** and **AI Insights**.

#### Overview Tab

Visualised metrics for the authenticated user:

- Revenue over time (bar or line chart, filterable by: last 30 days, last 90 days, last 12 months, all time)
- Invoice status breakdown (pie/donut chart: draft, sent, overdue, paid, voided)
- Top clients by total billed
- Average days to payment (from `sentAt` to `paidAt`)
- Monthly invoice count trend

#### AI Insights Tab

Uses the Groq API to analyse the user's invoice and payment data and return structured insights. Insights are generated on demand (user clicks "Generate Insights" or insights are refreshed when the user visits the tab after a set staleness period, e.g. 24 hours).

The AI model is configured via the `GROQ_MODEL_NAME` environment variable.

**Insight types the AI should produce:**

| Insight | Description |
|---|---|
| Flagged Payers | Clients with a pattern of paying late (e.g. avg payment > 14 days past due date) |
| Revenue Trend | Summary of whether revenue is growing, flat, or declining over last 3 months |
| Projected Revenue | Estimated next 30-day revenue based on historical patterns |
| Idle Clients | Clients not invoiced in 60+ days |
| Overdue Summary | Natural language summary of outstanding invoices and suggested next actions |
| Fastest Payers | Clients who consistently pay early or on time |

**Implementation notes:**

- User data is summarised (not raw records) before being sent to Groq to minimise token usage and protect sensitive details
- Insights are cached in Convex with a `generatedAt` timestamp
- The UI shows when insights were last generated and a "Refresh" button
- Insights are displayed as readable cards, not raw JSON

---

## 12. Notifications

### In-App Notifications

A notification bell icon in the top navigation bar. Clicking it opens a dropdown panel showing recent notifications. Unread count badge is shown on the bell.

**Triggers for in-app notifications:**

| Event | Notification |
|---|---|
| Invoice viewed via public URL | "[Client Name] viewed invoice [#]" |
| Invoice becomes overdue | "Invoice [#] for [Client] is now overdue" |
| Payment recorded | "Payment of [amount] recorded on invoice [#]" |
| Invoice marked as paid | "Invoice [#] has been fully paid" |
| Support ticket reply (admin replied) | "Support: Your ticket [#] received a reply" |

### Email Notifications (to the invoice sender)

Users can control which email notifications they receive from the Notifications section in Settings.

**Available toggles:**

| Notification | Default |
|---|---|
| Invoice viewed by client | Off |
| Invoice becomes overdue | On |
| Reminder: invoices due in 3 days | On |
| Invoice fully paid | On |

Email notifications are sent via Resend from the platform's own sending domain (not the user's).

---

## 13. User Settings

Accessible from the user menu or a "Settings" link in the navigation. Settings are organised into tabs.

### Tab 1: Profile

- Display name
- Email (read-only, managed by Clerk)
- Profile picture (managed by Clerk)

### Tab 2: Business

- Company name (appears on invoice and emails)
- Company logo upload (PNG or JPG, max 2MB, stored in Convex file storage)
- Company address (multi-line, appears on invoice)
- Phone number
- Website URL

### Tab 3: Invoice Defaults

| Setting | Description |
|---|---|
| Invoice number prefix | e.g. "INV", "2026", "ACME" — alphanumeric, max 10 chars |
| Default currency | Dropdown of ISO currency codes (USD, GBP, EUR, etc.) |
| Default payment terms | Net 7, Net 14, Net 30, Net 60, Custom (days input) |
| Payment instructions | Text area — appears in invoice notes section and email footer. E.g. bank details, PayPal link, etc. |

### Tab 4: Tax Settings

| Setting | Description |
|---|---|
| Sales Tax | Toggle to enable globally. Percentage input (e.g. 8.5%). When enabled, Sales Tax toggle appears on each new invoice. |
| VAT | Toggle to enable globally. Percentage input (e.g. 20%). When enabled, VAT toggle appears on each new invoice. |

Tax rates apply globally. Users cannot set different tax rates per invoice — they can only toggle whether each tax type applies to a given invoice.

### Tab 5: Branding

| Setting | Description |
|---|---|
| Brand color | Color picker — used in PDF invoice header and HTML email template |

Branding settings affect only PDF output and email templates, not the app UI itself.

### Tab 6: Invoice Templates (Line Item Presets)

A list of saved line item templates. Each template has:

- Template name
- One or more line items (description, quantity, rate)

Users can create, edit, and delete templates. On the invoice creation form, a "Load Template" button populates the line items from the selected template.

### Tab 7: Notifications

Notification email toggles as described in Section 12.

---

## 14. Platform Admin

Accessible at `/admin`. Requires Clerk role `platform_admin`. This section is entirely separate from the regular user-facing app.

### 14.1 Admin Dashboard

Summary metrics:

- Total registered users
- Active users (logged in within last 30 days)
- Total invoices sent (platform-wide, last 30 days and all time)
- Total emails delivered via Resend
- Open support tickets count
- New sign-ups in last 7 days (sparkline chart)

### 14.2 User Management

A searchable, filterable table of all registered users showing:

- Name, email, sign-up date, plan, last active, account status

**Actions per user:**

| Action | Description |
|---|---|
| View | Opens a read-only profile showing their settings, invoice count, client count, plan |
| Impersonate | Admin can view the app as that user (read-only, no mutations) — useful for support |
| Suspend | Immediately prevents the user from logging in. Invoice public pages remain accessible. |
| Unsuspend | Re-enables access |
| Delete | Permanently removes user and all their data. Requires confirmation with typed confirmation string. |
| Change Plan | Override the user's plan (Free / Pro) |

### 14.3 Support Inbox

Users can submit support requests from within the app (a "Help & Support" link in the navigation). The support experience functions like a chat/ticket system.

**User side:**

- "New Request" form with: subject, message, optional screenshot upload
- A list of their submitted tickets showing status (Open, In Progress, Resolved)
- Each ticket opens into a chat thread view where the user can see admin replies and send follow-up messages

**Admin side (in `/admin/support`):**

- An inbox view of all tickets, sorted by most recent activity
- Filter by status: All, Open, In Progress, Resolved
- Each ticket opens into a threaded chat interface showing the full conversation
- Admin can type replies, change ticket status, and assign a priority (Low, Normal, High, Urgent)
- Unread/unanswered tickets are highlighted
- When an admin replies, the user receives an in-app notification and an email notification

### 14.4 Feature Flags

A table of toggleable features that can be turned on/off globally or overridden per user.

**Suggested flags:**

| Flag | Description |
|---|---|
| `ai_insights_enabled` | Enable/disable the AI Insights tab globally |
| `email_notifications_enabled` | Kill switch for all outbound notification emails |
| `invoice_view_tracking` | Enable/disable tracking of public invoice page views |
| `maintenance_mode` | Shows a maintenance banner to all users |

Feature flags are stored in Convex and checked at runtime — no redeploy required to toggle them.

### 14.5 Plan Management

Define and manage the Free and Pro plan limits. Settings adjustable by admin:

| Limit | Free Default | Pro Default |
|---|---|---|
| Max clients | 5 | Unlimited (999999) |
| Max invoices per month | 10 | Unlimited |
| Custom branding (logo, color) | Off | On |
| AI Insights | Off | On |
| Invoice templates | Off | On |
| Email reminders | Off | On |

When a user hits a Free plan limit, a contextual upgrade prompt is shown. The admin panel allows changing these default values without code changes.

### 14.6 System Announcements

Admin can compose and publish a banner message visible to all users in the app. The banner supports:

- Message text
- Severity level (info, warning, critical) — affects banner colour
- Expiry date/time (banner auto-hides after this)
- Dismiss option (users can dismiss info/warning banners)

### 14.7 Audit Log

A chronological, read-only log of significant platform-level events:

- User sign-ups and deletions
- Admin actions (suspension, impersonation, plan changes)
- Feature flag changes
- System announcement publishes
- Support ticket status changes

Each log entry shows: timestamp, actor (admin name or system), action, and affected entity.

---

## 15. Pricing Plans

### Free Plan

| Feature | Limit |
|---|---|
| Clients | Up to 5 |
| Invoices per month | Up to 10 |
| Invoice sending (email) | Included |
| Public invoice page | Included |
| Payment tracking | Included |
| PDF generation | Included |
| Custom branding (logo, color) | Not included |
| AI Insights | Not included |
| Invoice templates | Not included |
| Email reminders | Not included |

### Pro Plan

All Free features, plus:

- Unlimited clients
- Unlimited invoices
- Custom branding (logo, brand color on PDF and emails)
- AI Insights
- Invoice templates (line item presets)
- Email reminders
- Priority support

Plan limits are stored in Convex and managed by the Platform Admin (Section 14.5). Exact pricing amounts are set by the Platform Admin and are not hard-coded in the application.

---

## 16. Security Requirements

### Data Isolation

Every Convex query and mutation must filter by the authenticated user's `userId` obtained from the Clerk JWT. No cross-user data access is possible. This must be enforced at the query level, not just the UI level.

### Public Invoice Token

The public invoice URL token (`/i/[token]`) must be a UUID v4 (or cryptographically equivalent random string). It must not be the invoice ID, invoice number, or any sequential or guessable value. The token is generated at invoice creation and stored on the invoice record.

### API Keys

All third-party API keys (Resend, Groq) must only be used server-side (Convex functions or Next.js server actions/API routes). Keys must never be exposed to the client bundle.

### Admin Route Protection

The `/admin` route and all sub-routes must check for the `platform_admin` Clerk role on every request. A missing or incorrect role returns a 403 and redirects to the user dashboard.

### Suspended Users

Suspended users must be blocked at the Clerk session level (using Clerk's ban functionality) so that suspension takes effect immediately without relying on application-level checks alone.

### Input Validation

All user inputs — invoice fields, client fields, settings — must be validated on the server (Convex mutations) in addition to client-side validation. Reject unexpected data types, overly long strings, and malformed values.

### File Uploads (Logo)

Logo uploads must be validated for file type (PNG, JPG only) and file size (max 2MB) before storage. Files are stored in Convex file storage and served via a Convex-generated URL. Uploaded files are not executable and are never served from the application domain directly.

---

## 17. Data Models

> These are logical models. Exact Convex schema syntax will be determined during implementation.

### users

```
_id, clerkUserId, email, displayName, companyName, companyLogo (fileId),
companyAddress, phone, website, invoicePrefix, defaultCurrency,
defaultPaymentTermsDays, paymentInstructions, brandColor,
salesTaxEnabled, salesTaxRate, vatEnabled, vatRate,
plan (free|pro), planOverriddenByAdmin,
createdAt, updatedAt
```

### clients

```
_id, userId, name, email, company, phone, address, notes,
isArchived, createdAt, updatedAt
```

### invoices

```
_id, userId, invoiceNumber, clientId,
clientSnapshot (name, email, company, address — snapshot at send time),
status (draft|sent|overdue|paid|voided),
issueDate, dueDate, currency,
lineItems [ { description, quantity, rate, amount } ],
subtotal, salesTaxEnabled, salesTaxRate, salesTaxAmount,
vatEnabled, vatRate, vatAmount, total,
notes, paymentInstructions,
publicToken (UUID),
amountPaid, paidAt, sentAt, lastReminderSentAt,
isReissue, reissuedFromInvoiceId,
voidedAt, voidReason,
lastEmailError,
createdAt, updatedAt
```

### payments

```
_id, invoiceId, userId, amount, dateReceived,
paymentMethod, note, createdAt
```

### invoiceTemplates

```
_id, userId, name,
lineItems [ { description, quantity, rate } ],
createdAt, updatedAt
```

### notifications

```
_id, userId, type, message, isRead, relatedEntityId,
relatedEntityType, createdAt
```

### supportTickets

```
_id, userId, subject, status (open|in_progress|resolved),
priority (low|normal|high|urgent), createdAt, updatedAt
```

### supportMessages

```
_id, ticketId, authorId, authorRole (user|admin),
message, attachmentFileId, createdAt
```

### featureFlags

```
_id, flagKey, isEnabled, description, updatedAt, updatedByAdminId
```

### planLimits

```
_id, plan (free|pro), maxClients, maxInvoicesPerMonth,
customBrandingEnabled, aiInsightsEnabled,
templatesEnabled, remindersEnabled, updatedAt
```

### auditLog

```
_id, actorId, actorRole, action, entityType, entityId,
metadata (JSON), createdAt
```

### announcements

```
_id, message, severity (info|warning|critical),
expiresAt, isDismissable, isActive, createdByAdminId, createdAt
```

### aiInsightsCache

```
_id, userId, insights (JSON), generatedAt
```

---

## 17.1 Convex Schema (Implementation Reference)

> This section provides the actual Convex schema syntax to speed up implementation.

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companyLogo: v.optional(v.id("_storage")),
    companyAddress: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    invoicePrefix: v.string(),
    defaultCurrency: v.string(),
    defaultPaymentTermsDays: v.number(),
    paymentInstructions: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    salesTaxEnabled: v.boolean(),
    salesTaxRate: v.number(),
    vatEnabled: v.boolean(),
    vatRate: v.number(),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
    planOverriddenByAdmin: v.optional(v.boolean()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_email", ["email"]),

  clients: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_email", ["userId", "email"]),

  invoices: defineTable({
    userId: v.id("users"),
    invoiceNumber: v.string(),
    clientId: v.optional(v.id("clients")),
    clientSnapshot: v.optional(
      v.object({
        name: v.string(),
        email: v.string(),
        company: v.optional(v.string()),
        address: v.optional(v.string()),
      })
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("overdue"),
      v.literal("paid"),
      v.literal("voided")
    ),
    issueDate: v.string(),
    dueDate: v.string(),
    currency: v.string(),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        rate: v.number(),
        amount: v.number(),
      })
    ),
    subtotal: v.number(),
    salesTaxEnabled: v.boolean(),
    salesTaxRate: v.number(),
    salesTaxAmount: v.number(),
    vatEnabled: v.boolean(),
    vatRate: v.number(),
    vatAmount: v.number(),
    total: v.number(),
    notes: v.optional(v.string()),
    paymentInstructions: v.optional(v.string()),
    publicToken: v.string(),
    amountPaid: v.optional(v.number()),
    paidAt: v.optional(v.string()),
    sentAt: v.optional(v.string()),
    lastReminderSentAt: v.optional(v.string()),
    isReissue: v.optional(v.boolean()),
    reissuedFromInvoiceId: v.optional(v.id("invoices")),
    voidedAt: v.optional(v.string()),
    voidReason: v.optional(v.string()),
    lastEmailError: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_public_token", ["publicToken"])
    .index("by_client", ["clientId"]),

  payments: defineTable({
    invoiceId: v.id("invoices"),
    userId: v.id("users"),
    amount: v.number(),
    dateReceived: v.string(),
    paymentMethod: v.optional(v.string()),
    note: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_invoice", ["invoiceId"])
    .index("by_user", ["userId"]),

  invoiceTemplates: defineTable({
    userId: v.id("users"),
    name: v.string(),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        rate: v.number(),
      })
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    relatedEntityId: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  supportTickets: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved")),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  supportMessages: defineTable({
    ticketId: v.id("supportTickets"),
    authorId: v.string(), // userId or adminId
    authorRole: v.union(v.literal("user"), v.literal("admin")),
    message: v.string(),
    attachmentFileId: v.optional(v.id("_storage")),
    createdAt: v.string(),
  }).index("by_ticket", ["ticketId"]),

  featureFlags: defineTable({
    flagKey: v.string(),
    isEnabled: v.boolean(),
    description: v.optional(v.string()),
    updatedAt: v.string(),
    updatedByAdminId: v.optional(v.id("users")),
  }).index("by_key", ["flagKey"]),

  planLimits: defineTable({
    plan: v.union(v.literal("free"), v.literal("pro")),
    maxClients: v.number(),
    maxInvoicesPerMonth: v.number(),
    customBrandingEnabled: v.boolean(),
    aiInsightsEnabled: v.boolean(),
    templatesEnabled: v.boolean(),
    remindersEnabled: v.boolean(),
    updatedAt: v.string(),
  }).index("by_plan", ["plan"]),

  auditLog: defineTable({
    actorId: v.string(),
    actorRole: v.string(),
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.string(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_created", ["createdAt"]),

  announcements: defineTable({
    message: v.string(),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    expiresAt: v.optional(v.string()),
    isDismissable: v.boolean(),
    isActive: v.boolean(),
    createdByAdminId: v.optional(v.id("users")),
    createdAt: v.string(),
  }).index("by_active", ["isActive"]),

  aiInsightsCache: defineTable({
    userId: v.id("users"),
    insights: v.any(),
    generatedAt: v.string(),
  }).index("by_user", ["userId"]),

  // Counter for invoice number sequences
  invoiceCounters: defineTable({
    userId: v.id("users"),
    year: v.number(),
    sequence: v.number(),
  }).index("by_user_year", ["userId", "year"]),
});
```

---

## 18. Status Flows

### Invoice Status Flow

```
draft
  └─► sent         (user clicks "Send Invoice")
        └─► overdue   (automatic, cron job, when dueDate < today)
        └─► paid      (automatic, when amountPaid >= total)

sent ──► voided
overdue ──► voided
paid ──► voided

voided ──► [new invoice created via Reissue, starts at draft]
```

### Support Ticket Status Flow

```
open ──► in_progress ──► resolved
resolved ──► open  (if user replies to a resolved ticket)
```

---

## 19. Out of Scope (v1)

The following features are explicitly excluded from v1 to maintain focused scope. They are noted here so they can be designed in later without breaking changes:

- **Recurring invoices** — automatic repeat invoice generation on a schedule
- **Stripe / payment link integration** — allowing clients to pay online via the invoice
- **Client portal** — a login area for clients to view all their invoices
- **Multi-user teams** — multiple team members under one account
- **Credit notes** — formal accounting credit documents for voided invoices
- **Multi-currency reports** — analytics that normalise across currencies
- **Automated scheduled reminders** — auto-send reminders X days before/after due date without manual trigger
- **Xero / QuickBooks integration** — accounting software sync
- **White-labelling** — custom domain or fully unbranded experience

---

## 20. Landing Page Structure

The landing page serves as the marketing entry point for the product. It follows the design patterns defined in `design-system.md` but uses a distinct visual register (see Section 7 of the design system).

### Page Sections

#### 20.1 Navigation Bar

- Sticky, transparent on load, white on scroll
- Logo (left)
- Nav links: Features, Pricing, Help (center)
- Auth buttons: Log in (ghost), Get Started (primary black button) (right)

#### 20.2 Hero Section

- **Headline:** "Invoicing that gets out of your way" (or similar)
- **Subheadline:** "Create professional invoices in seconds. Send, track, and get paid — all from one clean interface."
- **CTAs:** "Start for free" (primary), "Watch demo" (secondary/outline)
- **Visual:** Floating UI mockup cards to the right showing the dashboard/invoice interface

#### 20.3 Social Proof Bar

- "Trusted by 10,000+ freelancers and small businesses" (or similar)
- Optional: logos of companies or publication features

#### 20.4 Feature Sections (3-4)

| Feature | Copy Direction |
|---|---|
| Create in seconds | "Add clients, create line items, done. Our intuitive interface lets you build professional invoices in under a minute." |
| Send beautifully | "Every invoice looks great. Custom branding, PDF generation, and email delivery — handled automatically." |
| Track payments | "Know where you stand. Automatic payment tracking, overdue detection, and detailed analytics." |
| AI insights | "Let AI do the numbers. Get actionable insights about your revenue, clients, and cash flow." |

Each feature alternates: text-left/image-right, then image-left/text-right.

#### 20.5 Pricing Section

- Two cards: Free and Pro
- Feature comparison list
- CTA buttons on each

#### 20.6 Footer

- Dark background (#1C1C1C)
- Logo + tagline
- Navigation columns: Product, Company, Legal
- Social links
- Copyright

---

## 21. Error State Definitions

All user-facing errors should follow consistent patterns defined here.

### 21.1 Network/Connection Errors

| Scenario | User Message | Action |
|---|---|---|
| API request failed | "Something went wrong. Please try again." | Show retry button |
| Convex connection lost | "Unable to connect. Checking connection..." | Auto-retry with exponential backoff |
| Session expired | Redirect to sign-in | Clear local state, preserve draft data |

### 21.2 Validation Errors

| Scenario | User Message | Location |
|---|---|---|
| Required field empty | "This field is required" | Below input |
| Invalid email format | "Please enter a valid email" | Below input |
| Amount exceeds limit | "Amount cannot exceed [X]" | Below input |
| Duplicate invoice number | "This invoice number already exists" | On invoice number field |

### 21.3 Permission/Limit Errors

| Scenario | User Message | Action |
|---|---|---|
| Free plan limit reached | "You've reached your [X] limit. Upgrade to Pro to continue." | Show upgrade prompt |
| Feature not available | "This feature is available on Pro plans" | Show upgrade prompt with feature details |

### 21.4 Email/Notification Errors

| Scenario | User Message | Action |
|---|---|---|
| Email bounced | "This email address appears invalid. Please check and try again." | Allow retry with corrected email |
| Resend API failure | "Failed to send email. Please try again in a moment." | Store error, allow retry |
| Email suppressed | "This recipient has unsubscribed or blocked emails" | Show in UI, allow edit |

### 21.5 Payment Recording Errors

| Scenario | User Message | Action |
|---|---|---|
| Partial payment > total | "Payment amount cannot exceed outstanding balance" | Show max allowed |
| Payment date in future | "Payment date cannot be in the future" | Restrict date picker |

### 21.6 Global Error Boundary

The app should have a global error boundary that catches unhandled exceptions:
- Display a friendly "Something went wrong" message
- Provide a "Reload" button
- Log the error to an error reporting service (e.g., Sentry) for debugging

---

## 22. API & Query-Mutation Structure

This section maps the application features to Convex queries and mutations.

### 22.1 Query Structure

All queries follow the pattern: `ctx.db.query("<collection>").filter(...).collect()`

| Feature | Query Name | Returns |
|---|---|---|
| Dashboard metrics | `getDashboardMetrics(userId)` | { totalInvoiced, paid, pending, overdue } |
| Invoices needing attention | `getInvoicesNeedingAttention(userId)` | Invoice[] (sent/overdue, due within 7 days) |
| Recent activity | `getRecentInvoices(userId)` | Invoice[] (last 10) |
| Client list | `getClients(userId)` | Client[] |
| Client detail | `getClientWithInvoices(clientId)` | Client + invoices |
| Invoice list | `getInvoices(userId, filter?)` | Invoice[] |
| Invoice detail | `getInvoice(invoiceId)` | Invoice + payments |
| Public invoice | `getInvoiceByToken(token)` | Invoice (public fields only) |
| User settings | `getUserSettings(userId)` | User settings object |
| Invoice templates | `getTemplates(userId)` | Template[] |
| Notifications | `getNotifications(userId)` | Notification[] |
| AI insights | `getAiInsights(userId)` | Cached insights or trigger generation |
| Admin: all users | `adminGetAllUsers()` | User[] (admin only) |
| Admin: support tickets | `adminGetTickets(filter?)` | Ticket[] |
| Admin: feature flags | `adminGetFeatureFlags()` | FeatureFlag[] |

### 22.2 Mutation Structure

| Feature | Mutation Name | Parameters |
|---|---|---|
| Create client | `createClient(userId, data)` | { name, email, company?, phone?, address?, notes? } |
| Update client | `updateClient(clientId, data)` | Partial client fields |
| Delete client | `deleteClient(clientId)` | — |
| Create invoice | `createInvoice(userId, data)` | { clientId, lineItems, dueDate, currency, notes?, ... } |
| Update invoice | `updateInvoice(invoiceId, data)` | Partial invoice fields (draft only) |
| Send invoice | `sendInvoice(invoiceId)` | — (generates PDF, sends email, transitions status) |
| Send reminder | `sendReminder(invoiceId)` | — |
| Void invoice | `voidInvoice(invoiceId, reason)` | { voidReason } |
| Reissue invoice | `reissueInvoice(originalInvoiceId)` | — (creates new draft with copied data) |
| Record payment | `recordPayment(invoiceId, data)` | { amount, dateReceived, paymentMethod?, note? } |
| Update payment | `updatePayment(paymentId, data)` | Partial payment fields (within 24h) |
| Update user settings | `updateUserSettings(userId, data)` | Settings object |
| Upload logo | `uploadLogo(userId, file)` | File storage reference |
| Create support ticket | `createTicket(userId, data)` | { subject, message, attachment? } |
| Reply to ticket | `replyToTicket(ticketId, message)` | { message, attachment? } |
| Mark notification read | `markNotificationRead(notificationId)` | — |
| Admin: update user | `adminUpdateUser(userId, data)` | { plan?, suspended?, ... } |
| Admin: delete user | `adminDeleteUser(userId)` | — |
| Admin: update feature flag | `adminUpdateFeatureFlag(flagKey, isEnabled)` | — |
| Admin: create announcement | `adminCreateAnnouncement(data)` | { message, severity, expiresAt, isDismissable } |

### 22.3 Real-time Subscriptions

Key views should subscribe to real-time updates:

| View | Subscription |
|---|---|
| Invoice list | Subscribe to `invoices` where `userId == currentUser` |
| Notifications | Subscribe to `notifications` where `userId == currentUser` and `isRead == false` |
| Public invoice | Subscribe to `invoices` where `publicToken == token` |

---

*End of Document*

**Version History**

| Version | Date | Notes |
|---|---|---|
| 1.0 | March 2026 | Initial PRD — all features agreed and scoped |

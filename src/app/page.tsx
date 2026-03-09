import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  uiPrimaryButtonClass,
  uiSecondaryButtonClass,
} from "@/components/ui/classes";

const proofPoints = [
  { label: "Invoices sent", value: "12.4k" },
  { label: "Avg. paid faster", value: "3.2x" },
  { label: "Teams onboarded", value: "430+" },
];

const capabilities = [
  "Reusable client records and line items",
  "PDF-ready invoices with branded delivery",
  "Simple payment and overdue visibility",
];

export default async function LandingPage() {
  const { userId } = await auth();
  const isAuthenticated = Boolean(userId);
  const primaryHref = isAuthenticated ? "/dashboard" : "/sign-up";
  const primaryLabel = isAuthenticated ? "Open dashboard" : "Start free";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-6 pt-5 sm:px-8 lg:px-10">
        <header className="surface-card flex items-center justify-between rounded-full px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
              IV
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em]">Invoisar</p>
              <p className="text-xs text-[var(--muted)]">Invoice operations, clarified</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-subtle)] hover:text-foreground"
                >
                  Dashboard
                </Link>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
                  <UserButton />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--surface-subtle)] hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className={`${uiPrimaryButtonClass} rounded-full px-4 py-2 text-sm`}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-12 lg:py-10">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
              Built for freelancers and lean finance teams
            </div>

            <h1 className="font-display max-w-3xl text-[clamp(3.25rem,7vw,6.25rem)] leading-[0.92] tracking-[-0.05em] text-foreground">
              The calm way to send invoices and get paid.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Invoisar keeps client billing, invoice delivery, and payment follow-up in one clean
              workspace so you spend less time chasing admin and more time doing billable work.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className={`${uiPrimaryButtonClass} rounded-full px-6 py-3 text-sm hover:-translate-y-0.5`}
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={isAuthenticated ? "/dashboard/invoices/new" : "/sign-in"}
                className={`${uiSecondaryButtonClass} rounded-full px-6 py-3 text-sm`}
              >
                {isAuthenticated ? "Create invoice" : "See how it works"}
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {proofPoints.map((point) => (
                <div
                  key={point.label}
                  className="rounded-3xl border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-5 py-4 backdrop-blur-sm"
                >
                  <p className="font-mono-ui text-xl font-semibold tracking-[-0.03em]">
                    {point.value}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{point.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {capabilities.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[var(--muted)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="accent-ring relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f7f6f2_100%)] p-4 sm:p-5">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(13,148,136,0.16),transparent_68%)]" />

            <div className="relative rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-soft)]">
                    Invoice board
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                    March billing
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  84% paid
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[var(--surface-subtle)] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 text-[var(--accent)]" />
                    Drafts
                  </div>
                  <p className="mt-3 font-mono-ui text-2xl font-semibold">08</p>
                </div>
                <div className="rounded-2xl bg-[var(--surface-subtle)] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CreditCard className="h-4 w-4 text-[var(--accent)]" />
                    Paid
                  </div>
                  <p className="mt-3 font-mono-ui text-2xl font-semibold">$18.4k</p>
                </div>
                <div className="rounded-2xl bg-[var(--surface-subtle)] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
                    Overdue
                  </div>
                  <p className="mt-3 font-mono-ui text-2xl font-semibold">02</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <p className="text-sm font-semibold">INV-0241</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Northstar Studio</p>
                  </div>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                    Due in 3 days
                  </span>
                </div>

                <div className="space-y-3 py-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Brand strategy sprint</span>
                    <span className="font-mono-ui">$3,200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Invoice delivery</span>
                    <span className="font-mono-ui">Email + PDF</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Reminder flow</span>
                    <span className="font-mono-ui text-[var(--accent)]">Scheduled</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--muted)]">Collection health</span>
                    <span className="font-semibold text-foreground">Strong</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-[var(--surface-subtle)]">
                    <div className="h-2 w-[78%] rounded-full bg-[var(--accent)]" />
                  </div>
                </div>
              </div>
            </div>

            <p className="relative mt-4 px-2 text-sm text-[var(--muted)]">
              Signed in users can jump straight into their dashboard. New users can create an
              account and start sending invoices from the same workflow.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

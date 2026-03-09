"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Send,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  uiCardClass,
  uiDangerButtonClass,
  uiPrimaryButtonClass,
  uiSecondaryButtonClass,
} from "@/components/ui/classes";

const statusConfig = {
  draft: { icon: FileText, badge: "bg-gray-100 text-gray-700" },
  sent: { icon: Send, badge: "bg-blue-100 text-blue-700" },
  paid: { icon: CheckCircle2, badge: "bg-green-100 text-green-700" },
  overdue: { icon: AlertCircle, badge: "bg-red-100 text-red-700" },
  voided: { icon: AlertCircle, badge: "bg-yellow-100 text-yellow-800" },
} as const;

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const user = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkUserId: userId } : "skip",
  );
  const invoice = useQuery(api.invoices.getInvoiceById, {
    invoiceId: params.invoiceId as Id<"invoices">,
  });

  const deleteInvoice = useMutation(api.invoices.deleteInvoice);
  const markInvoiceAsPaid = useMutation(api.invoices.markInvoiceAsPaid);
  const voidInvoice = useMutation(api.invoices.voidInvoice);

  const publicInvoiceUrl =
    typeof window !== "undefined" && invoice
      ? `${window.location.origin}/invoice/${invoice.publicToken}`
      : null;

  if (invoice === null) {
    return <div className={`${uiCardClass} p-6 text-sm text-red-700`}>Invoice not found.</div>;
  }

  if (!invoice || !user) {
    return (
      <div className={`${uiCardClass} p-6 text-sm text-[var(--muted)]`}>
        Loading invoice...
      </div>
    );
  }

  if (invoice.userId !== user._id) {
    return <div className={`${uiCardClass} p-6 text-sm text-red-700`}>Invoice not found.</div>;
  }

  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;

  const handleSend = async () => {
    setError(null);
    setNotice(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice._id }),
      });
      const payload = (await response.json()) as {
        error?: string;
        delivery?: "mailto" | "resend";
        mailtoUrl?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to send invoice.");
      }

      if (payload.delivery === "mailto" && payload.mailtoUrl) {
        window.location.href = payload.mailtoUrl;
      }

      setNotice("Invoice sent.");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send invoice.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this draft invoice?");
    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsMutating(true);

    try {
      await deleteInvoice({ invoiceId: invoice._id });
      router.push("/dashboard/invoices");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete invoice.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleMarkPaid = async () => {
    setError(null);
    setNotice(null);
    setIsMutating(true);

    try {
      await markInvoiceAsPaid({ invoiceId: invoice._id });
      setNotice("Invoice marked as paid.");
    } catch (markPaidError) {
      setError(
        markPaidError instanceof Error
          ? markPaidError.message
          : "Unable to record payment.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleVoid = async () => {
    const reason = window.prompt("Why are you voiding this invoice?");
    if (!reason?.trim()) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsMutating(true);

    try {
      await voidInvoice({ invoiceId: invoice._id, reason: reason.trim() });
      setNotice("Invoice voided.");
    } catch (voidError) {
      setError(voidError instanceof Error ? voidError.message : "Unable to void invoice.");
    } finally {
      setIsMutating(false);
    }
  };

  const copyPublicLink = async () => {
    if (!publicInvoiceUrl) {
      return;
    }

    await navigator.clipboard.writeText(publicInvoiceUrl);
    setNotice("Public invoice link copied.");
  };

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}
      {invoice.lastEmailError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Last delivery error: {invoice.lastEmailError}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="app-page-heading">{invoice.invoiceNumber}</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold capitalize ${status.badge}`}>
              <StatusIcon className="h-4 w-4" />
              {invoice.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            For {invoice.clientSnapshot?.name || "Unknown client"} · Due{" "}
            {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {invoice.status === "draft" ? (
            <>
              <Link
                href={`/dashboard/invoices/new?draftId=${invoice._id}`}
                className={uiSecondaryButtonClass}
              >
                Edit draft
              </Link>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isSending}
                className={uiPrimaryButtonClass}
              >
                <Send className="h-4 w-4" />
                {isSending ? "Sending..." : "Send invoice"}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isMutating}
                className={uiDangerButtonClass}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          ) : null}

          {(invoice.status === "sent" || invoice.status === "overdue") ? (
            <>
              <button
                type="button"
                onClick={() => void handleMarkPaid()}
                disabled={isMutating}
                className={uiPrimaryButtonClass}
              >
                Mark paid
              </button>
              <button
                type="button"
                onClick={() => void handleVoid()}
                disabled={isMutating}
                className={uiSecondaryButtonClass}
              >
                Void invoice
              </button>
            </>
          ) : null}

          {invoice.status === "paid" ? (
            <button
              type="button"
              onClick={() => void handleVoid()}
              disabled={isMutating}
              className={uiSecondaryButtonClass}
            >
              Void invoice
            </button>
          ) : null}

          {invoice.status === "voided" ? (
            <Link
              href={`/dashboard/invoices/new?copyFrom=${invoice._id}`}
              className={uiPrimaryButtonClass}
            >
              Reissue invoice
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className={`${uiCardClass} overflow-hidden`}>
          <div className="border-b border-[var(--border)] px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">Invoice summary</h2>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">
                Bill to
              </p>
              <p className="mt-3 font-semibold text-gray-900">{invoice.clientSnapshot?.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{invoice.clientSnapshot?.email}</p>
              {invoice.clientSnapshot?.company ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {invoice.clientSnapshot.company}
                </p>
              ) : null}
              {invoice.clientSnapshot?.address ? (
                <p className="mt-1 whitespace-pre-line text-sm text-[var(--muted)]">
                  {invoice.clientSnapshot.address}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">
                From
              </p>
              <p className="mt-3 font-semibold text-gray-900">
                {user.companyName || user.displayName || user.email}
              </p>
              {user.companyAddress ? (
                <p className="mt-1 whitespace-pre-line text-sm text-[var(--muted)]">
                  {user.companyAddress}
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-[var(--border)] px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-[var(--muted)]">Issue date</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Due date</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">Amount due</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {invoice.currency} {invoice.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-subtle)] text-left text-[var(--muted)]">
                <tr>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Qty</th>
                  <th className="px-6 py-3 font-medium">Rate</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoice.lineItems.map((item, index) => (
                  <tr key={`${item.description}-${index}`}>
                    <td className="px-6 py-4 text-gray-900">{item.description}</td>
                    <td className="px-6 py-4 text-[var(--muted)]">{item.quantity}</td>
                    <td className="px-6 py-4 text-[var(--muted)]">
                      {invoice.currency} {item.rate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {invoice.currency} {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${uiCardClass} p-6`}>
            <h2 className="text-lg font-semibold text-gray-900">Totals</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Subtotal</span>
                <span>
                  {invoice.currency} {invoice.subtotal.toFixed(2)}
                </span>
              </div>
              {invoice.salesTaxEnabled ? (
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Sales tax ({invoice.salesTaxRate}%)</span>
                  <span>
                    {invoice.currency} {invoice.salesTaxAmount.toFixed(2)}
                  </span>
                </div>
              ) : null}
              {invoice.vatEnabled ? (
                <div className="flex justify-between text-[var(--muted)]">
                  <span>VAT ({invoice.vatRate}%)</span>
                  <span>
                    {invoice.currency} {invoice.vatAmount.toFixed(2)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-[var(--border)] pt-3 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>
                  {invoice.currency} {invoice.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Amount paid</span>
                <span>
                  {invoice.currency} {invoice.amountPaid.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className={`${uiCardClass} p-6`}>
            <h2 className="text-lg font-semibold text-gray-900">Share</h2>
            <div className="mt-4 flex flex-col gap-3">
              {publicInvoiceUrl ? (
                <>
                  <button type="button" className={uiSecondaryButtonClass} onClick={() => void copyPublicLink()}>
                    <Copy className="h-4 w-4" />
                    Copy public link
                  </button>
                  <a
                    href={publicInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={uiSecondaryButtonClass}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open public invoice
                  </a>
                  <a
                    href={`/api/invoices/${invoice._id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className={uiPrimaryButtonClass}
                  >
                    View PDF
                  </a>
                </>
              ) : null}
            </div>
          </div>

          {invoice.notes ? (
            <div className={`${uiCardClass} p-6`}>
              <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
              <p className="mt-3 whitespace-pre-line text-sm text-[var(--muted)]">
                {invoice.notes}
              </p>
            </div>
          ) : null}

          {invoice.paymentInstructions ? (
            <div className={`${uiCardClass} p-6`}>
              <h2 className="text-lg font-semibold text-gray-900">Payment instructions</h2>
              <p className="mt-3 whitespace-pre-line text-sm text-[var(--muted)]">
                {invoice.paymentInstructions}
              </p>
            </div>
          ) : null}

          {invoice.voidReason ? (
            <div className={`${uiCardClass} p-6`}>
              <h2 className="text-lg font-semibold text-gray-900">Void reason</h2>
              <p className="mt-3 text-sm text-[var(--muted)]">{invoice.voidReason}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className={`${uiCardClass} overflow-hidden`}>
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">PDF preview</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            This renders the invoice as a PDF inside the app.
          </p>
        </div>
        <iframe
          title={`PDF preview for ${invoice.invoiceNumber}`}
          src={`/api/invoices/${invoice._id}/pdf`}
          className="h-[780px] w-full bg-white"
        />
      </div>
    </div>
  );
}

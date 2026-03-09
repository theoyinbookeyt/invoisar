import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  uiCardClass,
  uiInputClass,
  uiPrimaryButtonClass,
  uiSecondaryButtonClass,
  uiSelectClass,
} from "@/components/ui/classes";

async function getInvoices(userId: string) {
  const user = await fetchQuery(api.users.getUserByClerkId, { clerkUserId: userId });
  if (!user) {
    return [];
  }

  return fetchQuery(api.invoices.listInvoicesByUser, { userId: user._id });
}

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  voided: "bg-yellow-100 text-yellow-800",
} as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const authInfo = await auth();
  if (!authInfo?.userId) {
    return null;
  }

  const [{ q = "", status = "all" }, invoices] = await Promise.all([
    searchParams,
    getInvoices(authInfo.userId),
  ]);

  const query = q.trim().toLowerCase();
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesQuery =
      !query ||
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.clientSnapshot?.name.toLowerCase().includes(query);
    const matchesStatus = status === "all" || invoice.status === status;

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-page-heading">Invoices</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Search by client or invoice number and filter by status.
          </p>
        </div>
        <Link href="/dashboard/invoices/new" className={uiPrimaryButtonClass}>
          <Plus className="h-5 w-5" />
          Create invoice
        </Link>
      </div>

      <div className={`${uiCardClass} overflow-hidden`}>
        <form className="grid gap-3 border-b border-[var(--border)] p-4 md:grid-cols-[minmax(0,1fr)_220px_140px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-soft)]" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search invoices or clients"
              className={`${uiInputClass} pl-11`}
            />
          </div>
          <select name="status" defaultValue={status} className={uiSelectClass}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="voided">Voided</option>
          </select>
          <button className={uiSecondaryButtonClass} type="submit">
            Apply
          </button>
        </form>

        {filteredInvoices.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--surface-subtle)] text-left text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Issue date</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="transition hover:bg-[var(--surface-subtle)]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/invoices/${invoice._id}`}
                        className="font-semibold text-[var(--accent)]"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {invoice.clientSnapshot?.name || "No client"}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {invoice.currency}{" "}
                      {invoice.total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColors[invoice.status]}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[var(--muted)]">
            No invoices matched the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

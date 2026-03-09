"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ClientForm, { type ClientFormValues } from "@/components/clients/ClientForm";
import { uiCardClass, uiSecondaryButtonClass } from "@/components/ui/classes";

function currencyTotal(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams<{ clientId: string }>();
  const { userId } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkUserId: userId } : "skip",
  );
  const client = useQuery(api.clients.getClientById, {
    clientId: params.clientId as Id<"clients">,
  });
  const invoices = useQuery(
    api.invoices.listInvoicesByUser,
    user?._id ? { userId: user._id } : "skip",
  );

  const updateClient = useMutation(api.clients.updateClient);
  const deleteClient = useMutation(api.clients.deleteClient);

  if (client === null) {
    return (
        <div className={`${uiCardClass} p-6 text-sm text-red-700`}>
          Client not found.
        </div>
    );
  }

  if (!client || !invoices) {
    return (
      <div className={`${uiCardClass} p-6 text-sm text-[var(--muted)]`}>
        Loading client...
      </div>
    );
  }

  if (user && client.userId !== user._id) {
    return <div className={`${uiCardClass} p-6 text-sm text-red-700`}>Client not found.</div>;
  }

  const relatedInvoices = invoices
    .filter((invoice) => invoice.clientId === client._id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const totalBilled = relatedInvoices
    .filter((invoice) => invoice.status !== "voided")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const totalPaid = relatedInvoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const outstanding = Math.max(totalBilled - totalPaid, 0);

  const handleSubmit = async (values: ClientFormValues) => {
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      await updateClient({
        clientId: client._id,
        updates: {
          name: values.name,
          email: values.email,
          company: values.company || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          notes: values.notes || undefined,
        },
      });
      setNotice("Client details updated.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update client.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this client? Clients with existing invoices will be archived instead.",
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const result = await deleteClient({ clientId: client._id });
      router.push(
        result.archived
          ? "/dashboard/clients?notice=archived"
          : "/dashboard/clients?notice=deleted",
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete client.",
      );
    }
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <ClientForm
          heading={client.name}
          description={
            client.isArchived
              ? "This client is archived because invoice history is attached to it."
              : "Update the reusable details used in future invoice selections."
          }
          initialValues={{
            name: client.name,
            email: client.email,
            company: client.company || "",
            phone: client.phone || "",
            address: client.address || "",
            notes: client.notes || "",
          }}
          submitLabel="Save changes"
          busyLabel="Saving..."
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          deleteLabel={client.isArchived ? "Archive client" : "Delete client"}
        />

        <div className="space-y-4">
          <div className={`${uiCardClass} p-6`}>
            <h2 className="text-lg font-semibold text-gray-900">Client summary</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3">
                <p className="text-sm text-[var(--muted)]">Invoices</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {relatedInvoices.length}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3">
                <p className="text-sm text-[var(--muted)]">Total billed</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {currencyTotal(totalBilled, user?.defaultCurrency || "USD")}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--surface-subtle)] px-4 py-3">
                <p className="text-sm text-[var(--muted)]">Outstanding</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {currencyTotal(outstanding, user?.defaultCurrency || "USD")}
                </p>
              </div>
            </div>
          </div>

          <div className={`${uiCardClass} p-6`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Related invoices</h2>
              <Link href="/dashboard/invoices/new" className={uiSecondaryButtonClass}>
                New invoice
              </Link>
            </div>

            {relatedInvoices.length ? (
              <div className="mt-4 space-y-3">
                {relatedInvoices.map((invoice) => (
                  <Link
                    key={invoice._id}
                    href={`/dashboard/invoices/${invoice._id}`}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3 transition hover:bg-[var(--surface-subtle)]"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-[var(--muted)]">
                        Due {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {currencyTotal(invoice.total, invoice.currency)}
                      </p>
                      <p className="text-sm capitalize text-[var(--muted)]">{invoice.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                No invoices have been created for this client yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

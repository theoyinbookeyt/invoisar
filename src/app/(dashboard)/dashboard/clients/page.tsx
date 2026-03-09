import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { Building, Mail, Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  uiCardClass,
  uiInputClass,
  uiPrimaryButtonClass,
  uiSecondaryButtonClass,
} from "@/components/ui/classes";

async function getClients(userId: string) {
  const user = await fetchQuery(api.users.getUserByClerkId, { clerkUserId: userId });
  if (!user) {
    return [];
  }

  return fetchQuery(api.clients.listClientsByUser, {
    userId: user._id,
    includeArchived: true,
  });
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; notice?: string }>;
}) {
  const authInfo = await auth();
  if (!authInfo?.userId) {
    return null;
  }

  const [{ q = "", notice }, clients] = await Promise.all([
    searchParams,
    getClients(authInfo.userId),
  ]);

  const query = q.trim().toLowerCase();
  const filteredClients = clients.filter((client) => {
    if (!query) {
      return true;
    }

    return [client.name, client.email, client.company || ""].some((value) =>
      value.toLowerCase().includes(query),
    );
  });

  return (
    <div className="space-y-6">
      {notice === "deleted" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Client deleted.
        </div>
      ) : null}
      {notice === "archived" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Client archived because invoices are attached to that record.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-page-heading">Clients</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Search, edit, and reuse billing contacts across invoices.
          </p>
        </div>
        <Link href="/dashboard/clients/new" className={uiPrimaryButtonClass}>
          <Plus className="h-5 w-5" />
          Add client
        </Link>
      </div>

      <div className={`${uiCardClass} overflow-hidden`}>
        <form className="grid gap-3 border-b border-[var(--border)] p-4 md:grid-cols-[minmax(0,1fr)_140px]">
          <div className="relative">
            <label className="sr-only" htmlFor="client-search">
              Search clients
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-soft)]" />
            <input
              id="client-search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, email, or company"
              className={`${uiInputClass} pl-11`}
            />
          </div>
          <button className={uiSecondaryButtonClass} type="submit">
            Apply
          </button>
        </form>

        {filteredClients.length ? (
          <div className="divide-y divide-[var(--border)]">
            {filteredClients.map((client) => (
              <Link
                key={client._id}
                href={`/dashboard/clients/${client._id}`}
                className="flex flex-col gap-4 p-4 transition hover:bg-[var(--surface-subtle)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{client.name}</p>
                      {client.isArchived ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Archived
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                      {client.company ? (
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {client.company}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {client.email}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-medium text-[var(--accent)]">
                  View details
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-[var(--muted)]">No clients matched your search.</p>
            <Link href="/dashboard/clients/new" className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]">
              Create a client
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

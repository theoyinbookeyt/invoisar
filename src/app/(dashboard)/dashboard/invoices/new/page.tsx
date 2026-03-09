"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { Plus, Save, Send, Trash2, UserRound } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  uiActiveTabClass,
  uiCardClass,
  uiInputClass,
  uiInactiveTabClass,
  uiPrimaryButtonClass,
  uiSecondaryButtonClass,
  uiSectionTitleClass,
  uiSelectClass,
  uiTabGroupClass,
  uiTextareaClass,
} from "@/components/ui/classes";

type ClientMode = "existing" | "manual";

type LineItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

type ManualClientDetails = {
  name: string;
  email: string;
  company: string;
  phone: string;
  address: string;
};

type InvoiceFormData = {
  clientId?: Id<"clients">;
  issueDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  paymentInstructions: string;
  salesTaxEnabled: boolean;
  salesTaxRate: number;
  vatEnabled: boolean;
  vatRate: number;
};

type SaveClientModalState = {
  invoiceId: Id<"invoices">;
  values: ManualClientDetails & { notes: string };
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getFutureDate(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

function emptyManualClient(): ManualClientDetails {
  return {
    name: "",
    email: "",
    company: "",
    phone: "",
    address: "",
  };
}

function emptyInvoiceForm(): InvoiceFormData {
  return {
    clientId: undefined,
    issueDate: getToday(),
    dueDate: getFutureDate(30),
    currency: "USD",
    notes: "",
    paymentInstructions: "",
    salesTaxEnabled: false,
    salesTaxRate: 0,
    vatEnabled: false,
    vatRate: 0,
  };
}

function emptyLineItem(): LineItem {
  return {
    description: "",
    quantity: 1,
    rate: 0,
    amount: 0,
  };
}

function parseNumber(value: string | number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();

  const draftId = searchParams.get("draftId");
  const copyFromId = searchParams.get("copyFrom");
  const sourceInvoiceId = draftId || copyFromId;
  const isEditingDraft = Boolean(draftId);

  const user = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkUserId: userId } : "skip",
  );
  const clients = useQuery(
    api.clients.listClientsByUser,
    user?._id ? { userId: user._id } : "skip",
  );
  const sourceInvoice = useQuery(
    api.invoices.getInvoiceById,
    sourceInvoiceId ? { invoiceId: sourceInvoiceId as Id<"invoices"> } : "skip",
  );

  const createInvoice = useMutation(api.invoices.createInvoice);
  const updateInvoice = useMutation(api.invoices.updateInvoice);
  const createClient = useMutation(api.clients.createClient);
  const linkClientToInvoice = useMutation(api.invoices.linkClientToInvoice);

  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [formData, setFormData] = useState<InvoiceFormData>(emptyInvoiceForm());
  const [manualClient, setManualClient] = useState<ManualClientDetails>(emptyManualClient());
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveClientModal, setSaveClientModal] = useState<SaveClientModalState | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [hydratedSourceId, setHydratedSourceId] = useState<string | null>(null);
  const [appliedUserDefaults, setAppliedUserDefaults] = useState(false);

  useEffect(() => {
    if (!user || appliedUserDefaults || sourceInvoiceId) {
      return;
    }

    setFormData((current) => ({
      ...current,
      currency: user.defaultCurrency,
      dueDate: getFutureDate(user.defaultPaymentTermsDays),
      paymentInstructions: user.paymentInstructions || "",
      salesTaxEnabled: user.salesTaxEnabled,
      salesTaxRate: user.salesTaxRate,
      vatEnabled: user.vatEnabled,
      vatRate: user.vatRate,
    }));
    setAppliedUserDefaults(true);
  }, [appliedUserDefaults, sourceInvoiceId, user]);

  useEffect(() => {
    if (!sourceInvoice || !sourceInvoiceId || hydratedSourceId === sourceInvoiceId) {
      return;
    }

    setFormData({
      clientId: sourceInvoice.clientId,
      issueDate: isEditingDraft ? sourceInvoice.issueDate : getToday(),
      dueDate: isEditingDraft
        ? sourceInvoice.dueDate
        : user?.defaultPaymentTermsDays
          ? getFutureDate(user.defaultPaymentTermsDays)
          : sourceInvoice.dueDate,
      currency: sourceInvoice.currency,
      notes: sourceInvoice.notes || "",
      paymentInstructions: sourceInvoice.paymentInstructions || "",
      salesTaxEnabled: sourceInvoice.salesTaxEnabled,
      salesTaxRate: sourceInvoice.salesTaxRate,
      vatEnabled: sourceInvoice.vatEnabled,
      vatRate: sourceInvoice.vatRate,
    });
    setLineItems(
      sourceInvoice.lineItems.length
        ? sourceInvoice.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
          }))
        : [emptyLineItem()],
    );

    if (sourceInvoice.clientId) {
      setClientMode("existing");
      setManualClient(emptyManualClient());
    } else {
      setClientMode("manual");
      setManualClient({
        name: sourceInvoice.clientSnapshot?.name || "",
        email: sourceInvoice.clientSnapshot?.email || "",
        company: sourceInvoice.clientSnapshot?.company || "",
        phone: sourceInvoice.clientSnapshot?.phone || "",
        address: sourceInvoice.clientSnapshot?.address || "",
      });
    }

    setHydratedSourceId(sourceInvoiceId);
  }, [hydratedSourceId, isEditingDraft, sourceInvoice, sourceInvoiceId, user]);

  const calculateLineItemAmount = (quantity: number, rate: number) => quantity * rate;
  const calculateSubtotal = () => lineItems.reduce((sum, item) => sum + item.amount, 0);
  const calculateTax = (subtotal: number, rate: number) => subtotal * (rate / 100);

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const salesTax = formData.salesTaxEnabled ? calculateTax(subtotal, formData.salesTaxRate) : 0;
    const vat = formData.vatEnabled ? calculateTax(subtotal, formData.vatRate) : 0;
    return subtotal + salesTax + vat;
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setLineItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (field === "description") {
          return { ...item, description: String(value) };
        }

        const numericValue = parseNumber(value);
        const nextItem = {
          ...item,
          [field]: numericValue,
        };

        return {
          ...nextItem,
          amount: calculateLineItemAmount(
            field === "quantity" ? numericValue : nextItem.quantity,
            field === "rate" ? numericValue : nextItem.rate,
          ),
        };
      }),
    );
  };

  const addLineItem = () => setLineItems((current) => [...current, emptyLineItem()]);

  const removeLineItem = (index: number) => {
    setLineItems((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));
  };

  const sendInvoiceEmail = async (invoiceId: Id<"invoices">) => {
    const response = await fetch("/api/invoices/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
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
  };

  const handleSubmit = async (sendImmediately = false) => {
    if (!user?._id || isSubmitting) {
      return;
    }

    setError(null);
    setNotice(null);

    const validLineItems = lineItems.filter(
      (item) => item.description.trim() && item.quantity > 0 && item.rate >= 0,
    );
    const formattedLineItems = validLineItems.map((item) => ({
      ...item,
      description: item.description.trim(),
      amount: calculateLineItemAmount(item.quantity, item.rate),
    }));

    if (!formattedLineItems.length) {
      setError("Add at least one line item with a description and amount.");
      return;
    }

    if (clientMode === "existing" && !formData.clientId) {
      setError("Select an existing client or switch to manual recipient mode.");
      return;
    }

    if (clientMode === "manual" && (!manualClient.name.trim() || !manualClient.email.trim())) {
      setError("Manual recipient mode requires a client name and email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const invoicePayload = {
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        currency: formData.currency,
        lineItems: formattedLineItems,
        salesTaxEnabled: formData.salesTaxEnabled,
        salesTaxRate: formData.salesTaxRate,
        vatEnabled: formData.vatEnabled,
        vatRate: formData.vatRate,
        notes: formData.notes.trim() || undefined,
        paymentInstructions: formData.paymentInstructions.trim() || undefined,
      };
      const manualClientSnapshot =
        clientMode === "manual"
          ? {
              name: manualClient.name.trim(),
              email: manualClient.email.trim(),
              company: manualClient.company.trim() || undefined,
              phone: manualClient.phone.trim() || undefined,
              address: manualClient.address.trim() || undefined,
            }
          : undefined;

      let invoiceId: Id<"invoices">;

      if (isEditingDraft && draftId) {
        invoiceId = draftId as Id<"invoices">;
        await updateInvoice({
          invoiceId,
          updates: {
            clientId: clientMode === "existing" ? formData.clientId : undefined,
            clientSnapshot: manualClientSnapshot,
            ...invoicePayload,
          },
        });
      } else {
        invoiceId = await createInvoice({
          userId: user._id,
          clientId: clientMode === "existing" ? formData.clientId : undefined,
          clientSnapshot: manualClientSnapshot,
          ...invoicePayload,
        });
      }

      if (sendImmediately) {
        await sendInvoiceEmail(invoiceId);

        if (clientMode === "manual") {
          setSaveClientModal({
            invoiceId,
            values: {
              ...manualClient,
              name: manualClient.name.trim(),
              email: manualClient.email.trim(),
              company: manualClient.company.trim(),
              phone: manualClient.phone.trim(),
              address: manualClient.address.trim(),
              notes: "",
            },
          });
          setNotice("Invoice sent. Save this recipient as a reusable client?");
          return;
        }

        router.push(`/dashboard/invoices/${invoiceId}`);
        return;
      }

      router.push(`/dashboard/invoices/${invoiceId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save invoice.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveClient = async () => {
    if (!user?._id || !saveClientModal || isCreatingClient) {
      return;
    }

    if (!saveClientModal.values.name.trim() || !saveClientModal.values.email.trim()) {
      setModalError("Name and email are required to create a client.");
      return;
    }

    setModalError(null);
    setIsCreatingClient(true);

    try {
      const result = await createClient({
        userId: user._id,
        name: saveClientModal.values.name.trim(),
        email: saveClientModal.values.email.trim(),
        company: saveClientModal.values.company.trim() || undefined,
        phone: saveClientModal.values.phone.trim() || undefined,
        address: saveClientModal.values.address.trim() || undefined,
        notes: saveClientModal.values.notes.trim() || undefined,
      });

      await linkClientToInvoice({
        invoiceId: saveClientModal.invoiceId,
        clientId: result.clientId,
      });

      router.push(`/dashboard/invoices/${saveClientModal.invoiceId}`);
    } catch (createError) {
      setModalError(
        createError instanceof Error
          ? createError.message
          : "Unable to save client.",
      );
    } finally {
      setIsCreatingClient(false);
    }
  };

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="app-page-heading">
            {isEditingDraft ? "Edit draft invoice" : copyFromId ? "Reissue invoice" : "Create invoice"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Choose a saved client or send directly to a new recipient.
          </p>
        </div>
        <Link href="/dashboard/invoices" className={uiSecondaryButtonClass}>
          Back to invoices
        </Link>
      </div>

      <div className={`${uiCardClass} space-y-6 p-6 sm:p-7`}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(180deg,#fffdf9_0%,#f7f5ef_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className={uiTabGroupClass}>
                <button
                  type="button"
                  className={clientMode === "existing" ? uiActiveTabClass : uiInactiveTabClass}
                  onClick={() => setClientMode("existing")}
                >
                  Existing client
                </button>
                <button
                  type="button"
                  className={clientMode === "manual" ? uiActiveTabClass : uiInactiveTabClass}
                  onClick={() => setClientMode("manual")}
                >
                  New recipient
                </button>
              </div>

              {clientMode === "existing" ? (
                <div className="mt-5">
                  <label className="app-field-label" htmlFor="invoice-client">
                    Client
                  </label>
                  <select
                    id="invoice-client"
                    value={formData.clientId || ""}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        clientId: event.target.value
                          ? (event.target.value as Id<"clients">)
                          : undefined,
                      }))
                    }
                    className={uiSelectClass}
                  >
                    <option value="">Select a client</option>
                    {clients?.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                        {client.company ? ` (${client.company})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Need a new reusable record first?{" "}
                    <Link href="/dashboard/clients/new" className="font-semibold text-[var(--accent)]">
                      Create a client
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="app-field-label" htmlFor="recipient-name">
                      Recipient name
                    </label>
                    <input
                      id="recipient-name"
                      value={manualClient.name}
                      onChange={(event) =>
                        setManualClient((current) => ({ ...current, name: event.target.value }))
                      }
                      className={uiInputClass}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="app-field-label" htmlFor="recipient-email">
                      Recipient email
                    </label>
                    <input
                      id="recipient-email"
                      type="email"
                      value={manualClient.email}
                      onChange={(event) =>
                        setManualClient((current) => ({ ...current, email: event.target.value }))
                      }
                      className={uiInputClass}
                      placeholder="jane@northstar.com"
                    />
                  </div>
                  <div>
                    <label className="app-field-label" htmlFor="recipient-company">
                      Company
                    </label>
                    <input
                      id="recipient-company"
                      value={manualClient.company}
                      onChange={(event) =>
                        setManualClient((current) => ({ ...current, company: event.target.value }))
                      }
                      className={uiInputClass}
                      placeholder="Northstar Studio"
                    />
                  </div>
                  <div>
                    <label className="app-field-label" htmlFor="recipient-phone">
                      Phone
                    </label>
                    <input
                      id="recipient-phone"
                      value={manualClient.phone}
                      onChange={(event) =>
                        setManualClient((current) => ({ ...current, phone: event.target.value }))
                      }
                      className={uiInputClass}
                      placeholder="+1 555 0146"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="app-field-label" htmlFor="recipient-address">
                      Address
                    </label>
                    <textarea
                      id="recipient-address"
                      rows={3}
                      value={manualClient.address}
                      onChange={(event) =>
                        setManualClient((current) => ({ ...current, address: event.target.value }))
                      }
                      className={uiTextareaClass}
                      placeholder="Street, city, state, ZIP"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="app-field-label" htmlFor="invoice-currency">
                  Currency
                </label>
                <select
                  id="invoice-currency"
                  value={formData.currency}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, currency: event.target.value }))
                  }
                  className={uiSelectClass}
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-field-label" htmlFor="issue-date">
                  Issue date
                </label>
                <input
                  id="issue-date"
                  type="date"
                  value={formData.issueDate}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, issueDate: event.target.value }))
                  }
                  className={uiInputClass}
                />
              </div>
              <div>
                <label className="app-field-label" htmlFor="due-date">
                  Due date
                </label>
                <input
                  id="due-date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, dueDate: event.target.value }))
                  }
                  className={uiInputClass}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className={uiSectionTitleClass}>Line items</h2>
                <button type="button" className={uiSecondaryButtonClass} onClick={addLineItem}>
                  <Plus className="h-4 w-4" />
                  Add line item
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfbf9_100%)] p-4 shadow-[0_12px_28px_rgba(17,24,39,0.05)] md:grid-cols-[minmax(0,1fr)_110px_140px_140px_auto]"
                  >
                    <input
                      placeholder="Description"
                      value={item.description}
                      onChange={(event) =>
                        handleLineItemChange(index, "description", event.target.value)
                      }
                      className={uiInputClass}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(event) =>
                        handleLineItemChange(index, "quantity", event.target.value)
                      }
                      className={uiInputClass}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(event) =>
                        handleLineItemChange(index, "rate", event.target.value)
                      }
                      className={uiInputClass}
                    />
                    <input
                      readOnly
                      value={item.amount.toFixed(2)}
                      className={`${uiInputClass} bg-[var(--surface-subtle)]`}
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfbf9_100%)] p-4 shadow-[0_12px_28px_rgba(17,24,39,0.05)]">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-gray-700" htmlFor="salesTaxEnabled">
                    Enable sales tax
                  </label>
                  <input
                    id="salesTaxEnabled"
                    type="checkbox"
                    checked={formData.salesTaxEnabled}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        salesTaxEnabled: event.target.checked,
                      }))
                    }
                  />
                </div>
                {formData.salesTaxEnabled ? (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salesTaxRate}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        salesTaxRate: parseNumber(event.target.value),
                      }))
                    }
                    className={uiInputClass}
                    placeholder="Sales tax rate"
                  />
                ) : null}

                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-medium text-gray-700" htmlFor="vatEnabled">
                    Enable VAT
                  </label>
                  <input
                    id="vatEnabled"
                    type="checkbox"
                    checked={formData.vatEnabled}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        vatEnabled: event.target.checked,
                      }))
                    }
                  />
                </div>
                {formData.vatEnabled ? (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.vatRate}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        vatRate: parseNumber(event.target.value),
                      }))
                    }
                    className={uiInputClass}
                    placeholder="VAT rate"
                  />
                ) : null}
              </div>

              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,#fffdf8_0%,#f4efe6_100%)] p-4 shadow-[0_12px_28px_rgba(17,24,39,0.05)]">
                <div className="flex justify-between py-1 text-sm text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span>
                    {formData.currency} {calculateSubtotal().toFixed(2)}
                  </span>
                </div>
                {formData.salesTaxEnabled ? (
                  <div className="flex justify-between py-1 text-sm text-[var(--muted)]">
                    <span>Sales tax ({formData.salesTaxRate}%)</span>
                    <span>
                      {formData.currency}{" "}
                      {calculateTax(calculateSubtotal(), formData.salesTaxRate).toFixed(2)}
                    </span>
                  </div>
                ) : null}
                {formData.vatEnabled ? (
                  <div className="flex justify-between py-1 text-sm text-[var(--muted)]">
                    <span>VAT ({formData.vatRate}%)</span>
                    <span>
                      {formData.currency}{" "}
                      {calculateTax(calculateSubtotal(), formData.vatRate).toFixed(2)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-3 flex justify-between border-t border-[var(--border)] pt-3 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>
                    {formData.currency} {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="app-field-label" htmlFor="invoice-notes">
                Notes
              </label>
              <textarea
                id="invoice-notes"
                rows={4}
                value={formData.notes}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, notes: event.target.value }))
                }
                className={uiTextareaClass}
                placeholder="Additional notes for the client"
              />
            </div>

            <div>
              <label className="app-field-label" htmlFor="payment-instructions">
                Payment instructions
              </label>
              <textarea
                id="payment-instructions"
                rows={3}
                value={formData.paymentInstructions}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    paymentInstructions: event.target.value,
                  }))
                }
                className={uiTextareaClass}
                placeholder="Bank details, transfer reference, or payment link"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(180deg,#fdfdfc_0%,#eef6f4_100%)] p-5 shadow-[0_20px_48px_rgba(17,24,39,0.08)]">
            <div className="flex items-center gap-3 rounded-[1.5rem] bg-white px-4 py-4 shadow-[0_12px_24px_rgba(17,24,39,0.05)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {clientMode === "existing"
                    ? clients?.find((client) => client._id === formData.clientId)?.name ||
                      "Select a saved client"
                    : manualClient.name || "New recipient"}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {clientMode === "existing"
                    ? clients?.find((client) => client._id === formData.clientId)?.email ||
                      "Client email will populate automatically"
                    : manualClient.email || "Enter a delivery email address"}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_12px_24px_rgba(17,24,39,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">
                Delivery
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Save drafts for later or send immediately. When email delivery is not configured in
                local development, the app will open a ready-to-send email draft.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_12px_24px_rgba(17,24,39,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">
                Current total
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-gray-900">
                {formData.currency} {calculateTotal().toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {lineItems.filter((item) => item.description.trim()).length} line item
                {lineItems.filter((item) => item.description.trim()).length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={() => void handleSubmit(false)}
                disabled={isSubmitting}
                className={`${uiSecondaryButtonClass} w-full`}
              >
                <Save className="h-5 w-5" />
                {isEditingDraft ? "Update draft" : "Save as draft"}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit(true)}
                disabled={isSubmitting}
                className={`${uiPrimaryButtonClass} w-full`}
              >
                <Send className="h-5 w-5" />
                {isSubmitting ? "Sending..." : "Save and send"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {saveClientModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf7_100%)] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900">Save recipient as client?</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This invoice has been sent. Save these details now so the client appears in future
              invoice selections.
            </p>

            {modalError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {modalError}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="app-field-label">Client name</label>
                <input
                  value={saveClientModal.values.name}
                  onChange={(event) =>
                    setSaveClientModal((current) =>
                      current
                        ? {
                            ...current,
                            values: { ...current.values, name: event.target.value },
                          }
                        : current,
                    )
                  }
                  className={uiInputClass}
                />
              </div>
              <div>
                <label className="app-field-label">Email</label>
                <input
                  type="email"
                  value={saveClientModal.values.email}
                  onChange={(event) =>
                    setSaveClientModal((current) =>
                      current
                        ? {
                            ...current,
                            values: { ...current.values, email: event.target.value },
                          }
                        : current,
                    )
                  }
                  className={uiInputClass}
                />
              </div>
              <div>
                <label className="app-field-label">Company</label>
                <input
                  value={saveClientModal.values.company}
                  onChange={(event) =>
                    setSaveClientModal((current) =>
                      current
                        ? {
                            ...current,
                            values: { ...current.values, company: event.target.value },
                          }
                        : current,
                    )
                  }
                  className={uiInputClass}
                />
              </div>
              <div>
                <label className="app-field-label">Phone</label>
                <input
                  value={saveClientModal.values.phone}
                  onChange={(event) =>
                    setSaveClientModal((current) =>
                      current
                        ? {
                            ...current,
                            values: { ...current.values, phone: event.target.value },
                          }
                        : current,
                    )
                  }
                  className={uiInputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="app-field-label">Address</label>
                <textarea
                  rows={3}
                  value={saveClientModal.values.address}
                  onChange={(event) =>
                    setSaveClientModal((current) =>
                      current
                        ? {
                            ...current,
                            values: { ...current.values, address: event.target.value },
                          }
                        : current,
                    )
                  }
                  className={uiTextareaClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="app-field-label">Notes</label>
                <textarea
                  rows={3}
                  value={saveClientModal.values.notes}
                  onChange={(event) =>
                    setSaveClientModal((current) =>
                      current
                        ? {
                            ...current,
                            values: { ...current.values, notes: event.target.value },
                          }
                        : current,
                    )
                  }
                  className={uiTextareaClass}
                  placeholder="Optional internal notes"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={uiSecondaryButtonClass}
                onClick={() => router.push(`/dashboard/invoices/${saveClientModal.invoiceId}`)}
              >
                No thanks
              </button>
              <button
                type="button"
                className={uiPrimaryButtonClass}
                disabled={isCreatingClient}
                onClick={() => void handleSaveClient()}
              >
                {isCreatingClient ? "Creating..." : "Create client"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

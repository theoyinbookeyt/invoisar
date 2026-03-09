"use client";

import { useEffect, useState } from "react";
import { Building2, Mail, MapPin, Phone, StickyNote } from "lucide-react";
import {
  uiCardClass,
  uiDangerButtonClass,
  uiInputClass,
  uiPrimaryButtonClass,
  uiTextareaClass,
} from "@/components/ui/classes";

export type ClientFormValues = {
  name: string;
  email: string;
  company: string;
  phone: string;
  address: string;
  notes: string;
};

type ClientFormProps = {
  initialValues: ClientFormValues;
  heading: string;
  description?: string;
  submitLabel: string;
  busyLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  deleteLabel?: string;
};

export function emptyClientFormValues(): ClientFormValues {
  return {
    name: "",
    email: "",
    company: "",
    phone: "",
    address: "",
    notes: "",
  };
}

export default function ClientForm({
  initialValues,
  heading,
  description,
  submitLabel,
  busyLabel = "Saving...",
  isSubmitting = false,
  onSubmit,
  onDelete,
  deleteLabel = "Archive client",
}: ClientFormProps) {
  const [values, setValues] = useState<ClientFormValues>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
      company: values.company.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      notes: values.notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`${uiCardClass} space-y-5 p-6 sm:p-7`}>
      <div className="space-y-1">
        <h1 className="app-page-heading">{heading}</h1>
        {description ? <p className="app-muted text-sm">{description}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="app-field-label" htmlFor="client-name">
            Client name
          </label>
          <input
            id="client-name"
            required
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            className={uiInputClass}
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label className="app-field-label" htmlFor="client-email">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
            <input
              id="client-email"
              type="email"
              required
              value={values.email}
              onChange={(event) =>
                setValues((current) => ({ ...current, email: event.target.value }))
              }
              className={`${uiInputClass} pl-10`}
              placeholder="jane@northstar.com"
            />
          </div>
        </div>

        <div>
          <label className="app-field-label" htmlFor="client-company">
            Company
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
            <input
              id="client-company"
              value={values.company}
              onChange={(event) =>
                setValues((current) => ({ ...current, company: event.target.value }))
              }
              className={`${uiInputClass} pl-10`}
              placeholder="Northstar Studio"
            />
          </div>
        </div>

        <div>
          <label className="app-field-label" htmlFor="client-phone">
            Phone
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
            <input
              id="client-phone"
              value={values.phone}
              onChange={(event) =>
                setValues((current) => ({ ...current, phone: event.target.value }))
              }
              className={`${uiInputClass} pl-10`}
              placeholder="+1 555 0146"
            />
          </div>
        </div>

        <div>
          <label className="app-field-label" htmlFor="client-address">
            Address
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-soft)]" />
            <textarea
              id="client-address"
              rows={3}
              value={values.address}
              onChange={(event) =>
                setValues((current) => ({ ...current, address: event.target.value }))
              }
              className={`${uiTextareaClass} pl-10`}
              placeholder="Street, city, state, ZIP"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="app-field-label" htmlFor="client-notes">
            Notes
          </label>
          <div className="relative">
            <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted-soft)]" />
            <textarea
              id="client-notes"
              rows={4}
              value={values.notes}
              onChange={(event) =>
                setValues((current) => ({ ...current, notes: event.target.value }))
              }
              className={`${uiTextareaClass} pl-10`}
              placeholder="Internal notes about this client"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-between">
        {onDelete ? (
          <button type="button" className={uiDangerButtonClass} onClick={() => void onDelete()}>
            {deleteLabel}
          </button>
        ) : (
          <div />
        )}

        <button type="submit" disabled={isSubmitting} className={uiPrimaryButtonClass}>
          {isSubmitting ? busyLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

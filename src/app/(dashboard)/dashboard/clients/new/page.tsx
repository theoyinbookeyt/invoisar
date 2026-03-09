"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ClientForm, {
  emptyClientFormValues,
  type ClientFormValues,
} from "@/components/clients/ClientForm";

export default function NewClientPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkUserId: userId } : "skip",
  );
  const createClient = useMutation(api.clients.createClient);

  const handleSubmit = async (values: ClientFormValues) => {
    if (!user?._id || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createClient({
        userId: user._id,
        name: values.name,
        email: values.email,
        company: values.company || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
      });

      router.push(`/dashboard/clients/${result.clientId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create client.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <ClientForm
        heading="Create client"
        description="Add a reusable client record for invoice delivery and tracking."
        initialValues={emptyClientFormValues()}
        submitLabel="Create client"
        busyLabel="Creating..."
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

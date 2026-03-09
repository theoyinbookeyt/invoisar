import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { Resend } from "resend";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  buildInvoiceMailtoUrl,
  renderInvoiceEmail,
} from "@/lib/invoice-email";

export async function POST(request: NextRequest) {
  const authInfo = await auth();
  if (!authInfo.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { invoiceId?: string };
  if (!body.invoiceId) {
    return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
  }

  const invoiceId = body.invoiceId as Id<"invoices">;
  const user = await fetchQuery(api.users.getUserByClerkId, {
    clerkUserId: authInfo.userId,
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const invoice = await fetchQuery(api.invoices.getInvoiceById, { invoiceId });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.userId !== user._id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!invoice.clientSnapshot?.email) {
    return NextResponse.json(
      { error: "Invoice is missing client email details" },
      { status: 400 },
    );
  }

  const sender = await fetchQuery(api.users.getUserById, { userId: invoice.userId });
  if (!sender) {
    return NextResponse.json({ error: "Sender not found" }, { status: 404 });
  }

  const origin = request.nextUrl.origin;
  const email = renderInvoiceEmail({
    origin,
    invoice,
    sender,
  });

  if (!process.env.RESEND_API_KEY) {
    await fetchMutation(api.invoices.sendInvoice, { invoiceId });

    return NextResponse.json({
      ok: true,
      delivery: "mailto",
      publicUrl: email.publicUrl,
      mailtoUrl: buildInvoiceMailtoUrl({
        origin,
        invoice,
        sender,
      }),
      message: "Email provider is not configured. Opened a ready-to-send draft instead.",
    });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Invoisar <onboarding@resend.dev>",
      to: invoice.clientSnapshot.email,
      subject: email.subject,
      html: email.html,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    await fetchMutation(api.invoices.sendInvoice, { invoiceId });

    return NextResponse.json({
      ok: true,
      delivery: "resend",
      publicUrl: email.publicUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send invoice email";

    await fetchMutation(api.invoices.recordEmailFailure, {
      invoiceId,
      message,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

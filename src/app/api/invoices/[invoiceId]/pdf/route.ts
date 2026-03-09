import React from "react";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ invoiceId: string }> },
) {
  void _request;
  const authInfo = await auth();
  if (!authInfo.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await context.params;
  const user = await fetchQuery(api.users.getUserByClerkId, {
    clerkUserId: authInfo.userId,
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const invoice = await fetchQuery(api.invoices.getInvoiceById, {
    invoiceId: invoiceId as Id<"invoices">,
  });
  if (!invoice || invoice.userId !== user._id) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const file = await renderToBuffer(
    React.createElement(InvoicePdfDocument, {
      invoice,
      user,
    }) as unknown as React.ReactElement<DocumentProps>,
  );

  return new NextResponse(file as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

type InvoiceEmailPayload = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  salesTaxEnabled: boolean;
  salesTaxRate: number;
  salesTaxAmount: number;
  vatEnabled: boolean;
  vatRate: number;
  vatAmount: number;
  total: number;
  paymentInstructions?: string;
  notes?: string;
  publicToken: string;
  lineItems: Array<{
    description: string;
    amount: number;
  }>;
  clientSnapshot?: {
    name: string;
    email: string;
    company?: string;
  };
};

type InvoiceSender = {
  companyName?: string;
  displayName?: string;
  email: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function buildInvoicePublicUrl(origin: string, publicToken: string) {
  return `${origin.replace(/\/$/, "")}/invoice/${publicToken}`;
}

export function buildInvoiceMailtoUrl(args: {
  origin: string;
  invoice: InvoiceEmailPayload;
  sender: InvoiceSender;
}) {
  const companyName = args.sender.companyName || args.sender.displayName || "Invoisar user";
  const publicUrl = buildInvoicePublicUrl(args.origin, args.invoice.publicToken);
  const clientName = args.invoice.clientSnapshot?.name || "there";
  const subject = `Invoice ${args.invoice.invoiceNumber} from ${companyName}`;
  const body = [
    `Hi ${clientName},`,
    "",
    `Please find invoice ${args.invoice.invoiceNumber} for ${formatMoney(args.invoice.currency, args.invoice.total)}.`,
    `Due date: ${formatDate(args.invoice.dueDate)}`,
    "",
    `View the invoice online: ${publicUrl}`,
    "",
    args.invoice.paymentInstructions || args.invoice.notes || "",
    "",
    `Thank you,`,
    companyName,
  ]
    .filter(Boolean)
    .join("\n");

  return `mailto:${encodeURIComponent(args.invoice.clientSnapshot?.email || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function renderInvoiceEmail(args: {
  origin: string;
  invoice: InvoiceEmailPayload;
  sender: InvoiceSender;
}) {
  const companyName = args.sender.companyName || args.sender.displayName || "Invoisar user";
  const clientName = args.invoice.clientSnapshot?.name || "there";
  const publicUrl = buildInvoicePublicUrl(args.origin, args.invoice.publicToken);
  const summaryRows = args.invoice.lineItems
    .slice(0, 5)
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#1f2937;">${escapeHtml(item.description)}</td>
          <td style="padding:8px 0;color:#111827;text-align:right;">${escapeHtml(
            formatMoney(args.invoice.currency, item.amount),
          )}</td>
        </tr>
      `,
    )
    .join("");

  const taxRows = [
    args.invoice.salesTaxEnabled
      ? `
        <tr>
          <td style="padding:6px 0;color:#6b7280;">Sales Tax (${args.invoice.salesTaxRate}%)</td>
          <td style="padding:6px 0;color:#374151;text-align:right;">${escapeHtml(
            formatMoney(args.invoice.currency, args.invoice.salesTaxAmount),
          )}</td>
        </tr>
      `
      : "",
    args.invoice.vatEnabled
      ? `
        <tr>
          <td style="padding:6px 0;color:#6b7280;">VAT (${args.invoice.vatRate}%)</td>
          <td style="padding:6px 0;color:#374151;text-align:right;">${escapeHtml(
            formatMoney(args.invoice.currency, args.invoice.vatAmount),
          )}</td>
        </tr>
      `
      : "",
  ].join("");

  return {
    subject: `Invoice ${args.invoice.invoiceNumber} from ${companyName}`,
    html: `
      <div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;font-size:14px;color:#0f766e;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Invoice ready</p>
          <h1 style="margin:0;font-size:28px;line-height:1.1;">${escapeHtml(args.invoice.invoiceNumber)}</h1>
          <p style="margin:16px 0 0;color:#374151;">Hi ${escapeHtml(clientName)},</p>
          <p style="margin:12px 0 0;color:#374151;">
            Please find your invoice from ${escapeHtml(companyName)} for
            <strong>${escapeHtml(formatMoney(args.invoice.currency, args.invoice.total))}</strong>.
          </p>

          <div style="margin-top:24px;border:1px solid #e5e7eb;border-radius:16px;padding:20px;background:#fafaf9;">
            <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;">
              <div>
                <p style="margin:0;color:#6b7280;font-size:13px;">Issue date</p>
                <p style="margin:6px 0 0;font-weight:600;">${escapeHtml(formatDate(args.invoice.issueDate))}</p>
              </div>
              <div>
                <p style="margin:0;color:#6b7280;font-size:13px;">Due date</p>
                <p style="margin:6px 0 0;font-weight:600;">${escapeHtml(formatDate(args.invoice.dueDate))}</p>
              </div>
              <div>
                <p style="margin:0;color:#6b7280;font-size:13px;">Amount due</p>
                <p style="margin:6px 0 0;font-weight:700;">${escapeHtml(
                  formatMoney(args.invoice.currency, args.invoice.total),
                )}</p>
              </div>
            </div>
          </div>

          <table style="width:100%;margin-top:24px;border-collapse:collapse;">
            <tbody>
              ${summaryRows}
              <tr>
                <td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Subtotal</td>
                <td style="padding:8px 0;color:#374151;text-align:right;border-top:1px solid #e5e7eb;">${escapeHtml(
                  formatMoney(args.invoice.currency, args.invoice.subtotal),
                )}</td>
              </tr>
              ${taxRows}
              <tr>
                <td style="padding:10px 0;color:#111827;font-weight:700;border-top:1px solid #e5e7eb;">Total</td>
                <td style="padding:10px 0;color:#111827;text-align:right;font-weight:700;border-top:1px solid #e5e7eb;">${escapeHtml(
                  formatMoney(args.invoice.currency, args.invoice.total),
                )}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top:28px;">
            <a href="${escapeHtml(publicUrl)}" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">View invoice</a>
          </div>

          ${
            args.invoice.paymentInstructions
              ? `<p style="margin:24px 0 0;color:#374151;"><strong>Payment instructions:</strong><br />${escapeHtml(
                  args.invoice.paymentInstructions,
                ).replaceAll("\n", "<br />")}</p>`
              : ""
          }
          ${
            args.invoice.notes
              ? `<p style="margin:16px 0 0;color:#6b7280;">${escapeHtml(args.invoice.notes).replaceAll("\n", "<br />")}</p>`
              : ""
          }

          <p style="margin:28px 0 0;color:#6b7280;">Thank you,<br />${escapeHtml(companyName)}</p>
        </div>
      </div>
    `,
    publicUrl,
  };
}

import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";

async function getInvoiceByToken(token: string) {
  return fetchQuery(api.invoices.getInvoiceByPublicToken, { publicToken: token });
}

type InvoiceRecord = NonNullable<Awaited<ReturnType<typeof getInvoiceByToken>>>;
type InvoiceLineItem = InvoiceRecord["lineItems"][number];

async function getUserForInvoice(invoice: InvoiceRecord | null) {
  if (!invoice) return null;
  return fetchQuery(api.users.getUserById, { userId: invoice.userId });
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertCircle },
  voided: { label: "Voided", color: "bg-yellow-100 text-yellow-700", icon: Clock },
} as const;

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await getInvoiceByToken(token);

  if (!invoice) {
    notFound();
  }

  const user = await getUserForInvoice(invoice);
  const status = statusConfig[invoice.status];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">INVOICE</h1>
                <p className="text-gray-400">{invoice.invoiceNumber}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                <status.icon className="w-4 h-4 inline mr-1" />
                {status.label}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">From</h3>
                <p className="font-semibold text-gray-900">{user?.companyName || "Your Company"}</p>
                {user?.companyAddress && (
                  <p className="text-gray-600 whitespace-pre-line">{user.companyAddress}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Bill To</h3>
                {invoice.clientSnapshot ? (
                  <>
                    <p className="font-semibold text-gray-900">{invoice.clientSnapshot.name}</p>
                    <p className="text-gray-600">{invoice.clientSnapshot.email}</p>
                    {invoice.clientSnapshot.company && (
                      <p className="text-gray-600">{invoice.clientSnapshot.company}</p>
                    )}
                    {invoice.clientSnapshot.address && (
                      <p className="text-gray-600 whitespace-pre-line">{invoice.clientSnapshot.address}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-600">No client specified</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Issue Date</h3>
                <p className="font-medium text-gray-900">
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="font-medium text-gray-900">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount Due</h3>
                <p className="font-bold text-xl text-gray-900">
                  {invoice.currency} {invoice.total.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <table className="w-full">
                <thead className="border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Description</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Qty</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Rate</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.lineItems.map((item: InvoiceLineItem, index: number) => (
                    <tr key={index}>
                      <td className="py-3 text-gray-900">{item.description}</td>
                      <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600">
                        {invoice.currency} {item.rate.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-gray-900 font-medium">
                        {invoice.currency} {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{invoice.currency} {invoice.subtotal.toLocaleString()}</span>
                </div>
                {invoice.salesTaxEnabled && (
                  <div className="flex justify-between text-gray-600">
                    <span>Sales Tax ({invoice.salesTaxRate}%):</span>
                    <span>{invoice.currency} {invoice.salesTaxAmount.toLocaleString()}</span>
                  </div>
                )}
                {invoice.vatEnabled && (
                  <div className="flex justify-between text-gray-600">
                    <span>VAT ({invoice.vatRate}%):</span>
                    <span>{invoice.currency} {invoice.vatAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                  <span>Total:</span>
                  <span>{invoice.currency} {invoice.total.toLocaleString()}</span>
                </div>
                {invoice.amountPaid && invoice.amountPaid > 0 && (
                  <div className="flex justify-between text-green-600 pt-2 border-t">
                    <span>Paid:</span>
                    <span>-{invoice.currency} {invoice.amountPaid.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {invoice.notes && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                <p className="text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {invoice.paymentInstructions && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Payment Instructions</h3>
                <p className="text-blue-700">{invoice.paymentInstructions}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-500 mt-6">
          Powered by <Link href="/" className="text-blue-600 hover:text-blue-700">Invoisar</Link>
        </p>
      </div>
    </div>
  );
}

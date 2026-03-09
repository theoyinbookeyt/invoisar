import { auth, currentUser } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { FileText, DollarSign, Clock, AlertCircle } from "lucide-react";
import {
  uiPrimaryButtonClass,
  uiSecondaryButtonClass,
} from "@/components/ui/classes";

async function getDashboardStats(userId: string) {
  const user = await fetchQuery(api.users.getUserByClerkId, { clerkUserId: userId });
  
  if (!user) return null;

  const invoices = await fetchQuery(api.invoices.listInvoicesByUser, { userId: user._id });
  const clients = await fetchQuery(api.clients.listClientsByUser, { userId: user._id });

  const totalRevenue = invoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total, 0);

  const overdueCount = invoices.filter(inv => inv.status === "overdue").length;
  const sentCount = invoices.filter(inv => inv.status === "sent").length;
  const draftCount = invoices.filter(inv => inv.status === "draft").length;
  const paidCount = invoices.filter(inv => inv.status === "paid").length;

  return {
    totalInvoices: invoices.length,
    totalClients: clients.length,
    totalRevenue,
    pendingAmount,
    overdueCount,
    sentCount,
    draftCount,
    paidCount,
    recentInvoices: invoices.slice(0, 5),
  };
}

export default async function DashboardPage() {
  const authInfo = await auth();
  const user = await currentUser();

  if (!authInfo?.userId) {
    return null;
  }

  const stats = await getDashboardStats(authInfo.userId);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Pending",
      value: `$${stats.pendingAmount.toLocaleString()}`,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "Overdue",
      value: stats.overdueCount.toString(),
      icon: AlertCircle,
      color: "bg-red-500",
    },
    {
      title: "Total Invoices",
      value: stats.totalInvoices.toString(),
      icon: FileText,
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="app-page-heading">
          Welcome back, {user?.firstName || "User"}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/clients/new" className={uiSecondaryButtonClass}>
            Add Client
          </Link>
          <Link href="/dashboard/invoices/new" className={uiPrimaryButtonClass}>
            Create Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Draft</span>
              <span className="font-medium">{stats.draftCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Sent</span>
              <span className="font-medium">{stats.sentCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Paid</span>
              <span className="font-medium">{stats.paidCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Overdue</span>
              <span className="font-medium text-red-600">{stats.overdueCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            <Link
              href="/dashboard/invoices"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          {stats.recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {stats.recentInvoices.map((invoice) => (
                <Link
                  key={invoice._id}
                  href={`/dashboard/invoices/${invoice._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">
                      {invoice.clientSnapshot?.name || "No client"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${invoice.total.toLocaleString()}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : invoice.status === "sent"
                          ? "bg-blue-100 text-blue-700"
                          : invoice.status === "overdue"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No invoices yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

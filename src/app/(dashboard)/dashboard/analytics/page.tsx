import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, AlertTriangle, Zap } from "lucide-react";

async function getAnalyticsData(userId: string) {
  const user = await fetchQuery(api.users.getUserByClerkId, { clerkUserId: userId });
  if (!user) return null;

  const invoices = await fetchQuery(api.invoices.listInvoicesByUser, { userId: user._id });
  const clients = await fetchQuery(api.clients.listClientsByUser, { userId: user._id });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const last30DaysInvoices = invoices.filter(
    (i) => new Date(i.createdAt) >= thirtyDaysAgo
  );
  const last90DaysInvoices = invoices.filter(
    (i) => new Date(i.createdAt) >= ninetyDaysAgo
  );

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  const last30DaysRevenue = last30DaysInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  const last90DaysRevenue = last90DaysInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);

  const pendingAmount = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + i.total, 0);

  const overdueAmount = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.total, 0);

  const statusBreakdown = {
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    voided: invoices.filter((i) => i.status === "voided").length,
  };

  const topClients = clients.map((client) => {
    const clientInvoices = invoices.filter(
      (i) => i.clientId === client._id && i.status === "paid"
    );
    const totalBilled = clientInvoices.reduce((sum, i) => sum + i.total, 0);
    return { ...client, totalBilled };
  })
    .sort((a, b) => b.totalBilled - a.totalBilled)
    .slice(0, 5);

  const averageDaysToPayment = (() => {
    const paidInvoices = invoices.filter(
      (i) => i.status === "paid" && i.sentAt && i.paidAt
    );
    if (paidInvoices.length === 0) return 0;
    const totalDays = paidInvoices.reduce((sum, i) => {
      const sentDate = new Date(i.sentAt!);
      const paidDate = new Date(i.paidAt!);
      return sum + Math.floor((paidDate.getTime() - sentDate.getTime()) / (24 * 60 * 60 * 1000));
    }, 0);
    return Math.round(totalDays / paidInvoices.length);
  })();

  return {
    totalRevenue,
    last30DaysRevenue,
    last90DaysRevenue,
    pendingAmount,
    overdueAmount,
    totalInvoices: invoices.length,
    totalClients: clients.length,
    statusBreakdown,
    topClients,
    averageDaysToPayment,
    invoicesLast30Days: last30DaysInvoices.length,
    revenueTrend: last90DaysRevenue > 0 ? ((last30DaysRevenue - (last90DaysRevenue - last30DaysRevenue)) / last90DaysRevenue) * 100 : 0,
  };
}

export default async function AnalyticsPage() {
  const authInfo = await auth();
  if (!authInfo?.userId) return null;

  const data = await getAnalyticsData(authInfo.userId);
  if (!data) return null;

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${data.totalRevenue.toLocaleString()}`,
      subtitle: `$${data.last30DaysRevenue.toLocaleString()} this month`,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Pending",
      value: `$${data.pendingAmount.toLocaleString()}`,
      subtitle: `${data.statusBreakdown.sent} invoices`,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "Overdue",
      value: `$${data.overdueAmount.toLocaleString()}`,
      subtitle: `${data.statusBreakdown.overdue} invoices`,
      icon: AlertTriangle,
      color: "bg-red-500",
    },
    {
      title: "Total Clients",
      value: data.totalClients.toString(),
      subtitle: `${data.topClients.filter(c => c.totalBilled > 0).length} with invoices`,
      icon: Users,
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="flex items-center gap-4">
            {data.revenueTrend >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-500" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-500" />
            )}
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {data.revenueTrend >= 0 ? "+" : ""}{data.revenueTrend.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Compared to previous period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
          <div className="space-y-3">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        status === "paid"
                          ? "bg-green-500"
                          : status === "sent"
                          ? "bg-blue-500"
                          : status === "overdue"
                          ? "bg-red-500"
                          : status === "draft"
                          ? "bg-gray-400"
                          : "bg-yellow-500"
                      }`}
                      style={{ width: `${(count / data.totalInvoices) * 100 || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients</h3>
          {data.topClients.length > 0 ? (
            <div className="space-y-3">
              {data.topClients.map((client) => (
                <div key={client._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{client.name}</span>
                  </div>
                  <span className="text-gray-600">
                    ${client.totalBilled.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No client data yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Days to Payment</span>
              <span className="font-semibold text-gray-900">{data.averageDaysToPayment} days</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Invoices (Last 30 Days)</span>
              <span className="font-semibold text-gray-900">{data.invoicesLast30Days}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Revenue (Last 30 Days)</span>
              <span className="font-semibold text-gray-900">${data.last30DaysRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            AI Insights
          </h3>
        </div>
        <p className="text-gray-500 mb-4">
          AI-powered insights are available. Configure your Groq API key to enable them.
        </p>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            To enable AI insights, add your Groq API key to the environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}

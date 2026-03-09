import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

type InvoicePdfData = {
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
  notes?: string;
  paymentInstructions?: string;
  clientSnapshot?: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    address?: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
};

type InvoicePdfUser = {
  companyName?: string;
  displayName?: string;
  email: string;
  companyAddress?: string;
  phone?: string;
  website?: string;
  brandColor?: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: "#f8f7f3",
    fontSize: 11,
    color: "#1f2937",
    fontFamily: "Helvetica",
  },
  shell: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 28,
    border: "1 solid #e7e5de",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
    borderBottom: "1 solid #ebe8df",
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 700,
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
  },
  muted: {
    color: "#6b7280",
  },
  sectionRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 22,
  },
  sectionCard: {
    flex: 1,
    backgroundColor: "#fbfaf7",
    borderRadius: 14,
    padding: 16,
    border: "1 solid #efede6",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  infoLine: {
    marginBottom: 4,
  },
  metricRow: {
    flexDirection: "row",
    marginTop: 18,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    border: "1 solid #ece8df",
  },
  metricTitle: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  table: {
    marginTop: 22,
    borderRadius: 14,
    overflow: "hidden",
    border: "1 solid #ece8df",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f3ed",
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTop: "1 solid #f0ede5",
  },
  descriptionColumn: {
    flex: 1.8,
    paddingRight: 10,
  },
  smallColumn: {
    flex: 0.7,
  },
  amountColumn: {
    flex: 0.9,
    textAlign: "right",
  },
  totalsWrap: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalsCard: {
    width: 230,
    backgroundColor: "#fbfaf7",
    borderRadius: 14,
    padding: 16,
    border: "1 solid #efede6",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  grandTotal: {
    marginTop: 6,
    paddingTop: 10,
    borderTop: "1 solid #e7e5de",
    fontSize: 14,
    fontWeight: 700,
  },
  footerCard: {
    marginTop: 18,
    backgroundColor: "#fbfaf7",
    borderRadius: 14,
    padding: 16,
    border: "1 solid #efede6",
  },
});

function formatMoney(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
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

export function InvoicePdfDocument({
  invoice,
  user,
}: {
  invoice: InvoicePdfData;
  user: InvoicePdfUser;
}) {
  const companyName = user.companyName || user.displayName || user.email;
  const brandColor = user.brandColor || "#0d9488";

  return (
    <Document title={invoice.invoiceNumber}>
      <Page size="A4" style={styles.page}>
        <View style={styles.shell}>
          <View style={styles.header}>
            <View>
              <Text style={styles.heading}>Invoice</Text>
              <Text>{invoice.invoiceNumber}</Text>
              <Text style={[styles.muted, { marginTop: 4 }]}>
                Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
              </Text>
            </View>
            <Text style={[styles.badge, { backgroundColor: brandColor }]}>PDF copy</Text>
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Bill to</Text>
              <Text style={styles.infoLine}>{invoice.clientSnapshot?.name || "No client"}</Text>
              {invoice.clientSnapshot?.company ? (
                <Text style={styles.infoLine}>{invoice.clientSnapshot.company}</Text>
              ) : null}
              {invoice.clientSnapshot?.email ? (
                <Text style={styles.infoLine}>{invoice.clientSnapshot.email}</Text>
              ) : null}
              {invoice.clientSnapshot?.phone ? (
                <Text style={styles.infoLine}>{invoice.clientSnapshot.phone}</Text>
              ) : null}
              {invoice.clientSnapshot?.address ? (
                <Text>{invoice.clientSnapshot.address}</Text>
              ) : null}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>From</Text>
              <Text style={styles.infoLine}>{companyName}</Text>
              <Text style={styles.infoLine}>{user.email}</Text>
              {user.phone ? <Text style={styles.infoLine}>{user.phone}</Text> : null}
              {user.website ? <Text style={styles.infoLine}>{user.website}</Text> : null}
              {user.companyAddress ? <Text>{user.companyAddress}</Text> : null}
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Issue date</Text>
              <Text style={styles.metricValue}>{formatDate(invoice.issueDate)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Due date</Text>
              <Text style={styles.metricValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Amount due</Text>
              <Text style={styles.metricValue}>{formatMoney(invoice.currency, invoice.total)}</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.descriptionColumn}>Description</Text>
              <Text style={styles.smallColumn}>Qty</Text>
              <Text style={styles.smallColumn}>Rate</Text>
              <Text style={styles.amountColumn}>Amount</Text>
            </View>
            {invoice.lineItems.map((item, index) => (
              <View key={`${item.description}-${index}`} style={styles.row}>
                <Text style={styles.descriptionColumn}>{item.description}</Text>
                <Text style={styles.smallColumn}>{item.quantity}</Text>
                <Text style={styles.smallColumn}>
                  {formatMoney(invoice.currency, item.rate)}
                </Text>
                <Text style={styles.amountColumn}>
                  {formatMoney(invoice.currency, item.amount)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsWrap}>
            <View style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text style={styles.muted}>Subtotal</Text>
                <Text>{formatMoney(invoice.currency, invoice.subtotal)}</Text>
              </View>
              {invoice.salesTaxEnabled ? (
                <View style={styles.totalRow}>
                  <Text style={styles.muted}>Sales tax ({invoice.salesTaxRate}%)</Text>
                  <Text>{formatMoney(invoice.currency, invoice.salesTaxAmount)}</Text>
                </View>
              ) : null}
              {invoice.vatEnabled ? (
                <View style={styles.totalRow}>
                  <Text style={styles.muted}>VAT ({invoice.vatRate}%)</Text>
                  <Text>{formatMoney(invoice.currency, invoice.vatAmount)}</Text>
                </View>
              ) : null}
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text>Total</Text>
                <Text>{formatMoney(invoice.currency, invoice.total)}</Text>
              </View>
            </View>
          </View>

          {invoice.notes ? (
            <View style={styles.footerCard}>
              <Text style={styles.sectionLabel}>Notes</Text>
              <Text>{invoice.notes}</Text>
            </View>
          ) : null}

          {invoice.paymentInstructions ? (
            <View style={styles.footerCard}>
              <Text style={styles.sectionLabel}>Payment instructions</Text>
              <Text>{invoice.paymentInstructions}</Text>
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

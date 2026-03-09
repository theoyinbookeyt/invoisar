import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

function generatePublicToken(): string {
  return crypto.randomUUID();
}

function generateInvoiceNumber(prefix: string, sequence: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${sequence.toString().padStart(4, "0")}`;
}

function toClientSnapshot(client: Doc<"clients">) {
  return {
    name: client.name,
    email: client.email,
    ...(client.company !== undefined ? { company: client.company } : {}),
    ...(client.phone !== undefined ? { phone: client.phone } : {}),
    ...(client.address !== undefined ? { address: client.address } : {}),
  };
}

function getInvoiceTotals(args: {
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  salesTaxEnabled: boolean;
  salesTaxRate: number;
  vatEnabled: boolean;
  vatRate: number;
}) {
  const subtotal = args.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const salesTaxAmount = args.salesTaxEnabled
    ? subtotal * (args.salesTaxRate / 100)
    : 0;
  const vatAmount = args.vatEnabled ? subtotal * (args.vatRate / 100) : 0;

  return {
    subtotal,
    salesTaxAmount,
    vatAmount,
    total: subtotal + salesTaxAmount + vatAmount,
  };
}

async function getNextInvoiceNumber(
  ctx: MutationCtx,
  userId: Id<"users">,
  prefix: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await ctx.db
    .query("invoiceCounters")
    .withIndex("by_user_year", (q) => q.eq("userId", userId).eq("year", year))
    .first();

  let sequence = 1;
  if (counter) {
    sequence = counter.sequence + 1;
    await ctx.db.patch("invoiceCounters", counter._id, { sequence });
  } else {
    await ctx.db.insert("invoiceCounters", {
      userId,
      year,
      sequence,
    });
  }

  return generateInvoiceNumber(prefix, sequence);
}

export const listInvoicesByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getInvoiceById = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db.get("invoices", args.invoiceId);
  },
});

export const getInvoiceByPublicToken = query({
  args: { publicToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_public_token", (q) => q.eq("publicToken", args.publicToken))
      .first();
  },
});

export const createInvoice = mutation({
  args: {
    userId: v.id("users"),
    clientId: v.optional(v.id("clients")),
    clientSnapshot: v.optional(
      v.object({
        name: v.string(),
        email: v.string(),
        company: v.optional(v.string()),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
      }),
    ),
    issueDate: v.string(),
    dueDate: v.string(),
    currency: v.string(),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        rate: v.number(),
        amount: v.number(),
      }),
    ),
    salesTaxEnabled: v.boolean(),
    salesTaxRate: v.number(),
    vatEnabled: v.boolean(),
    vatRate: v.number(),
    notes: v.optional(v.string()),
    paymentInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    let clientSnapshot = args.clientSnapshot;

    if (args.clientId) {
      const client = await ctx.db.get("clients", args.clientId);
      if (!client || client.userId !== args.userId) {
        throw new Error("Client not found");
      }

      clientSnapshot = toClientSnapshot(client);
    }

    if (!clientSnapshot) {
      throw new Error("Client details are required");
    }

    const { subtotal, salesTaxAmount, vatAmount, total } = getInvoiceTotals({
      lineItems: args.lineItems,
      salesTaxEnabled: args.salesTaxEnabled,
      salesTaxRate: args.salesTaxRate,
      vatEnabled: args.vatEnabled,
      vatRate: args.vatRate,
    });
    const paymentInstructions = args.paymentInstructions ?? user.paymentInstructions;
    const invoiceNumber = await getNextInvoiceNumber(
      ctx,
      args.userId,
      user.invoicePrefix,
    );

    return await ctx.db.insert("invoices", {
      userId: args.userId,
      invoiceNumber,
      ...(args.clientId !== undefined ? { clientId: args.clientId } : {}),
      clientSnapshot,
      status: "draft",
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      currency: args.currency,
      lineItems: args.lineItems,
      subtotal,
      salesTaxEnabled: args.salesTaxEnabled,
      salesTaxRate: args.salesTaxRate,
      salesTaxAmount,
      vatEnabled: args.vatEnabled,
      vatRate: args.vatRate,
      vatAmount,
      total,
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
      ...(paymentInstructions !== undefined
        ? { paymentInstructions }
        : {}),
      publicToken: generatePublicToken(),
      amountPaid: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
    updates: v.object({
      clientId: v.optional(v.id("clients")),
      clientSnapshot: v.optional(
        v.object({
          name: v.string(),
          email: v.string(),
          company: v.optional(v.string()),
          phone: v.optional(v.string()),
          address: v.optional(v.string()),
        }),
      ),
      issueDate: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      currency: v.optional(v.string()),
      lineItems: v.optional(
        v.array(
          v.object({
            description: v.string(),
            quantity: v.number(),
            rate: v.number(),
            amount: v.number(),
          }),
        ),
      ),
      salesTaxEnabled: v.optional(v.boolean()),
      salesTaxRate: v.optional(v.number()),
      vatEnabled: v.optional(v.boolean()),
      vatRate: v.optional(v.number()),
      notes: v.optional(v.string()),
      paymentInstructions: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get("invoices", args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const patch: {
      clientId?: Id<"clients">;
      issueDate?: string;
      dueDate?: string;
      currency?: string;
      lineItems?: Array<{
        description: string;
        quantity: number;
        rate: number;
        amount: number;
      }>;
      salesTaxEnabled?: boolean;
      salesTaxRate?: number;
      vatEnabled?: boolean;
      vatRate?: number;
      notes?: string;
      paymentInstructions?: string;
      subtotal?: number;
      salesTaxAmount?: number;
      vatAmount?: number;
      total?: number;
      clientSnapshot?: {
        name: string;
        email: string;
        company?: string;
        phone?: string;
        address?: string;
      };
    } = { ...args.updates };

    if (args.updates.clientId) {
      const client = await ctx.db.get("clients", args.updates.clientId);
      if (!client || client.userId !== invoice.userId) {
        throw new Error("Client not found");
      }

      patch.clientSnapshot = toClientSnapshot(client);
    }

    if (args.updates.clientSnapshot) {
      patch.clientSnapshot = args.updates.clientSnapshot;
    }

    if (
      args.updates.lineItems ||
      args.updates.salesTaxEnabled !== undefined ||
      args.updates.salesTaxRate !== undefined ||
      args.updates.vatEnabled !== undefined ||
      args.updates.vatRate !== undefined
    ) {
      const totals = getInvoiceTotals({
        lineItems: args.updates.lineItems ?? invoice.lineItems,
        salesTaxEnabled: args.updates.salesTaxEnabled ?? invoice.salesTaxEnabled,
        salesTaxRate: args.updates.salesTaxRate ?? invoice.salesTaxRate,
        vatEnabled: args.updates.vatEnabled ?? invoice.vatEnabled,
        vatRate: args.updates.vatRate ?? invoice.vatRate,
      });
      patch.subtotal = totals.subtotal;
      patch.salesTaxAmount = totals.salesTaxAmount;
      patch.vatAmount = totals.vatAmount;
      patch.total = totals.total;
    }

    await ctx.db.patch("invoices", args.invoiceId, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const sendInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    await ctx.db.patch("invoices", args.invoiceId, {
      status: "sent",
      sentAt: new Date().toISOString(),
      lastEmailError: undefined,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const recordEmailFailure = mutation({
  args: {
    invoiceId: v.id("invoices"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("invoices", args.invoiceId, {
      lastEmailError: args.message,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const linkClientToInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get("invoices", args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const client = await ctx.db.get("clients", args.clientId);
    if (!client || client.userId !== invoice.userId) {
      throw new Error("Client not found");
    }

    await ctx.db.patch("invoices", args.invoiceId, {
      clientId: args.clientId,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const markInvoiceAsPaid = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get("invoices", args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.db.patch("invoices", args.invoiceId, {
      status: "paid",
      paidAt: new Date().toISOString(),
      amountPaid: invoice.total,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const voidInvoice = mutation({
  args: { invoiceId: v.id("invoices"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch("invoices", args.invoiceId, {
      status: "voided",
      voidedAt: new Date().toISOString(),
      voidReason: args.reason,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.invoiceId);
  },
});

export const getInvoiceStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      total: invoices.length,
      draft: invoices.filter((invoice) => invoice.status === "draft").length,
      sent: invoices.filter((invoice) => invoice.status === "sent").length,
      paid: invoices.filter((invoice) => invoice.status === "paid").length,
      overdue: invoices.filter((invoice) => invoice.status === "overdue").length,
      voided: invoices.filter((invoice) => invoice.status === "voided").length,
    };
  },
});

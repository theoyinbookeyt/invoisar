import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    invoicePrefix: v.string(),
    defaultCurrency: v.string(),
    defaultPaymentTermsDays: v.number(),
    paymentInstructions: v.optional(v.string()),
    brandColor: v.string(),
    salesTaxEnabled: v.boolean(),
    salesTaxRate: v.number(),
    vatEnabled: v.boolean(),
    vatRate: v.number(),
    notifyInvoiceViewed: v.optional(v.boolean()),
    notifyInvoiceOverdue: v.optional(v.boolean()),
    notifyInvoiceDueSoon: v.optional(v.boolean()),
    notifyInvoicePaid: v.optional(v.boolean()),
    plan: v.union(v.literal("free"), v.literal("pro")),
    planOverriddenByAdmin: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_email", ["email"]),

  clients: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    isArchived: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_email", ["userId", "email"]),

  invoices: defineTable({
    userId: v.id("users"),
    invoiceNumber: v.string(),
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
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("overdue"),
      v.literal("paid"),
      v.literal("voided"),
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
    subtotal: v.number(),
    salesTaxEnabled: v.boolean(),
    salesTaxRate: v.number(),
    salesTaxAmount: v.number(),
    vatEnabled: v.boolean(),
    vatRate: v.number(),
    vatAmount: v.number(),
    total: v.number(),
    notes: v.optional(v.string()),
    paymentInstructions: v.optional(v.string()),
    publicToken: v.string(),
    amountPaid: v.number(),
    paidAt: v.optional(v.string()),
    sentAt: v.optional(v.string()),
    lastEmailError: v.optional(v.string()),
    voidedAt: v.optional(v.string()),
    voidReason: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_public_token", ["publicToken"])
    .index("by_client", ["clientId"]),

  invoiceCounters: defineTable({
    userId: v.id("users"),
    year: v.number(),
    sequence: v.number(),
  }).index("by_user_year", ["userId", "year"]),
});

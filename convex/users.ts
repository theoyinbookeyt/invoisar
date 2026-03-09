import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId),
      )
      .first();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get("users", args.userId);
  },
});

export const createUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId),
      )
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const now = new Date().toISOString();
    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      ...(args.displayName !== undefined
        ? { displayName: args.displayName }
        : {}),
      invoicePrefix: "INV",
      defaultCurrency: "USD",
      defaultPaymentTermsDays: 30,
      brandColor: "#3B82F6",
      salesTaxEnabled: false,
      salesTaxRate: 0,
      vatEnabled: false,
      vatRate: 0,
      notifyInvoiceViewed: false,
      notifyInvoiceOverdue: true,
      notifyInvoiceDueSoon: true,
      notifyInvoicePaid: true,
      plan: "free",
      planOverriddenByAdmin: false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("invoiceCounters", {
      userId,
      year: new Date().getFullYear(),
      sequence: 0,
    });

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      companyName: v.optional(v.string()),
      companyAddress: v.optional(v.string()),
      phone: v.optional(v.string()),
      website: v.optional(v.string()),
      invoicePrefix: v.optional(v.string()),
      defaultCurrency: v.optional(v.string()),
      defaultPaymentTermsDays: v.optional(v.number()),
      paymentInstructions: v.optional(v.string()),
      brandColor: v.optional(v.string()),
      salesTaxEnabled: v.optional(v.boolean()),
      salesTaxRate: v.optional(v.number()),
      vatEnabled: v.optional(v.boolean()),
      vatRate: v.optional(v.number()),
      notifyInvoiceViewed: v.optional(v.boolean()),
      notifyInvoiceOverdue: v.optional(v.boolean()),
      notifyInvoiceDueSoon: v.optional(v.boolean()),
      notifyInvoicePaid: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("users", args.userId, {
      ...args.updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").take(100);
  },
});

export const getUserCount = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});

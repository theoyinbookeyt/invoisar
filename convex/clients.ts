import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listClientsByUser = query({
  args: {
    userId: v.id("users"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (args.includeArchived) {
      return clients;
    }

    return clients.filter((client) => !client.isArchived);
  },
});

export const getClientById = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get("clients", args.clientId);
  },
});

export const createClient = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const normalizedEmail = args.email.trim();
    const existingClients = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const existingClient = existingClients.find(
      (client) => client.email.toLowerCase() === normalizedEmail.toLowerCase(),
    );

    if (existingClient) {
      await ctx.db.patch(existingClient._id, {
        name: args.name,
        email: normalizedEmail,
        ...(args.company !== undefined ? { company: args.company } : {}),
        ...(args.phone !== undefined ? { phone: args.phone } : {}),
        ...(args.address !== undefined ? { address: args.address } : {}),
        ...(args.notes !== undefined ? { notes: args.notes } : {}),
        isArchived: false,
        updatedAt: now,
      });

      return { clientId: existingClient._id, created: false };
    }

    const clientId = await ctx.db.insert("clients", {
      userId: args.userId,
      name: args.name,
      email: normalizedEmail,
      ...(args.company !== undefined ? { company: args.company } : {}),
      ...(args.phone !== undefined ? { phone: args.phone } : {}),
      ...(args.address !== undefined ? { address: args.address } : {}),
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    return { clientId, created: true };
  },
});

export const updateClient = mutation({
  args: {
    clientId: v.id("clients"),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      company: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      notes: v.optional(v.string()),
      isArchived: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("clients", args.clientId, {
      ...args.updates,
      ...(args.updates.email !== undefined
        ? { email: args.updates.email.trim() }
        : {}),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteClient = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (invoices.length > 0) {
      await ctx.db.patch(args.clientId, {
        isArchived: true,
        updatedAt: new Date().toISOString(),
      });

      return { deleted: false, archived: true };
    }

    await ctx.db.delete(args.clientId);
    return { deleted: true, archived: false };
  },
});

export const getClientCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return clients.filter((client) => !client.isArchived).length;
  },
});

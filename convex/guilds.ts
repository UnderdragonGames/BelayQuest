import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    name: v.string(),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, { name, memberIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // First guild becomes default automatically
    const existingGuilds = await ctx.db
      .query("guilds")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const isDefault = existingGuilds.length === 0;

    const guildId = await ctx.db.insert("guilds", {
      ownerId: userId,
      name,
      isDefault,
    });

    // Add creator as first member, then invited members
    await ctx.db.insert("guildMembers", { guildId, userId });
    for (const memberId of memberIds) {
      if (memberId !== userId) {
        await ctx.db.insert("guildMembers", { guildId, userId: memberId });
      }
    }

    return guildId;
  },
});

export const addMember = mutation({
  args: {
    guildId: v.id("guilds"),
    userId: v.id("users"),
  },
  handler: async (ctx, { guildId, userId: targetUserId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const guild = await ctx.db.get(guildId);
    if (!guild || guild.ownerId !== userId) throw new Error("Guild not found");

    const existing = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild", (q) => q.eq("guildId", guildId))
      .filter((q) => q.eq(q.field("userId"), targetUserId))
      .unique();

    if (!existing) {
      await ctx.db.insert("guildMembers", { guildId, userId: targetUserId });
    }
  },
});

export const removeMember = mutation({
  args: {
    guildId: v.id("guilds"),
    userId: v.id("users"),
  },
  handler: async (ctx, { guildId, userId: targetUserId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const guild = await ctx.db.get(guildId);
    if (!guild || guild.ownerId !== userId) throw new Error("Guild not found");

    const member = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild", (q) => q.eq("guildId", guildId))
      .filter((q) => q.eq(q.field("userId"), targetUserId))
      .unique();

    if (member) {
      await ctx.db.delete(member._id);
    }
  },
});

export const setDefault = mutation({
  args: { guildId: v.id("guilds") },
  handler: async (ctx, { guildId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const guild = await ctx.db.get(guildId);
    if (!guild || guild.ownerId !== userId) throw new Error("Guild not found");

    const allGuilds = await ctx.db
      .query("guilds")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    await Promise.all(
      allGuilds.map((g) => {
        if (g._id !== guildId && g.isDefault) {
          return ctx.db.patch(g._id, { isDefault: false });
        }
      })
    );

    await ctx.db.patch(guildId, { isDefault: true });
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── myItems ──────────────────────────────────────────────────
// Returns the user's held inventory items grouped by type.
export const myItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "held")
      )
      .collect();

    // Group by itemType
    const grouped: Record<
      string,
      { itemType: string; count: number; items: typeof items }
    > = {};
    for (const item of items) {
      if (!grouped[item.itemType]) {
        grouped[item.itemType] = { itemType: item.itemType, count: 0, items: [] };
      }
      grouped[item.itemType].count++;
      grouped[item.itemType].items.push(item);
    }

    return Object.values(grouped).sort((a, b) =>
      a.itemType.localeCompare(b.itemType)
    );
  },
});

// ─── use ──────────────────────────────────────────────────────
// Mark an inventory item as used. Consumables apply a short buff.
export const use = mutation({
  args: { itemId: v.id("inventoryItems") },
  handler: async (ctx, { itemId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");
    if (item.userId !== userId) throw new Error("Not your item");
    if (item.status !== "held") throw new Error("Item already used");

    await ctx.db.patch(itemId, { status: "used", usedAt: Date.now() });

    // Consumable items grant a short buff when used
    const CONSUMABLE_BUFFS: Record<string, string> = {
      chalk: "Chalk Hands",
      chalk_bag: "Chalk Hands",
      liquid_chalk: "Iron Fingers",
      energy_bar: "Featherfall",
    };

    const effect = CONSUMABLE_BUFFS[item.itemType];
    if (effect) {
      await ctx.db.patch(userId, {
        currentStatus: {
          effect,
          type: "buff",
          expiresAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
        },
      });
      return { effect };
    }

    return { effect: null };
  },
});

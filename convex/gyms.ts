import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Full-text search for gyms by name.
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchQuery }) => {
    if (searchQuery.trim().length === 0) {
      return [];
    }
    const results = await ctx.db
      .query("gyms")
      .withSearchIndex("search_name", (q) => q.search("name", searchQuery))
      .take(20);
    return results;
  },
});

/**
 * List all gyms. Client-side sorting by distance.
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("gyms").collect();
  },
});

export const myFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    const favoriteGyms = user.favoriteGyms ?? [];
    const gyms = await Promise.all(
      favoriteGyms.map(async (gymId) => {
        const gym = await ctx.db.get(gymId);
        return gym;
      })
    );

    return gyms.filter((g): g is NonNullable<typeof g> => g !== null);
  },
});

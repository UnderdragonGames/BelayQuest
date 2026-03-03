import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Check whether a generated name is already taken.
 */
export const checkNameAvailable = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_generatedName", (q) => q.eq("generatedName", name))
      .first();
    return existing === null;
  },
});

/**
 * Get the current user's profile. Returns null if not onboarded yet.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

/**
 * Complete onboarding — patches the auth-created user with wizard-collected data.
 */
export const completeOnboarding = mutation({
  args: {
    generatedName: v.string(),
    climbingStyles: v.array(v.string()),
    gradeRangeRoute: v.optional(
      v.object({ min: v.string(), max: v.string() })
    ),
    gradeRangeBoulder: v.optional(
      v.object({ min: v.string(), max: v.string() })
    ),
    yearsClimbing: v.optional(v.string()),
    favoriteGyms: v.array(v.id("gyms")),
    invitePhones: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check name uniqueness one final time
    const existing = await ctx.db
      .query("users")
      .withIndex("by_generatedName", (q) =>
        q.eq("generatedName", args.generatedName)
      )
      .first();
    if (existing && existing._id !== userId) {
      throw new Error("Name is already taken. Please choose another.");
    }

    await ctx.db.patch(userId, {
      generatedName: args.generatedName,
      climbingStyles: args.climbingStyles,
      gradeRangeRoute: args.gradeRangeRoute,
      gradeRangeBoulder: args.gradeRangeBoulder,
      yearsClimbing: args.yearsClimbing,
      level: 1,
      totalXp: 0,
      favoriteGyms: args.favoriteGyms,
      pendingInvitePhones:
        args.invitePhones.length > 0 ? args.invitePhones : undefined,
      onboardingComplete: true,
    });

    return userId;
  },
});

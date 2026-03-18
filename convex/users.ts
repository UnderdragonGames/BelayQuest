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
    avatarStorageId: v.optional(v.id("_storage")),
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

    const avatarUrl = args.avatarStorageId
      ? (await ctx.storage.getUrl(args.avatarStorageId)) ?? undefined
      : undefined;

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
      ...(args.avatarStorageId && {
        avatarStorageId: args.avatarStorageId,
        avatarUrl,
      }),
    });

    return userId;
  },
});


// ─── storePushToken ───────────────────────────────────────────
// Called from the app after notification permission is granted.
export const storePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    await ctx.db.patch(userId, { expoPushToken: args.token });
  },
});


// ─── updateAvatarDefaults ─────────────────────────────────────
// Saves the user's default avatar customization.
export const updateAvatarDefaults = mutation({
  args: {
    hair: v.union(v.literal("medium"), v.literal("hat")),
    hairColor: v.string(),
    skinTone: v.union(v.literal(1), v.literal(2), v.literal(3)),
    glasses: v.boolean(),
    glassesColor: v.optional(v.string()),
    shirtColor: v.string(),
    pantsType: v.union(v.literal("pants"), v.literal("shorts")),
    pantsColor: v.string(),
    harness: v.boolean(),
    harnessColor: v.optional(v.string()),
    shoeColor: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { avatarDefaults: args });
  },
});

// ─── updateAvatarGymOverride ──────────────────────────────────
// Upserts a partial avatar override for a specific gym.
// Only the provided fields are stored; the rest fall back to avatarDefaults.
export const updateAvatarGymOverride = mutation({
  args: {
    gymId: v.id("gyms"),
    overrides: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("avatarGymOverrides")
      .withIndex("by_user_gym", (q) =>
        q.eq("userId", userId).eq("gymId", args.gymId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        overrides: args.overrides,
        lastUsedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("avatarGymOverrides", {
        userId,
        gymId: args.gymId,
        overrides: args.overrides,
        lastUsedAt: Date.now(),
      });
    }
  },
});

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── saveAvatarStorageId (internal mutation) ──────────────────────────────
// Called from generateAvatar action to persist storageId and return serving URL.
export const saveAvatarStorageId = internalMutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { userId, storageId }) => {
    const url = await ctx.storage.getUrl(storageId);
    await ctx.db.patch(userId, {
      avatarStorageId: storageId,
      avatarUrl: url ?? undefined,
    });
    return url;
  },
});

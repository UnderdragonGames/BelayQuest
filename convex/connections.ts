import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { parsePhoneNumber } from "libphonenumber-js";

function normalizePhone(phone: string): string {
  try {
    return parsePhoneNumber(phone, "US").format("E.164");
  } catch {
    // Fallback: strip non-digits, prepend +1 if 10-digit US number
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return phone;
  }
}

export const myConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const connections = await ctx.db
      .query("connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const results = await Promise.all(
      connections.map(async (conn) => {
        const connectedUser = await ctx.db.get(conn.connectedUserId);
        if (!connectedUser) return null;
        return {
          _id: conn._id,
          connectedUserId: conn.connectedUserId,
          nickname: conn.nickname,
          source: conn.source,
          createdAt: conn.createdAt,
          generatedName: connectedUser.generatedName,
          level: connectedUser.level,
          climbingStyles: connectedUser.climbingStyles,
          maxGradeRoute: connectedUser.maxGradeRoute,
          maxGradeBoulder: connectedUser.maxGradeBoulder,
          currentStatus: connectedUser.currentStatus,
        };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const myGuilds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const guilds = await ctx.db
      .query("guilds")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const results = await Promise.all(
      guilds.map(async (guild) => {
        const memberRows = await ctx.db
          .query("guildMembers")
          .withIndex("by_guild", (q) => q.eq("guildId", guild._id))
          .collect();

        const members = await Promise.all(
          memberRows.map(async (row) => {
            const memberUser = await ctx.db.get(row.userId);
            if (!memberUser) return null;

            const connection = await ctx.db
              .query("connections")
              .withIndex("by_user_connected", (q) =>
                q.eq("userId", userId).eq("connectedUserId", row.userId)
              )
              .unique();

            return {
              userId: row.userId,
              generatedName: memberUser.generatedName,
              level: memberUser.level,
              nickname: connection?.nickname,
            };
          })
        );

        return {
          _id: guild._id,
          name: guild.name,
          isDefault: guild.isDefault,
          members: members.filter(
            (m): m is NonNullable<typeof m> => m !== null
          ),
        };
      })
    );

    return results;
  },
});

export const addByPhone = mutation({
  args: {
    phone: v.string(),
    nickname: v.optional(v.string()),
    sessionId: v.optional(v.id("sessions")),
  },
  handler: async (ctx, { phone, nickname, sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const normalized = normalizePhone(phone);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("phone", (q) => q.eq("phone", normalized))
      .unique();

    if (existingUser && existingUser._id !== userId) {
      const alreadyConnected = await ctx.db
        .query("connections")
        .withIndex("by_user_connected", (q) =>
          q.eq("userId", userId).eq("connectedUserId", existingUser._id)
        )
        .unique();

      if (!alreadyConnected) {
        await ctx.db.insert("connections", {
          userId,
          connectedUserId: existingUser._id,
          nickname,
          source: "phone",
          createdAt: Date.now(),
        });
      }
      return { found: true };
    } else {
      // No account found — record the pending invite phone
      const me = await ctx.db.get(userId);
      if (!me) throw new Error("User not found");
      const pending = me.pendingInvitePhones ?? [];
      if (!pending.includes(normalized)) {
        await ctx.db.patch(userId, {
          pendingInvitePhones: [...pending, normalized],
        });
      }
      // Send SMS invite if a session context is provided
      if (sessionId) {
        await ctx.scheduler.runAfter(0, internal.sms.sendInvite, {
          phone: normalized,
          sessionId,
          inviterUserId: userId,
        });
      }
      return { found: false };
    }
  },
});

export const addByPhoneBatch = mutation({
  args: {
    entries: v.array(
      v.object({ phone: v.string(), nickname: v.optional(v.string()) })
    ),
    sessionId: v.optional(v.id("sessions")),
  },
  handler: async (ctx, { entries, sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const results: { phone: string; found: boolean }[] = [];

    for (const { phone, nickname } of entries) {
      const normalized = normalizePhone(phone);

      const existingUser = await ctx.db
        .query("users")
        .withIndex("phone", (q) => q.eq("phone", normalized))
        .unique();

      if (existingUser && existingUser._id !== userId) {
        const alreadyConnected = await ctx.db
          .query("connections")
          .withIndex("by_user_connected", (q) =>
            q.eq("userId", userId).eq("connectedUserId", existingUser._id)
          )
          .unique();

        if (!alreadyConnected) {
          await ctx.db.insert("connections", {
            userId,
            connectedUserId: existingUser._id,
            nickname,
            source: "phone",
            createdAt: Date.now(),
          });
        }
        results.push({ phone: normalized, found: true });
      } else {
        const me = await ctx.db.get(userId);
        if (!me) throw new Error("User not found");
        const pending = me.pendingInvitePhones ?? [];
        if (!pending.includes(normalized)) {
          await ctx.db.patch(userId, {
            pendingInvitePhones: [...pending, normalized],
          });
        }
        if (sessionId) {
          await ctx.scheduler.runAfter(0, internal.sms.sendInvite, {
            phone: normalized,
            sessionId,
            inviterUserId: userId,
          });
        }
        results.push({ phone: normalized, found: false });
      }
    }

    return results;
  },
});

export const setNickname = mutation({
  args: {
    connectionId: v.id("connections"),
    nickname: v.string(),
  },
  handler: async (ctx, { connectionId, nickname }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conn = await ctx.db.get(connectionId);
    if (!conn || conn.userId !== userId) throw new Error("Connection not found");

    await ctx.db.patch(connectionId, { nickname });
  },
});

export const remove = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, { connectionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conn = await ctx.db.get(connectionId);
    if (!conn || conn.userId !== userId) throw new Error("Connection not found");

    await ctx.db.delete(connectionId);
  },
});

export const matchFromQuest = mutation({
  args: {
    sessionId: v.id("sessions"),
    toUserId: v.id("users"),
    response: v.union(v.literal("yes"), v.literal("no")),
  },
  handler: async (ctx, { sessionId, toUserId, response }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Upsert this user's response
    const existing = await ctx.db
      .query("questMatches")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    const myRecord = existing.find(
      (m) => m.fromUserId === userId && m.toUserId === toUserId
    );

    if (myRecord) {
      await ctx.db.patch(myRecord._id, { response, respondedAt: Date.now() });
    } else {
      await ctx.db.insert("questMatches", {
        sessionId,
        fromUserId: userId,
        toUserId,
        response,
        respondedAt: Date.now(),
      });
    }

    // Check for mutual yes
    if (response === "yes") {
      const theirRecord = existing.find(
        (m) => m.fromUserId === toUserId && m.toUserId === userId
      );
      if (theirRecord?.response === "yes") {
        // Create bidirectional connection if not already connected
        const alreadyA = await ctx.db
          .query("connections")
          .withIndex("by_user_connected", (q) =>
            q.eq("userId", userId).eq("connectedUserId", toUserId)
          )
          .unique();

        if (!alreadyA) {
          await ctx.db.insert("connections", {
            userId,
            connectedUserId: toUserId,
            source: "quest_match",
            createdAt: Date.now(),
          });
        }

        const alreadyB = await ctx.db
          .query("connections")
          .withIndex("by_user_connected", (q) =>
            q.eq("userId", toUserId).eq("connectedUserId", userId)
          )
          .unique();

        if (!alreadyB) {
          await ctx.db.insert("connections", {
            userId: toUserId,
            connectedUserId: userId,
            source: "quest_match",
            createdAt: Date.now(),
          });
        }

        return { matched: true };
      }
    }

    return { matched: false };
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (!q.trim()) return [];

    const connections = await ctx.db
      .query("connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const lower = q.toLowerCase();

    const results = await Promise.all(
      connections.map(async (conn) => {
        const user = await ctx.db.get(conn.connectedUserId);
        if (!user) return null;

        const name = (user.generatedName ?? "").toLowerCase();
        const nick = (conn.nickname ?? "").toLowerCase();

        if (!name.includes(lower) && !nick.includes(lower)) return null;

        return {
          _id: conn._id,
          connectedUserId: conn.connectedUserId,
          nickname: conn.nickname,
          generatedName: user.generatedName,
          level: user.level,
        };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

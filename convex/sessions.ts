import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateShortCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─── createRaid ──────────────────────────────────────────────
export const createRaid = mutation({
  args: {
    gymId: v.id("gyms"),
    scheduledAt: v.number(),
    note: v.optional(v.string()),
    inviteUserIds: v.array(v.id("users")),
    inviteGuildIds: v.array(v.id("guilds")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Collect all invited user IDs (from direct invites + guild members)
    const invitedUserIds = new Set<string>(
      args.inviteUserIds.map((id) => id.toString())
    );

    for (const guildId of args.inviteGuildIds) {
      const members = await ctx.db
        .query("guildMembers")
        .withIndex("by_guild", (q) => q.eq("guildId", guildId))
        .collect();
      for (const member of members) {
        if (member.userId !== userId) {
          invitedUserIds.add(member.userId.toString());
        }
      }
    }

    const shortCode = generateShortCode();

    const sessionId = await ctx.db.insert("sessions", {
      type: "raid",
      creatorId: userId,
      leaderId: userId,
      gymId: args.gymId,
      scheduledAt: args.scheduledAt,
      note: args.note,
      status: "draft",
      shortCode,
    });

    // Creator is automatically accepted
    await ctx.db.insert("sessionMembers", {
      sessionId,
      userId,
      status: "accepted",
      invitedBy: userId,
      checkedIn: false,
    });

    // Create invited member rows
    for (const inviteeIdStr of invitedUserIds) {
      const inviteeId = inviteeIdStr as Id<"users">;
      await ctx.db.insert("sessionMembers", {
        sessionId,
        userId: inviteeId,
        status: "invited",
        invitedBy: userId,
        checkedIn: false,
      });
    }

    return sessionId;
  },
});

// ─── confirmRaid ─────────────────────────────────────────────
export const confirmRaid = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.creatorId !== userId)
      throw new Error("Only the creator can confirm a raid");
    if (session.status !== "draft")
      throw new Error("Session is not in draft status");

    await ctx.db.patch(args.sessionId, { status: "open" });

    // TODO: Fire push notifications to all invited members
    // For each sessionMember with status "invited", look up their
    // expoPushToken and send a push notification using the
    // "notif.raid.invite" copy string.
  },
});

// ─── quickRaid ───────────────────────────────────────────────
export const quickRaid = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Get user's default guild
    const guilds = await ctx.db
      .query("guilds")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    const defaultGuild = guilds.find((g) => g.isDefault) ?? guilds[0];
    if (!defaultGuild) throw new Error("No guild found");

    // Find most-used gym: gym with the most past sessions created by this user
    const pastSessions = await ctx.db
      .query("sessions")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .collect();

    const gymCounts: Record<string, number> = {};
    for (const s of pastSessions) {
      gymCounts[s.gymId] = (gymCounts[s.gymId] ?? 0) + 1;
    }

    let mostUsedGymId: Id<"gyms">;
    if (Object.keys(gymCounts).length > 0) {
      mostUsedGymId = Object.entries(gymCounts).sort(
        (a, b) => b[1] - a[1]
      )[0][0] as Id<"gyms">;
    } else if ((user.favoriteGyms ?? []).length > 0) {
      // Fallback to first favorite gym
      mostUsedGymId = (user.favoriteGyms ?? [])[0];
    } else {
      throw new Error("No favorite gyms found");
    }

    // Look at past completed raids with the same guild for day/time pattern
    const completedRaids = pastSessions.filter(
      (s) => s.type === "raid" && s.status === "completed"
    );

    // Default to "today, same time as most recent raid" or 6pm if no history
    let scheduledAt: number;
    if (completedRaids.length > 0) {
      const lastRaid = completedRaids.sort(
        (a, b) => b.scheduledAt - a.scheduledAt
      )[0];
      const lastDate = new Date(lastRaid.scheduledAt);
      const now = new Date();
      const scheduled = new Date(now);
      scheduled.setHours(lastDate.getHours(), lastDate.getMinutes(), 0, 0);
      // If that time has already passed today, schedule for tomorrow
      if (scheduled.getTime() < now.getTime()) {
        scheduled.setDate(scheduled.getDate() + 1);
      }
      scheduledAt = scheduled.getTime();
    } else {
      // Default to today at 6pm (or tomorrow if past 6pm)
      const now = new Date();
      const sixPm = new Date(now);
      sixPm.setHours(18, 0, 0, 0);
      if (sixPm.getTime() < now.getTime()) {
        sixPm.setDate(sixPm.getDate() + 1);
      }
      scheduledAt = sixPm.getTime();
    }

    // Gather guild members for invites
    const guildMembers = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild", (q) => q.eq("guildId", defaultGuild._id))
      .collect();
    const inviteMemberIds = guildMembers
      .filter((m) => m.userId !== userId)
      .map((m) => m.userId);

    const shortCode = generateShortCode();

    const sessionId = await ctx.db.insert("sessions", {
      type: "raid",
      creatorId: userId,
      leaderId: userId,
      gymId: mostUsedGymId,
      scheduledAt,
      status: "draft",
      shortCode,
    });

    // Creator accepted
    await ctx.db.insert("sessionMembers", {
      sessionId,
      userId,
      status: "accepted",
      invitedBy: userId,
      checkedIn: false,
    });

    // Invite guild members
    for (const memberId of inviteMemberIds) {
      await ctx.db.insert("sessionMembers", {
        sessionId,
        userId: memberId,
        status: "invited",
        invitedBy: userId,
        checkedIn: false,
      });
    }

    // Return session details for UI pre-fill
    const gym = await ctx.db.get(mostUsedGymId);

    const memberDetails = await Promise.all(
      inviteMemberIds.map(async (uid) => {
        const u = await ctx.db.get(uid);
        const connection = await ctx.db
          .query("connections")
          .withIndex("by_user_connected", (q) =>
            q.eq("userId", userId).eq("connectedUserId", uid)
          )
          .unique();
        return u
          ? {
              userId: uid,
              generatedName: u.generatedName,
              level: u.level,
              nickname: connection?.nickname,
            }
          : null;
      })
    );

    return {
      sessionId,
      gymId: mostUsedGymId,
      gymName: gym?.name ?? "Unknown Gym",
      scheduledAt,
      guildName: defaultGuild.name,
      invitedMembers: memberDetails.filter(
        (m): m is NonNullable<typeof m> => m !== null
      ),
    };
  },
});

// ─── myUpcoming ──────────────────────────────────────────────
export const myUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all session memberships for this user
    const memberships = await ctx.db
      .query("sessionMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const relevantMemberships = memberships.filter(
      (m) => m.status === "invited" || m.status === "accepted"
    );

    const sessions = await Promise.all(
      relevantMemberships.map(async (membership) => {
        const session = await ctx.db.get(membership.sessionId);
        if (!session) return null;
        if (
          session.status !== "draft" &&
          session.status !== "open" &&
          session.status !== "active"
        )
          return null;

        const gym = await ctx.db.get(session.gymId);

        // Get all members for this session
        const allMembers = await ctx.db
          .query("sessionMembers")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        const memberDetails = await Promise.all(
          allMembers.map(async (m) => {
            const memberUser = await ctx.db.get(m.userId);
            if (!memberUser) return null;

            const connection = await ctx.db
              .query("connections")
              .withIndex("by_user_connected", (q) =>
                q.eq("userId", userId).eq("connectedUserId", m.userId)
              )
              .unique();

            return {
              userId: m.userId,
              generatedName: memberUser.generatedName,
              level: memberUser.level,
              status: m.status,
              nickname: connection?.nickname,
              isCurrentUser: m.userId === userId,
            };
          })
        );

        return {
          _id: session._id,
          type: session.type,
          status: session.status,
          gymName: gym?.name ?? "Unknown Gym",
          scheduledAt: session.scheduledAt,
          note: session.note,
          shortCode: session.shortCode,
          myStatus: membership.status,
          members: memberDetails.filter(
            (m): m is NonNullable<typeof m> => m !== null
          ),
        };
      })
    );

    return sessions
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  },
});

// ─── detail ──────────────────────────────────────────────────
export const detail = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) return null;

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const gym = await ctx.db.get(session.gymId);

    const allMembers = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const memberDetails = await Promise.all(
      allMembers.map(async (m) => {
        const memberUser = await ctx.db.get(m.userId);
        if (!memberUser) return null;

        const connection = await ctx.db
          .query("connections")
          .withIndex("by_user_connected", (q) =>
            q.eq("userId", currentUserId).eq("connectedUserId", m.userId)
          )
          .unique();

        return {
          userId: m.userId,
          generatedName: memberUser.generatedName,
          level: memberUser.level,
          status: m.status,
          nickname: connection?.nickname,
          checkedIn: m.checkedIn,
          respondedAt: m.respondedAt,
          isCurrentUser: m.userId === currentUserId,
        };
      })
    );

    return {
      _id: session._id,
      type: session.type,
      creatorId: session.creatorId,
      leaderId: session.leaderId,
      gymId: session.gymId,
      gymName: gym?.name ?? "Unknown Gym",
      gymAddress: gym?.address,
      gymCity: gym?.city,
      scheduledAt: session.scheduledAt,
      note: session.note,
      status: session.status,
      shortCode: session.shortCode,
      capacity: session.capacity,
      climbingType: session.climbingType,
      gradeRange: session.gradeRange,
      members: memberDetails.filter(
        (m): m is NonNullable<typeof m> => m !== null
      ),
    };
  },
});

// ─── respondToInvite ─────────────────────────────────────────
export const respondToInvite = mutation({
  args: {
    sessionId: v.id("sessions"),
    response: v.union(v.literal("accepted"), v.literal("declined")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const membership = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .unique();

    if (!membership) throw new Error("Not a member of this session");
    if (membership.status !== "invited")
      throw new Error("Invite already responded to");

    await ctx.db.patch(membership._id, {
      status: args.response,
      respondedAt: Date.now(),
    });
  },
});

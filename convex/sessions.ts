import { mutation, query, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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

    return { sessionId, shortCode };
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

    await ctx.scheduler.runAfter(0, internal.notifications.sendRaidInvite, {
      sessionId: args.sessionId,
    });
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
      shortCode,
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
          currentStatus: memberUser.currentStatus,
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
      checkInMessage: session.checkInMessage,
      dissolveAt: session.dissolveAt,
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

// ─── getSessionIdByShortCode (public — for deep link resolution) ──
export const getSessionIdByShortCode = query({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_shortCode", (q) => q.eq("shortCode", args.shortCode))
      .unique();
    return session?._id ?? null;
  },
});

// ─── checkSessionLifecycle (internal — called by cron every 5 min) ───
export const checkSessionLifecycle = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;

    // Open sessions past scheduledAt → active
    const openSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status_scheduledAt", (q) => q.eq("status", "open"))
      .collect();

    for (const session of openSessions) {
      if (session.scheduledAt <= now) {
        await ctx.db.patch(session._id, { status: "active" });
      }
    }

    // Active sessions 2+ hrs past scheduledAt → completed
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status_scheduledAt", (q) => q.eq("status", "active"))
      .collect();

    for (const session of activeSessions) {
      if (session.scheduledAt + twoHoursMs <= now) {
        await ctx.db.patch(session._id, { status: "completed" });
      }
    }

    // Leaderless raids: dissolve past dissolveAt
    // (dissolveAt is set when a leader deserts and no one steps up)
    for (const session of activeSessions) {
      if (
        session.dissolveAt !== undefined &&
        session.dissolveAt <= now &&
        session.status !== "completed" &&
        session.status !== "dissolved"
      ) {
        await ctx.db.patch(session._id, { status: "dissolved" });
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendSessionDissolved,
          { sessionId: session._id }
        );
      }
    }

    // Also check draft sessions with dissolveAt (edge case)
    const draftSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status_scheduledAt", (q) => q.eq("status", "draft"))
      .collect();

    for (const session of draftSessions) {
      if (session.dissolveAt !== undefined && session.dissolveAt <= now) {
        await ctx.db.patch(session._id, { status: "dissolved" });
      }
    }
  },
});

// ─── sendSessionReminders (internal — called by cron every 15 min) ───
export const sendSessionReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const windowStart = now + 40 * 60 * 1000; // 40 min from now
    const windowEnd = now + 50 * 60 * 1000;   // 50 min from now (centered on 45 min)

    const upcomingSessions = await ctx.db
      .query("sessions")
      .withIndex("by_status_scheduledAt", (q) =>
        q.eq("status", "open").gte("scheduledAt", windowStart)
      )
      .collect();

    const sessionsInWindow = upcomingSessions.filter(
      (s) => s.scheduledAt <= windowEnd
    );

    for (const session of sessionsInWindow) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.sendSessionReminder,
        { sessionId: session._id }
      );
    }
  },
});

// ─── checkNoShows (internal — called by cron every 15 min) ───────────
export const checkNoShows = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;

    // Only check Quest sessions (not Raids) in the 1–3 hour post-completion window
    const recentlyCompleted = await ctx.db
      .query("sessions")
      .withIndex("by_status_scheduledAt", (q) => q.eq("status", "completed"))
      .collect();

    const inWindow = recentlyCompleted.filter(
      (s) =>
        s.type === "quest" &&
        s.scheduledAt + oneHourMs <= now &&
        s.scheduledAt + 3 * oneHourMs >= now
    );

    for (const session of inWindow) {
      const members = await ctx.db
        .query("sessionMembers")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();

      for (const member of members) {
        if (member.checkedIn) continue;

        if (member.status === "accepted") {
          // First detection: warn the user and flag as pending
          await ctx.db.patch(member._id, { status: "no_show_pending" });
          await ctx.scheduler.runAfter(
            0,
            internal.notifications.sendNoShowWarning,
            { userId: member.userId, sessionId: session._id }
          );
        } else if (member.status === "no_show_pending") {
          // Second pass: no response — apply curse and mark as no-show
          await ctx.db.patch(member._id, { status: "no_show" });
          await ctx.scheduler.runAfter(
            0,
            internal.progression.applyNoShowCurse,
            { userId: member.userId }
          );
        }
      }
    }
  },
});

// ─── clearExpiredStatuses (internal — called by cron every hour) ──────
export const clearExpiredStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Scan users with an active currentStatus that has expired
    // No index on expiresAt, so this is a full scan — acceptable for v0
    // TODO: Add index or event-driven approach at scale
    const allUsers = await ctx.db.query("users").collect();

    for (const user of allUsers) {
      if (user.currentStatus && user.currentStatus.expiresAt <= now) {
        await ctx.db.patch(user._id, { currentStatus: undefined });
      }
    }
  },
});

// ─── cleanupOldSessions (internal — called by cron daily) ────────────
export const cleanupOldSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Archive (soft-delete via status) sessions older than 30 days
    // that are already in terminal states. We don't delete — keeps audit trail.
    // "dissolved" and "completed" are the terminal states.
    const terminalStatuses = ["completed", "dissolved"] as const;

    for (const status of terminalStatuses) {
      const old = await ctx.db
        .query("sessions")
        .withIndex("by_status_scheduledAt", (q) =>
          q.eq("status", status).lt("scheduledAt", thirtyDaysAgo)
        )
        .collect();

      // In v0 we don't hard-delete; just log the count.
      // TODO: When archival table exists, move rows there instead.
      // For now, this cron serves as the hook for future archival logic.
      void old; // suppress unused variable warning
    }
  },
});

// ─── questBoard ──────────────────────────────────────────────
// Returns open quest sessions at the current user's favorited gyms.
export const questBoard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    const gymIds = user?.favoriteGyms ?? [];
    if (gymIds.length === 0) return [];

    // Fetch open quests at each favorited gym
    const questsByGym = await Promise.all(
      gymIds.map(async (gymId) => {
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_gym_status", (q) =>
            q.eq("gymId", gymId).eq("status", "open")
          )
          .collect();

        const quests = sessions.filter((s) => s.type === "quest");

        const gym = await ctx.db.get(gymId);

        const questDetails = await Promise.all(
          quests.map(async (session) => {
            const creator = await ctx.db.get(session.creatorId);
            const members = await ctx.db
              .query("sessionMembers")
              .withIndex("by_session", (q) => q.eq("sessionId", session._id))
              .collect();

            const acceptedCount = members.filter(
              (m) => m.status === "accepted"
            ).length;

            const alreadyJoined = members.some((m) => m.userId === userId);

            return {
              _id: session._id,
              gymId,
              gymName: gym?.name ?? "Unknown Gym",
              scheduledAt: session.scheduledAt,
              climbingType: session.climbingType,
              gradeRange: session.gradeRange,
              capacity: session.capacity,
              checkInMessage: session.checkInMessage,
              note: session.note,
              creatorName: creator?.generatedName ?? "Unknown",
              creatorLevel: creator?.level ?? 1,
              memberCount: acceptedCount,
              alreadyJoined,
            };
          })
        );

        return { gymId, gymName: gym?.name ?? "Unknown Gym", quests: questDetails };
      })
    );

    // Filter to gyms that have quests, sort quests by scheduledAt
    return questsByGym
      .filter((g) => g.quests.length > 0)
      .map((g) => ({
        ...g,
        quests: g.quests.sort((a, b) => a.scheduledAt - b.scheduledAt),
      }));
  },
});

// ─── createQuest ─────────────────────────────────────────────
export const createQuest = mutation({
  args: {
    gymId: v.id("gyms"),
    scheduledAt: v.number(),
    capacity: v.number(),
    climbingType: v.string(),
    gradeRange: v.object({ min: v.string(), max: v.string() }),
    checkInMessage: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.capacity < 2 || args.capacity > 10)
      throw new Error("Capacity must be between 2 and 10");

    const shortCode = generateShortCode();

    const sessionId = await ctx.db.insert("sessions", {
      type: "quest",
      creatorId: userId,
      leaderId: userId,
      gymId: args.gymId,
      scheduledAt: args.scheduledAt,
      status: "open",
      capacity: args.capacity,
      climbingType: args.climbingType,
      gradeRange: args.gradeRange,
      checkInMessage: args.checkInMessage,
      note: args.note,
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

    return { sessionId, shortCode };
  },
});

// ─── joinQuest ───────────────────────────────────────────────
export const joinQuest = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.type !== "quest") throw new Error("Not a quest session");
    if (session.status !== "open") throw new Error("Quest is not open");

    // Check if already joined
    const existing = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .unique();

    if (existing) throw new Error("Already joined this quest");

    // Check capacity soft cap
    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const acceptedCount = members.filter(
      (m) => m.status === "accepted"
    ).length;

    if (session.capacity !== undefined && acceptedCount >= session.capacity) {
      throw new Error("Quest is at capacity");
    }

    await ctx.db.insert("sessionMembers", {
      sessionId: args.sessionId,
      userId,
      status: "accepted",
      invitedBy: session.creatorId,
      checkedIn: false,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.sendQuestJoin, {
      sessionId: args.sessionId,
      joinedUserId: userId,
    });

    return { sessionId: args.sessionId };
  },
});

// ─── sessionSummary ──────────────────────────────────────────
// Post-session XP and activity summary for the current user.
export const sessionSummary = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const gym = await ctx.db.get(session.gymId);

    // My sends this session
    const allSends = await ctx.db
      .query("sends")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    const mySends = allSends.filter((s) => s.userId === userId);

    // XP earned: sum from ledger entries where sourceId matches my sends
    const mySendIds = new Set(mySends.map((s) => s._id.toString()));
    const xpEntries = await ctx.db
      .query("xpLedger")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const sessionXpEntries = xpEntries.filter(
      (e) => e.sourceId && mySendIds.has(e.sourceId)
    );
    const totalXpEarned = sessionXpEntries.reduce((sum, e) => sum + e.amount, 0);

    // Events triggered during this session for this user
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const sessionEvents = events.filter((e) => e.sessionId === args.sessionId);

    // For quest sessions: non-connection party members (matching candidates)
    let matchCandidates: Array<{
      userId: Id<"users">;
      generatedName: string;
      level: number;
      myMatchResponse: "pending" | "yes" | "no" | null;
    }> = [];

    if (session.type === "quest") {
      const allMembers = await ctx.db
        .query("sessionMembers")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect();

      const otherMembers = allMembers.filter(
        (m) =>
          m.userId !== userId &&
          (m.status === "accepted" || m.status === "attended")
      );

      // Get my existing match responses for this session
      const myMatches = await ctx.db
        .query("questMatches")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect();
      const myResponseMap = new Map(
        myMatches
          .filter((m) => m.fromUserId === userId)
          .map((m) => [m.toUserId.toString(), m.response])
      );

      matchCandidates = (
        await Promise.all(
          otherMembers.map(async (m) => {
            // Skip if already connected
            const existing = await ctx.db
              .query("connections")
              .withIndex("by_user_connected", (q) =>
                q.eq("userId", userId).eq("connectedUserId", m.userId)
              )
              .unique();
            if (existing) return null;

            const memberUser = await ctx.db.get(m.userId);
            if (!memberUser) return null;

            return {
              userId: m.userId,
              generatedName: memberUser.generatedName ?? "Unknown",
              level: memberUser.level ?? 1,
              myMatchResponse: (myResponseMap.get(m.userId.toString()) ?? null) as
                | "pending"
                | "yes"
                | "no"
                | null,
            };
          })
        )
      ).filter((c): c is NonNullable<typeof c> => c !== null);
    }

    // Current user stats post-session
    const user = await ctx.db.get(userId);

    return {
      sessionId: args.sessionId,
      sessionType: session.type,
      gymName: gym?.name ?? "Unknown Gym",
      scheduledAt: session.scheduledAt,
      sends: mySends.map((s) => ({
        _id: s._id,
        grade: s.grade,
        gradeSystem: s.gradeSystem,
        type: s.type,
        xpAwarded: s.xpAwarded,
      })),
      totalXpEarned,
      events: sessionEvents.map((e) => ({
        type: e.type,
        metadata: e.metadata,
      })),
      matchCandidates,
      userLevel: user?.level ?? 1,
      userTotalXp: user?.totalXp ?? 0,
    };
  },
});

// ─── getByShortCode (internal — for HTTP actions) ────────────
export const getByShortCode = internalQuery({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_shortCode", (q) => q.eq("shortCode", args.shortCode))
      .unique();
    if (!session) return null;

    const gym = await ctx.db.get(session.gymId);
    const memberRows = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const acceptedRows = memberRows.filter(
      (m) => m.status === "accepted" || m.status === "attended"
    );

    const members = await Promise.all(
      acceptedRows.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          name: user?.generatedName ?? "Adventurer",
          level: user?.level ?? 1,
        };
      })
    );

    return {
      type: session.type,
      gymName: gym?.name ?? "Unknown Gym",
      scheduledAt: session.scheduledAt,
      status: session.status,
      memberCount: members.length,
      capacity: session.capacity ?? null,
      members,
      note: session.note,
    };
  },
});

// ─── inviteToSession ─────────────────────────────────────────
export const inviteToSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, { sessionId, userIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const myMembership = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session_user", (q) =>
        q.eq("sessionId", sessionId).eq("userId", userId)
      )
      .unique();
    if (!myMembership || myMembership.status !== "accepted") {
      throw new Error("Must be an accepted member to invite");
    }

    for (const inviteeId of userIds) {
      const existing = await ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", inviteeId)
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("sessionMembers", {
          sessionId,
          userId: inviteeId,
          status: "invited",
          invitedBy: userId,
          checkedIn: false,
        });
      }
    }
  },
});

// ─── cancelAttendance ────────────────────────────────────────
export const cancelAttendance = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.leaderId === userId) {
      throw new Error("Leader must use the 'desert' action");
    }

    const membership = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session_user", (q) =>
        q.eq("sessionId", sessionId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Not a member");

    await ctx.db.patch(membership._id, { status: "declined" });
  },
});

// ─── desertAsLeader ──────────────────────────────────────────
export const desertAsLeader = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.leaderId !== userId) throw new Error("You are not the leader");

    // Set a 30-min dissolve window for someone to volunteer
    const dissolveAt = Date.now() + 30 * 60 * 1000;
    await ctx.db.patch(sessionId, { dissolveAt });

    // Mark leader as declined
    const membership = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session_user", (q) =>
        q.eq("sessionId", sessionId).eq("userId", userId)
      )
      .unique();
    if (membership) {
      await ctx.db.patch(membership._id, { status: "declined" });
    }

    // Notify remaining members that the leader has left
    await ctx.scheduler.runAfter(0, internal.notifications.sendLeaderDeserted, {
      sessionId,
    });
  },
});

// ─── volunteerAsLeader ───────────────────────────────────────
export const volunteerAsLeader = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");

    const membership = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session_user", (q) =>
        q.eq("sessionId", sessionId).eq("userId", userId)
      )
      .unique();
    if (!membership || membership.status !== "accepted") {
      throw new Error("Must be an accepted member to volunteer");
    }

    // Claim leadership and cancel dissolution timer
    await ctx.db.patch(sessionId, { leaderId: userId, dissolveAt: undefined });
  },
});

// ─── confirmAttendance ───────────────────────────────────────
export const confirmAttendance = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const membership = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session_user", (q) =>
        q.eq("sessionId", sessionId).eq("userId", userId)
      )
      .unique();
    if (!membership) throw new Error("Not a member");

    await ctx.db.patch(membership._id, { checkedIn: true });
  },
});

// ─── updateCheckInMessage ────────────────────────────────────
export const updateCheckInMessage = mutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
  },
  handler: async (ctx, { sessionId, message }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.leaderId !== userId) {
      throw new Error("Only the leader can update the check-in message");
    }

    await ctx.db.patch(sessionId, { checkInMessage: message });
  },
});

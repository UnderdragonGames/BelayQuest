import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import {
  calculateXp,
  xpForGrade,
  levelFromXp,
  levelProgress,
  xpForLevel,
} from "../lib/xp/calculator";
import { gradeIndex, isValidGrade, detectSystem } from "../lib/grades/parser";

const BUFF_EFFECTS = [
  "Chalk Hands",
  "Spider Grip",
  "Featherfall",
  "Iron Fingers",
  "Monkey Reach",
  "Flow State",
];

const DEBUFF_EFFECTS = [
  "Poisoned",
  "Cursed",
  "Hexed",
  "Frozen",
  "Haunted",
];

function randomBuff(): { effect: string; type: "buff"; expiresAt: number } {
  const effect = BUFF_EFFECTS[Math.floor(Math.random() * BUFF_EFFECTS.length)];
  return {
    effect,
    type: "buff" as const,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
}

function randomDebuff(): { effect: string; type: "debuff"; expiresAt: number } {
  const effect = DEBUFF_EFFECTS[Math.floor(Math.random() * DEBUFF_EFFECTS.length)];
  return {
    effect,
    type: "debuff" as const,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

// ─── logClimb ─────────────────────────────────────────────────
export const logClimb = mutation({
  args: {
    sessionId: v.optional(v.id("sessions")),
    gymId: v.id("gyms"),
    grade: v.string(),
    gradeSystem: v.union(
      v.literal("yds"),
      v.literal("v_scale"),
      v.literal("font"),
      v.literal("french"),
      v.literal("gym_color")
    ),
    type: v.union(v.literal("send"), v.literal("attempt")),
    difficultyRating: v.optional(
      v.union(
        v.literal("soft"),
        v.literal("on_grade"),
        v.literal("hard"),
        v.literal("very_hard")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Validate grade
    let resolvedGrade = args.grade;
    if (args.gradeSystem === "gym_color") {
      // Look up gym grade systems for XP midpoint
      const gymGradeSystems = await ctx.db
        .query("gymGradeSystems")
        .withIndex("by_gym", (q) => q.eq("gymId", args.gymId))
        .collect();
      let found = false;
      for (const system of gymGradeSystems) {
        const entry = system.grades.find((g) => g.label === args.grade);
        if (entry?.xpMidpoint) {
          resolvedGrade = entry.xpMidpoint;
          found = true;
          break;
        }
      }
      if (!found) throw new Error(`Unknown gym color grade: ${args.grade}`);
    } else if (
      args.gradeSystem === "yds" ||
      args.gradeSystem === "v_scale"
    ) {
      if (!isValidGrade(args.grade)) {
        throw new Error(`Invalid grade: ${args.grade}`);
      }
    }
    // font/french validation deferred to v1

    // Check party status
    let inParty = false;
    if (args.sessionId) {
      const session = await ctx.db.get(args.sessionId);
      if (!session) throw new Error("Session not found");
      if (session.status !== "active" && session.status !== "open") {
        throw new Error("Session is not active");
      }
      const members = await ctx.db
        .query("sessionMembers")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId!))
        .collect();
      const activeCount = members.filter(
        (m) => m.status === "accepted" || m.status === "attended"
      ).length;
      inParty = activeCount > 1;
    }

    // Calculate XP
    const xpCalc = calculateXp(resolvedGrade, args.type, inParty);
    const now = Date.now();
    const events: Array<{ type: string; metadata?: any }> = [];

    // Insert send
    const sendId = await ctx.db.insert("sends", {
      userId,
      sessionId: args.sessionId,
      gymId: args.gymId,
      grade: args.grade,
      gradeSystem: args.gradeSystem,
      type: args.type,
      xpAwarded: xpCalc.totalXp,
      climbedAt: now,
      difficultyRating: args.difficultyRating,
    });

    // XP ledger entries
    await ctx.db.insert("xpLedger", {
      userId,
      amount: xpCalc.baseXp,
      source: args.type === "send" ? "send" : "attempt",
      sourceId: sendId,
      createdAt: now,
    });
    if (xpCalc.partyBonus > 0) {
      await ctx.db.insert("xpLedger", {
        userId,
        amount: xpCalc.partyBonus,
        source: "party_bonus",
        sourceId: sendId,
        createdAt: now,
      });
    }

    const oldTotalXp = user.totalXp ?? 0;
    const newTotalXp = oldTotalXp + xpCalc.totalXp;
    const patchData: Record<string, any> = {
      totalXp: newTotalXp,
      level: levelFromXp(newTotalXp),
    };

    // Grade breakthrough (sends only)
    if (args.type === "send") {
      const system = detectSystem(resolvedGrade);
      const maxField =
        system === "v_scale" ? "maxGradeBoulder" : "maxGradeRoute";
      const currentMax = (user as any)[maxField] as string | undefined;
      const isBreakthrough =
        !currentMax ||
        gradeIndex(resolvedGrade) > gradeIndex(currentMax);

      if (isBreakthrough) {
        patchData[maxField] = resolvedGrade;
        const eventMeta = {
          grade: args.grade,
          previousMax: currentMax ?? null,
        };
        await ctx.db.insert("events", {
          userId,
          type: "grade_breakthrough",
          metadata: eventMeta,
          xpAwarded: 0,
          sessionId: args.sessionId,
          sendId,
          createdAt: now,
        });
        events.push({ type: "grade_breakthrough", metadata: eventMeta });

        // Fire push notification for grade breakthrough
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.sendGradeBreakthrough,
          { userId, grade: resolvedGrade }
        );

        // Apply random buff
        patchData.currentStatus = randomBuff();
      }
    }

    // Volume PR (sends only)
    if (args.type === "send" && args.sessionId) {
      // Count sends at this grade in this session
      const sessionSends = await ctx.db
        .query("sends")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId!))
        .collect();
      const gradeCount =
        sessionSends.filter(
          (s) => s.grade === args.grade && s.type === "send" && s.userId === userId
        ).length + 1; // +1 for the one we just inserted (race-safe: Convex serializes)

      const volumePRs = user.volumePRs ?? [];
      const existing = volumePRs.find((pr) => pr.grade === args.grade);
      const previousRecord = existing?.count ?? 0;

      if (gradeCount > previousRecord) {
        const updatedPRs = volumePRs.filter((pr) => pr.grade !== args.grade);
        updatedPRs.push({ grade: args.grade, count: gradeCount });
        patchData.volumePRs = updatedPRs;

        const eventMeta = {
          grade: args.grade,
          count: gradeCount,
          previousRecord,
        };
        await ctx.db.insert("events", {
          userId,
          type: "volume_pr",
          metadata: eventMeta,
          xpAwarded: 0,
          sessionId: args.sessionId,
          sendId,
          createdAt: now,
        });
        events.push({ type: "volume_pr", metadata: eventMeta });
      }
    }

    // Level-up check
    const oldLevel = levelFromXp(oldTotalXp);
    const newLevel = levelFromXp(newTotalXp);
    if (newLevel > oldLevel) {
      await ctx.db.insert("events", {
        userId,
        type: "level_up",
        metadata: { oldLevel, newLevel },
        xpAwarded: 0,
        sessionId: args.sessionId,
        sendId,
        createdAt: now,
      });
      events.push({ type: "level_up", metadata: { oldLevel, newLevel } });
    }

    // Tape (attempts near max grade)
    if (args.type === "attempt") {
      const system = detectSystem(resolvedGrade);
      const maxField =
        system === "v_scale" ? "maxGradeBoulder" : "maxGradeRoute";
      const currentMax = (user as any)[maxField] as string | undefined;
      if (currentMax) {
        const delta = gradeIndex(resolvedGrade) - gradeIndex(currentMax);
        if (delta >= -1 && delta <= 1) {
          await ctx.db.insert("inventoryItems", {
            userId,
            itemType: "tape",
            status: "held",
            acquiredAt: now,
          });
          await ctx.db.insert("events", {
            userId,
            type: "tape_earned",
            metadata: { grade: args.grade },
            xpAwarded: 0,
            sessionId: args.sessionId,
            sendId,
            createdAt: now,
          });
          events.push({ type: "tape_earned" });
        }
      }
    }

    // Patch user
    await ctx.db.patch(userId, patchData);

    // Check achievements asynchronously (avoids bloating logClimb latency)
    await ctx.scheduler.runAfter(0, internal.progression.checkAchievements, { userId });

    return { sendId, xpAwarded: xpCalc.totalXp, totalXpAfter: newTotalXp, events };
  },
});

// ─── sessionSends ─────────────────────────────────────────────
export const sessionSends = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sends = await ctx.db
      .query("sends")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    // Join user names
    const userIds = [...new Set(sends.map((s) => s.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map(
      users
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((u) => [u._id, u.generatedName ?? "Unknown"])
    );

    return sends
      .sort((a, b) => b.climbedAt - a.climbedAt)
      .map((s) => ({
        _id: s._id,
        userId: s.userId,
        userName: userMap.get(s.userId) ?? "Unknown",
        grade: s.grade,
        gradeSystem: s.gradeSystem,
        type: s.type,
        xpAwarded: s.xpAwarded,
        difficultyRating: s.difficultyRating,
        climbedAt: s.climbedAt,
      }));
  },
});

// ─── myStats ──────────────────────────────────────────────────
export const myStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const totalXp = user.totalXp ?? 0;
    const level = user.level ?? levelFromXp(totalXp);

    // Count total sends
    const allSends = await ctx.db
      .query("sends")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      level,
      totalXp,
      maxGradeRoute: user.maxGradeRoute ?? null,
      maxGradeBoulder: user.maxGradeBoulder ?? null,
      levelProgress: levelProgress(totalXp),
      xpToNextLevel: xpForLevel(level + 1) - totalXp,
      totalSends: allSends.length,
      currentStatus: user.currentStatus ?? null,
      generatedName: user.generatedName ?? null,
    };
  },
});

// ─── recentSends ──────────────────────────────────────────────
export const recentSends = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit ?? 10;

    const sends = await ctx.db
      .query("sends")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    // Join gym names
    const gymIds = [...new Set(sends.map((s) => s.gymId))];
    const gyms = await Promise.all(gymIds.map((id) => ctx.db.get(id)));
    const gymMap = new Map(
      gyms
        .filter((g): g is NonNullable<typeof g> => g !== null)
        .map((g) => [g._id, g.name])
    );

    return sends.map((s) => ({
      _id: s._id,
      grade: s.grade,
      gradeSystem: s.gradeSystem,
      type: s.type,
      xpAwarded: s.xpAwarded,
      difficultyRating: s.difficultyRating,
      climbedAt: s.climbedAt,
      gymName: gymMap.get(s.gymId) ?? "Unknown",
    }));
  },
});

// ─── applyNoShowCurse (internal — called from checkNoShows) ───
// Applies a random 7-day debuff to a user who no-showed a quest.
export const applyNoShowCurse = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { currentStatus: randomDebuff() });
  },
});

// ─── Achievement Definitions ──────────────────────────────────
type AchievementStats = {
  maxGradeBoulder?: string;
  maxGradeRoute?: string;
  totalSends: number;
  hostedRaids: number;
  attendedSessions: number;
  attendedRaids: number;
  uniqueGyms: number;
  uniquePartners: number;
};

export const ACHIEVEMENT_DEFS: Record<
  string,
  {
    title: string;
    description: string;
    icon: string; // filename stem from assets/images/icons/
    xpBonus: number; // XP awarded when unlocked
    itemsGranted: string[];
    check: (s: AchievementStats) => boolean;
  }
> = {
  // ─── Boulder grade milestones ─────────────────────────────
  first_boulder: {
    title: "First Ascent",
    description: "Log your first boulder send",
    icon: "boulder",
    xpBonus: 50,
    itemsGranted: ["chalk"],
    check: (s) => !!s.maxGradeBoulder,
  },
  grade_v4: {
    title: "V4 Vanquished",
    description: "Send a V4 or harder",
    icon: "star",
    xpBonus: 100,
    itemsGranted: ["chalk_bag"],
    check: (s) =>
      !!s.maxGradeBoulder && gradeIndex(s.maxGradeBoulder) >= gradeIndex("V4"),
  },
  grade_v7: {
    title: "Seven Deadly Sends",
    description: "Send a V7 or harder",
    icon: "crown",
    xpBonus: 250,
    itemsGranted: ["liquid_chalk"],
    check: (s) =>
      !!s.maxGradeBoulder && gradeIndex(s.maxGradeBoulder) >= gradeIndex("V7"),
  },

  // ─── Route grade milestones ───────────────────────────────
  first_route: {
    title: "On Rope",
    description: "Log your first route send",
    icon: "rope",
    xpBonus: 50,
    itemsGranted: ["chalk"],
    check: (s) => !!s.maxGradeRoute,
  },
  route_5_12: {
    title: "Twelve Pack",
    description: "Send a 5.12 or harder",
    icon: "cam",
    xpBonus: 250,
    itemsGranted: ["quickdraw"],
    check: (s) =>
      !!s.maxGradeRoute &&
      gradeIndex(s.maxGradeRoute) >= gradeIndex("5.12"),
  },

  // ─── Volume (minimal — entry points only) ─────────────────
  sends_10: {
    title: "Just Getting Started",
    description: "Log 10 total sends",
    icon: "checkmark",
    xpBonus: 50,
    itemsGranted: ["chalk"],
    check: (s) => s.totalSends >= 10,
  },
  sends_50: {
    title: "Sending Machine",
    description: "Log 50 total sends",
    icon: "scroll",
    xpBonus: 150,
    itemsGranted: ["chalk_bag"],
    check: (s) => s.totalSends >= 50,
  },

  // ─── Social: joining group sessions ───────────────────────
  join_first_raid: {
    title: "Party Crasher",
    description: "Join your first group climbing session",
    icon: "swords",
    xpBonus: 75,
    itemsGranted: ["chalk"],
    check: (s) => s.attendedRaids >= 1,
  },
  attend_5_raids: {
    title: "Raid Regular",
    description: "Attend 5 group climbing sessions",
    icon: "handshake",
    xpBonus: 200,
    itemsGranted: ["carabiner"],
    check: (s) => s.attendedRaids >= 5,
  },
  attend_20_raids: {
    title: "Raid Veteran",
    description: "Attend 20 group climbing sessions",
    icon: "shield",
    xpBonus: 500,
    itemsGranted: ["quickdraw", "carabiner"],
    check: (s) => s.attendedRaids >= 20,
  },

  // ─── Social: hosting ──────────────────────────────────────
  host_1_raid: {
    title: "Party Starter",
    description: "Host your first group climbing session",
    icon: "flag",
    xpBonus: 75,
    itemsGranted: ["chalk"],
    check: (s) => s.hostedRaids >= 1,
  },
  host_5_raids: {
    title: "Raid Commander",
    description: "Host 5 group climbing sessions",
    icon: "helmet",
    xpBonus: 200,
    itemsGranted: ["quickdraw"],
    check: (s) => s.hostedRaids >= 5,
  },
  host_10_raids: {
    title: "Warlord",
    description: "Host 10 group climbing sessions",
    icon: "crown",
    xpBonus: 400,
    itemsGranted: ["quickdraw", "carabiner"],
    check: (s) => s.hostedRaids >= 10,
  },

  // ─── Social: unique climbing partners ─────────────────────
  partners_3: {
    title: "Better Together",
    description: "Climb with 3 different partners",
    icon: "chat",
    xpBonus: 100,
    itemsGranted: ["chalk"],
    check: (s) => s.uniquePartners >= 3,
  },
  partners_10: {
    title: "Social Butterfly",
    description: "Climb with 10 different partners",
    icon: "keys",
    xpBonus: 300,
    itemsGranted: ["carabiner"],
    check: (s) => s.uniquePartners >= 10,
  },

  // ─── Explorer ─────────────────────────────────────────────
  gyms_3: {
    title: "Gym Hopper",
    description: "Climb at 3 different gyms",
    icon: "compass",
    xpBonus: 100,
    itemsGranted: ["brush"],
    check: (s) => s.uniqueGyms >= 3,
  },
  gyms_5: {
    title: "Vagabond Climber",
    description: "Climb at 5 different gyms",
    icon: "footprints",
    xpBonus: 200,
    itemsGranted: ["carabiner"],
    check: (s) => s.uniqueGyms >= 5,
  },
  gyms_10: {
    title: "True Explorer",
    description: "Climb at 10 different gyms",
    icon: "signpost",
    xpBonus: 400,
    itemsGranted: ["quickdraw", "brush"],
    check: (s) => s.uniqueGyms >= 10,
  },

  // ─── Consistency ──────────────────────────────────────────
  sessions_5: {
    title: "Regular",
    description: "Complete 5 climbing sessions",
    icon: "hourglass",
    xpBonus: 100,
    itemsGranted: ["chalk"],
    check: (s) => s.attendedSessions >= 5,
  },
  sessions_20: {
    title: "Devoted Climber",
    description: "Complete 20 climbing sessions",
    icon: "helmet",
    xpBonus: 300,
    itemsGranted: ["chalk_bag"],
    check: (s) => s.attendedSessions >= 20,
  },
};

// ─── checkAchievements (internal) ────────────────────────────
// Scans user stats, awards any newly-earned achievements, and
// grants the corresponding inventory items. Safe to call multiple
// times — already-earned achievements are skipped.
export const checkAchievements = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;

    // Gather base stats
    const [sends, sessionMemberships, hostedSessions] = await Promise.all([
      ctx.db
        .query("sends")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("sessionMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("sessions")
        .withIndex("by_creator", (q) => q.eq("creatorId", userId))
        .collect(),
    ]);

    // Determine attended sessions and compute social stats
    const attendedMemberships = sessionMemberships.filter(
      (m) => m.status === "attended" || m.status === "accepted"
    );
    const attendedSessionDetails = (
      await Promise.all(attendedMemberships.map((m) => ctx.db.get(m.sessionId)))
    ).filter((s): s is NonNullable<typeof s> => s !== null);

    const attendedRaids = attendedSessionDetails.filter(
      (s) => s.type === "raid"
    ).length;

    // Unique partners: all users co-present in sessions the user attended
    const partnerIdSet = new Set<string>();
    const partnerMemberLists = await Promise.all(
      attendedSessionDetails.map((session) =>
        ctx.db
          .query("sessionMembers")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect()
      )
    );
    for (const members of partnerMemberLists) {
      for (const m of members) {
        if (
          m.userId.toString() !== userId.toString() &&
          (m.status === "attended" || m.status === "accepted")
        ) {
          partnerIdSet.add(m.userId.toString());
        }
      }
    }

    const stats: AchievementStats = {
      maxGradeBoulder: user.maxGradeBoulder,
      maxGradeRoute: user.maxGradeRoute,
      totalSends: sends.filter((s) => s.type === "send").length,
      hostedRaids: hostedSessions.filter((s) => s.type === "raid").length,
      attendedSessions: attendedMemberships.length,
      attendedRaids,
      uniqueGyms: new Set(sends.map((s) => s.gymId.toString())).size,
      uniquePartners: partnerIdSet.size,
    };

    // Get already-earned achievements to skip duplicates
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const earned = new Set(existing.map((a) => a.type));

    const now = Date.now();
    let totalXpGained = 0;

    for (const [type, def] of Object.entries(ACHIEVEMENT_DEFS)) {
      if (earned.has(type)) continue;
      if (!def.check(stats)) continue;

      // Award achievement
      const achievementId = await ctx.db.insert("achievements", {
        userId,
        type,
        itemsGranted: def.itemsGranted,
        earnedAt: now,
      });

      // Grant inventory items
      for (const itemType of def.itemsGranted) {
        await ctx.db.insert("inventoryItems", {
          userId,
          itemType,
          sourceAchievementId: achievementId,
          status: "held",
          acquiredAt: now,
        });
      }

      // Grant XP bonus
      if (def.xpBonus > 0) {
        await ctx.db.insert("xpLedger", {
          userId,
          amount: def.xpBonus,
          source: "achievement",
          sourceId: achievementId,
          createdAt: now,
        });
        totalXpGained += def.xpBonus;
      }

      // Record event for the timeline
      await ctx.db.insert("events", {
        userId,
        type: "achievement_unlocked",
        metadata: { achievementType: type, title: def.title },
        xpAwarded: def.xpBonus,
        createdAt: now,
      });
    }

    // Apply accumulated XP from achievements in a single patch
    if (totalXpGained > 0) {
      const newTotalXp = (user.totalXp ?? 0) + totalXpGained;
      await ctx.db.patch(userId, {
        totalXp: newTotalXp,
        level: levelFromXp(newTotalXp),
      });
    }
  },
});

// ─── myAchievements ───────────────────────────────────────────
// Returns the user's earned achievements, most recent first,
// with title and description joined from ACHIEVEMENT_DEFS.
export const myAchievements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return achievements.map((a) => ({
      _id: a._id,
      type: a.type,
      title: ACHIEVEMENT_DEFS[a.type]?.title ?? a.type,
      description: ACHIEVEMENT_DEFS[a.type]?.description ?? "",
      icon: ACHIEVEMENT_DEFS[a.type]?.icon ?? "star",
      xpBonus: ACHIEVEMENT_DEFS[a.type]?.xpBonus ?? 0,
      itemsGranted: a.itemsGranted ?? [],
      earnedAt: a.earnedAt,
    }));
  },
});

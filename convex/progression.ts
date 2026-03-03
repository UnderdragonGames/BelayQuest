import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
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

function randomBuff(): { effect: string; type: "buff"; expiresAt: number } {
  const effect = BUFF_EFFECTS[Math.floor(Math.random() * BUFF_EFFECTS.length)];
  return {
    effect,
    type: "buff" as const,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
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

    return { sendId, xpAwarded: xpCalc.totalXp, events };
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

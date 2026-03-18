import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { createTestUser, createTestGym, createTestSession } from "./_helpers";

const modules = import.meta.glob("../../convex/**/*.ts");

// ─── logClimb: send ───────────────────────────────────────────

describe("logClimb (send)", () => {
  it("V0 send awards correct XP and creates send record", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { totalXp: 0, level: 1 });
    const gymId = await createTestGym(t);

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "V0",
        gradeSystem: "v_scale",
        type: "send",
      }
    );

    expect(result.xpAwarded).toBe(32); // V0 = 32 XP
    expect(result.sendId).toBeDefined();

    const send = await t.run((ctx) => ctx.db.get(result.sendId));
    expect(send?.grade).toBe("V0");
    expect(send?.type).toBe("send");
    expect(send?.xpAwarded).toBe(32);
  });

  it("send updates user totalXp", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { totalXp: 0, level: 1 });
    const gymId = await createTestGym(t);

    await t.withIdentity({ subject: userId }).mutation(api.progression.logClimb, {
      gymId,
      grade: "V0",
      gradeSystem: "v_scale",
      type: "send",
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.totalXp).toBe(32);
  });

  it("send creates xpLedger entry", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    await t.withIdentity({ subject: userId }).mutation(api.progression.logClimb, {
      gymId,
      grade: "V0",
      gradeSystem: "v_scale",
      type: "send",
    });

    const ledger = await t.run((ctx) =>
      ctx.db
        .query("xpLedger")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    );
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.source).toBe("send");
    expect(ledger[0]?.amount).toBe(32);
  });
});

// ─── logClimb: attempt ────────────────────────────────────────

describe("logClimb (attempt)", () => {
  it("attempt awards 0.25x XP", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    // V0 = 32 XP, attempt = 32 * 0.25 = 8
    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "V0",
        gradeSystem: "v_scale",
        type: "attempt",
      }
    );

    expect(result.xpAwarded).toBe(8);
  });

  it("attempt awards tape when within ±1 of max grade", async () => {
    const t = convexTest(schema, modules);
    // User with maxGradeBoulder = V3
    const userId = await createTestUser(t, { maxGradeBoulder: "V3" });
    const gymId = await createTestGym(t);

    // Attempt V3 (exactly at max grade, delta=0)
    await t.withIdentity({ subject: userId }).mutation(api.progression.logClimb, {
      gymId,
      grade: "V3",
      gradeSystem: "v_scale",
      type: "attempt",
    });

    const inventory = await t.run((ctx) =>
      ctx.db
        .query("inventoryItems")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    );
    expect(inventory.some((i) => i.itemType === "tape")).toBe(true);
  });

  it("attempt does not award tape far from max grade", async () => {
    const t = convexTest(schema, modules);
    // User with maxGradeBoulder = V3
    const userId = await createTestUser(t, { maxGradeBoulder: "V3" });
    const gymId = await createTestGym(t);

    // Attempt VB (way below max, delta = -3)
    await t.withIdentity({ subject: userId }).mutation(api.progression.logClimb, {
      gymId,
      grade: "VB",
      gradeSystem: "v_scale",
      type: "attempt",
    });

    const inventory = await t.run((ctx) =>
      ctx.db
        .query("inventoryItems")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", userId).eq("itemType", "tape")
        )
        .collect()
    );
    expect(inventory).toHaveLength(0);
  });
});

// ─── logClimb: party bonus ────────────────────────────────────

describe("logClimb (party bonus)", () => {
  it("adds 0.15x bonus when session has 2+ active members", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const memberId = await createTestUser(t, { generatedName: "Member" });
    const gymId = await createTestGym(t);

    // Create an active session with 2 accepted members
    const sessionId = await createTestSession(t, userId, gymId, {
      status: "active",
    });
    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: memberId,
        status: "accepted",
        invitedBy: userId,
        checkedIn: false,
      })
    );

    // V0 = 32 XP, party bonus = round(32 * 0.15) = 5
    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "V0",
        gradeSystem: "v_scale",
        type: "send",
        sessionId,
      }
    );

    expect(result.xpAwarded).toBe(37); // 32 base + 5 party bonus
  });

  it("no party bonus when climbing solo", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    // No session
    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "V0",
        gradeSystem: "v_scale",
        type: "send",
      }
    );

    expect(result.xpAwarded).toBe(32); // no party bonus
  });

  it("no party bonus with only 1 active member in session", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    // Session with only the creator (solo)
    const sessionId = await createTestSession(t, userId, gymId, {
      status: "active",
    });

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "V0",
        gradeSystem: "v_scale",
        type: "send",
        sessionId,
      }
    );

    expect(result.xpAwarded).toBe(32); // no party bonus
  });
});

// ─── logClimb: grade breakthrough ────────────────────────────

describe("logClimb (grade breakthrough)", () => {
  it("sends a grade above max updates maxGradeBoulder and fires event", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { maxGradeBoulder: "V2" });
    const gymId = await createTestGym(t);

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "V4",
        gradeSystem: "v_scale",
        type: "send",
      }
    );

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.maxGradeBoulder).toBe("V4");

    expect(result.events.some((e) => e.type === "grade_breakthrough")).toBe(true);
  });

  it("first send sets maxGradeBoulder", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t); // no maxGradeBoulder
    const gymId = await createTestGym(t);

    await t.withIdentity({ subject: userId }).mutation(api.progression.logClimb, {
      gymId,
      grade: "V1",
      gradeSystem: "v_scale",
      type: "send",
    });

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.maxGradeBoulder).toBe("V1");
  });

  it("send below max grade does not fire breakthrough", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { maxGradeBoulder: "V5" });
    const gymId = await createTestGym(t);

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "V3",
        gradeSystem: "v_scale",
        type: "send",
      }
    );

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.maxGradeBoulder).toBe("V5"); // unchanged

    expect(result.events.some((e) => e.type === "grade_breakthrough")).toBe(
      false
    );
  });
});

// ─── logClimb: level-up ───────────────────────────────────────

describe("logClimb (level-up)", () => {
  it("fires level_up event when XP crosses level boundary", async () => {
    const t = convexTest(schema, modules);
    // Level 1 boundary: 0-9 XP → level 1, 10+ XP → level 2
    // Start with 5 XP, V0 send = 32 XP → total 37 → level 2+
    const userId = await createTestUser(t, { totalXp: 5, level: 1 });
    const gymId = await createTestGym(t);

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "V0",
        gradeSystem: "v_scale",
        type: "send",
      }
    );

    expect(result.events.some((e) => e.type === "level_up")).toBe(true);
  });

  it("does not fire level_up when staying at same level", async () => {
    const t = convexTest(schema, modules);
    // Start with 0 XP, VB send = 10 XP → total 10 → level 2 (level up fires)
    // But VB attempt = 3 XP → total 3 → still level 1 (no level up)
    const userId = await createTestUser(t, { totalXp: 0, level: 1 });
    const gymId = await createTestGym(t);

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "VB",
        gradeSystem: "v_scale",
        type: "attempt", // 3 XP, stays at level 1
      }
    );

    expect(result.events.some((e) => e.type === "level_up")).toBe(false);
  });
});

// ─── logClimb: volume PR ──────────────────────────────────────

describe("logClimb (volume PR)", () => {
  it("first send at a grade sets a volume PR", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, userId, gymId, {
      status: "active",
    });

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "V2",
        gradeSystem: "v_scale",
        type: "send",
        sessionId,
      }
    );

    expect(result.events.some((e) => e.type === "volume_pr")).toBe(true);

    const user = await t.run((ctx) => ctx.db.get(userId));
    const pr = user?.volumePRs?.find((p) => p.grade === "V2");
    // code does sessionSends.length + 1; reads see the new send, so first send = count 2
    expect(pr?.count).toBe(2);
  });
});

// ─── logClimb: gym color grade ────────────────────────────────

describe("logClimb (gym color grade)", () => {
  it("resolves gym color grade via gymGradeSystems", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    // Set up gym grade system with color "Yellow" → V0
    await t.run((ctx) =>
      ctx.db.insert("gymGradeSystems", {
        gymId,
        name: "Test Color System",
        type: "color",
        grades: [
          {
            label: "Yellow",
            order: 1,
            vRangeMin: "VB",
            vRangeMax: "V1",
            xpMidpoint: "V0",
          },
        ],
      })
    );

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.progression.logClimb,
      {
        gymId,
        grade: "Yellow",
        gradeSystem: "gym_color",
        type: "send",
      }
    );

    // V0 = 32 XP
    expect(result.xpAwarded).toBe(32);
  });

  it("throws on unknown gym color grade", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    await expect(
      t.withIdentity({ subject: userId }).mutation(api.progression.logClimb, {
        gymId,
        grade: "Purple",
        gradeSystem: "gym_color",
        type: "send",
      })
    ).rejects.toThrow("Unknown gym color grade: Purple");
  });
});

// ─── checkAchievements ────────────────────────────────────────

describe("checkAchievements", () => {
  it("awards first_boulder achievement on first boulder send", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { maxGradeBoulder: "V0" });

    await t.mutation(internal.progression.checkAchievements, { userId });

    const achievements = await t.run((ctx) =>
      ctx.db
        .query("achievements")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    );
    expect(achievements.some((a) => a.type === "first_boulder")).toBe(true);
  });

  it("skips already-earned achievements", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { maxGradeBoulder: "V0" });

    // Run twice
    await t.mutation(internal.progression.checkAchievements, { userId });
    await t.mutation(internal.progression.checkAchievements, { userId });

    const achievements = await t.run((ctx) =>
      ctx.db
        .query("achievements")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", userId).eq("type", "first_boulder")
        )
        .collect()
    );
    expect(achievements).toHaveLength(1); // not duplicated
  });

  it("grants inventory items when achievement earned", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { maxGradeBoulder: "V0" });

    await t.mutation(internal.progression.checkAchievements, { userId });

    const inventory = await t.run((ctx) =>
      ctx.db
        .query("inventoryItems")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    );
    // first_boulder grants ["chalk"]
    expect(inventory.some((i) => i.itemType === "chalk")).toBe(true);
  });

  it("does not award grade_v4 when maxGradeBoulder is below V4", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, { maxGradeBoulder: "V3" });

    await t.mutation(internal.progression.checkAchievements, { userId });

    const achievements = await t.run((ctx) =>
      ctx.db
        .query("achievements")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", userId).eq("type", "grade_v4")
        )
        .collect()
    );
    expect(achievements).toHaveLength(0);
  });
});

// ─── applyNoShowCurse ─────────────────────────────────────────

describe("applyNoShowCurse", () => {
  it("applies a 7-day debuff to the user", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    const before = Date.now();
    await t.mutation(internal.progression.applyNoShowCurse, { userId });
    const after = Date.now();

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.currentStatus?.type).toBe("debuff");
    expect(user?.currentStatus?.expiresAt).toBeGreaterThan(
      before + 6 * 24 * 60 * 60 * 1000
    );
    expect(user?.currentStatus?.expiresAt).toBeLessThan(
      after + 8 * 24 * 60 * 60 * 1000
    );
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { createTestUser, createTestGym, createTestSession } from "./_helpers";

const modules = import.meta.glob("../../convex/**/*.ts");

// ─── createRaid ───────────────────────────────────────────────

describe("createRaid", () => {
  it("creates session in draft status with shortCode", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.sessions.createRaid,
      {
        gymId,
        scheduledAt: Date.now() + 3600000,
        inviteUserIds: [],
        inviteGuildIds: [],
      }
    );

    expect(result.sessionId).toBeDefined();
    expect(result.shortCode).toBeDefined();
    expect(result.shortCode).toHaveLength(8);

    const session = await t.run((ctx) => ctx.db.get(result.sessionId));
    expect(session?.status).toBe("draft");
    expect(session?.type).toBe("raid");
  });

  it("creator membership is automatically accepted", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    const { sessionId } = await t.withIdentity({ subject: userId }).mutation(
      api.sessions.createRaid,
      {
        gymId,
        scheduledAt: Date.now() + 3600000,
        inviteUserIds: [],
        inviteGuildIds: [],
      }
    );

    const members = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect()
    );

    expect(members).toHaveLength(1);
    expect(members[0]?.userId).toBe(userId);
    expect(members[0]?.status).toBe("accepted");
  });

  it("invited users get 'invited' status", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const inviteeId = await createTestUser(t, { generatedName: "Invitee" });
    const gymId = await createTestGym(t);

    const { sessionId } = await t.withIdentity({ subject: creatorId }).mutation(
      api.sessions.createRaid,
      {
        gymId,
        scheduledAt: Date.now() + 3600000,
        inviteUserIds: [inviteeId],
        inviteGuildIds: [],
      }
    );

    const members = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect()
    );

    const inviteeMembership = members.find((m) => m.userId === inviteeId);
    expect(inviteeMembership?.status).toBe("invited");
  });

  it("throws when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    const gymId = await createTestGym(t);

    await expect(
      t.mutation(api.sessions.createRaid, {
        gymId,
        scheduledAt: Date.now() + 3600000,
        inviteUserIds: [],
        inviteGuildIds: [],
      })
    ).rejects.toThrow("Not authenticated");
  });
});

// ─── confirmRaid ──────────────────────────────────────────────

describe("confirmRaid", () => {
  it("creator can confirm draft → open", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, userId, gymId, {
      status: "draft",
    });

    await t.withIdentity({ subject: userId }).mutation(
      api.sessions.confirmRaid,
      { sessionId }
    );

    const session = await t.run((ctx) => ctx.db.get(sessionId));
    expect(session?.status).toBe("open");
  });

  it("non-creator throws", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const otherId = await createTestUser(t, { generatedName: "Other" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId, {
      status: "draft",
    });

    await expect(
      t.withIdentity({ subject: otherId }).mutation(api.sessions.confirmRaid, {
        sessionId,
      })
    ).rejects.toThrow("Only the creator can confirm a raid");
  });

  it("non-draft session throws", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, userId, gymId, {
      status: "open",
    });

    await expect(
      t.withIdentity({ subject: userId }).mutation(api.sessions.confirmRaid, {
        sessionId,
      })
    ).rejects.toThrow("Session is not in draft status");
  });
});

// ─── respondToInvite ──────────────────────────────────────────

describe("respondToInvite", () => {
  it("invited member can accept", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const inviteeId = await createTestUser(t, { generatedName: "Invitee" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId);

    // Add invitee membership
    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: inviteeId,
        status: "invited",
        invitedBy: creatorId,
        checkedIn: false,
      })
    );

    await t.withIdentity({ subject: inviteeId }).mutation(
      api.sessions.respondToInvite,
      { sessionId, response: "accepted" }
    );

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", inviteeId)
        )
        .unique()
    );
    expect(membership?.status).toBe("accepted");
  });

  it("invited member can decline", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const inviteeId = await createTestUser(t, { generatedName: "Invitee" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId);

    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: inviteeId,
        status: "invited",
        invitedBy: creatorId,
        checkedIn: false,
      })
    );

    await t.withIdentity({ subject: inviteeId }).mutation(
      api.sessions.respondToInvite,
      { sessionId, response: "declined" }
    );

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", inviteeId)
        )
        .unique()
    );
    expect(membership?.status).toBe("declined");
  });

  it("already-responded member throws", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const memberId = await createTestUser(t, { generatedName: "Member" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId);

    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: memberId,
        status: "accepted", // already responded
        invitedBy: creatorId,
        checkedIn: false,
      })
    );

    await expect(
      t.withIdentity({ subject: memberId }).mutation(
        api.sessions.respondToInvite,
        { sessionId, response: "accepted" }
      )
    ).rejects.toThrow("Invite already responded to");
  });

  it("non-member throws", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const strangerId = await createTestUser(t, { generatedName: "Stranger" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId);

    await expect(
      t.withIdentity({ subject: strangerId }).mutation(
        api.sessions.respondToInvite,
        { sessionId, response: "accepted" }
      )
    ).rejects.toThrow("Not a member of this session");
  });
});

// ─── createQuest ─────────────────────────────────────────────

describe("createQuest", () => {
  it("creates quest with open status", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    const result = await t.withIdentity({ subject: userId }).mutation(
      api.sessions.createQuest,
      {
        gymId,
        scheduledAt: Date.now() + 3600000,
        capacity: 4,
        climbingType: "boulder",
        gradeRange: { min: "V2", max: "V5" },
      }
    );

    const session = await t.run((ctx) => ctx.db.get(result.sessionId));
    expect(session?.status).toBe("open");
    expect(session?.type).toBe("quest");
    expect(session?.capacity).toBe(4);
  });

  it("rejects capacity below 2", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    await expect(
      t.withIdentity({ subject: userId }).mutation(api.sessions.createQuest, {
        gymId,
        scheduledAt: Date.now() + 3600000,
        capacity: 1,
        climbingType: "boulder",
        gradeRange: { min: "V2", max: "V5" },
      })
    ).rejects.toThrow("Capacity must be between 2 and 10");
  });

  it("rejects capacity above 10", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);

    await expect(
      t.withIdentity({ subject: userId }).mutation(api.sessions.createQuest, {
        gymId,
        scheduledAt: Date.now() + 3600000,
        capacity: 11,
        climbingType: "boulder",
        gradeRange: { min: "V2", max: "V5" },
      })
    ).rejects.toThrow("Capacity must be between 2 and 10");
  });
});

// ─── joinQuest ───────────────────────────────────────────────

describe("joinQuest", () => {
  it("adds accepted member to open quest", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const joinerId = await createTestUser(t, { generatedName: "Joiner" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId, {
      type: "quest",
      status: "open",
      capacity: 4,
    });

    await t.withIdentity({ subject: joinerId }).mutation(
      api.sessions.joinQuest,
      { sessionId }
    );

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", joinerId)
        )
        .unique()
    );
    expect(membership?.status).toBe("accepted");
  });

  it("rejects when at capacity", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const joinerId = await createTestUser(t, { generatedName: "Joiner" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId, {
      type: "quest",
      status: "open",
      capacity: 1, // already full (creator is 1 member)
    });

    await expect(
      t.withIdentity({ subject: joinerId }).mutation(api.sessions.joinQuest, {
        sessionId,
      })
    ).rejects.toThrow("Quest is at capacity");
  });

  it("rejects non-quest session", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const joinerId = await createTestUser(t, { generatedName: "Joiner" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId, {
      type: "raid",
      status: "open",
    });

    await expect(
      t.withIdentity({ subject: joinerId }).mutation(api.sessions.joinQuest, {
        sessionId,
      })
    ).rejects.toThrow("Not a quest session");
  });

  it("rejects already-joined member", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId, {
      type: "quest",
      status: "open",
      capacity: 4,
    });

    // Creator tries to join their own quest
    await expect(
      t.withIdentity({ subject: creatorId }).mutation(api.sessions.joinQuest, {
        sessionId,
      })
    ).rejects.toThrow("Already joined this quest");
  });
});

// ─── inviteToSession ─────────────────────────────────────────

describe("inviteToSession", () => {
  it("accepted member can invite others", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const inviteeId = await createTestUser(t, { generatedName: "Invitee" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId);

    await t.withIdentity({ subject: creatorId }).mutation(
      api.sessions.inviteToSession,
      { sessionId, userIds: [inviteeId] }
    );

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", inviteeId)
        )
        .unique()
    );
    expect(membership?.status).toBe("invited");
  });

  it("skips duplicate invites", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const inviteeId = await createTestUser(t, { generatedName: "Invitee" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId);

    // Invite twice
    await t.withIdentity({ subject: creatorId }).mutation(
      api.sessions.inviteToSession,
      { sessionId, userIds: [inviteeId] }
    );
    await t.withIdentity({ subject: creatorId }).mutation(
      api.sessions.inviteToSession,
      { sessionId, userIds: [inviteeId] }
    );

    const members = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect()
    );
    const inviteeRows = members.filter((m) => m.userId === inviteeId);
    expect(inviteeRows).toHaveLength(1);
  });

  it("non-accepted member cannot invite", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const invitedId = await createTestUser(t, { generatedName: "Invited" });
    const thirdId = await createTestUser(t, { generatedName: "Third" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId);

    // invitedId is invited (not accepted)
    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: invitedId,
        status: "invited",
        invitedBy: creatorId,
        checkedIn: false,
      })
    );

    await expect(
      t.withIdentity({ subject: invitedId }).mutation(
        api.sessions.inviteToSession,
        { sessionId, userIds: [thirdId] }
      )
    ).rejects.toThrow("Must be an accepted member to invite");
  });
});

// ─── cancelAttendance ────────────────────────────────────────

describe("cancelAttendance", () => {
  it("non-leader accepted member can cancel", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const memberId = await createTestUser(t, { generatedName: "Member" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId);

    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: memberId,
        status: "accepted",
        invitedBy: creatorId,
        checkedIn: false,
      })
    );

    await t.withIdentity({ subject: memberId }).mutation(
      api.sessions.cancelAttendance,
      { sessionId }
    );

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", memberId)
        )
        .unique()
    );
    expect(membership?.status).toBe("declined");
  });

  it("leader must use desert action instead", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId);

    await expect(
      t.withIdentity({ subject: creatorId }).mutation(
        api.sessions.cancelAttendance,
        { sessionId }
      )
    ).rejects.toThrow("Leader must use the 'desert' action");
  });
});

// ─── desertAsLeader ──────────────────────────────────────────

describe("desertAsLeader", () => {
  it("sets dissolveAt and marks leader as declined", async () => {
    const t = convexTest(schema, modules);
    const leaderId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, leaderId, gymId, {
      status: "active",
    });

    const before = Date.now();
    await t.withIdentity({ subject: leaderId }).mutation(
      api.sessions.desertAsLeader,
      { sessionId }
    );
    const after = Date.now();

    const session = await t.run((ctx) => ctx.db.get(sessionId));
    expect(session?.dissolveAt).toBeGreaterThan(before);
    expect(session?.dissolveAt).toBeLessThan(after + 31 * 60 * 1000);

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", leaderId)
        )
        .unique()
    );
    expect(membership?.status).toBe("declined");
  });

  it("non-leader throws", async () => {
    const t = convexTest(schema, modules);
    const leaderId = await createTestUser(t);
    const otherId = await createTestUser(t, { generatedName: "Other" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, leaderId, gymId);

    await expect(
      t.withIdentity({ subject: otherId }).mutation(
        api.sessions.desertAsLeader,
        { sessionId }
      )
    ).rejects.toThrow("You are not the leader");
  });
});

// ─── volunteerAsLeader ───────────────────────────────────────

describe("volunteerAsLeader", () => {
  it("accepted member claims leadership and clears dissolveAt", async () => {
    const t = convexTest(schema, modules);
    const originalLeaderId = await createTestUser(t);
    const volunteerId = await createTestUser(t, {
      generatedName: "Volunteer",
    });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, originalLeaderId, gymId, {
      dissolveAt: Date.now() + 10000,
    });

    // Add volunteer as accepted member
    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: volunteerId,
        status: "accepted",
        invitedBy: originalLeaderId,
        checkedIn: false,
      })
    );

    await t.withIdentity({ subject: volunteerId }).mutation(
      api.sessions.volunteerAsLeader,
      { sessionId }
    );

    const session = await t.run((ctx) => ctx.db.get(sessionId));
    expect(session?.leaderId).toBe(volunteerId);
    expect(session?.dissolveAt).toBeUndefined();
  });

  it("non-accepted member cannot volunteer", async () => {
    const t = convexTest(schema, modules);
    const leaderId = await createTestUser(t);
    const invitedId = await createTestUser(t, { generatedName: "Invited" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, leaderId, gymId);

    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: invitedId,
        status: "invited", // not accepted
        invitedBy: leaderId,
        checkedIn: false,
      })
    );

    await expect(
      t.withIdentity({ subject: invitedId }).mutation(
        api.sessions.volunteerAsLeader,
        { sessionId }
      )
    ).rejects.toThrow("Must be an accepted member to volunteer");
  });
});

// ─── confirmAttendance ───────────────────────────────────────

describe("confirmAttendance", () => {
  it("sets checkedIn to true for member", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, creatorId, gymId, {
      status: "active",
    });

    await t.withIdentity({ subject: creatorId }).mutation(
      api.sessions.confirmAttendance,
      { sessionId }
    );

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", creatorId)
        )
        .unique()
    );
    expect(membership?.checkedIn).toBe(true);
  });
});

// ─── updateCheckInMessage ────────────────────────────────────

describe("updateCheckInMessage", () => {
  it("leader can update check-in message", async () => {
    const t = convexTest(schema, modules);
    const leaderId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, leaderId, gymId, {
      status: "active",
    });

    await t.withIdentity({ subject: leaderId }).mutation(
      api.sessions.updateCheckInMessage,
      { sessionId, message: "Meet at the blue wall!" }
    );

    const session = await t.run((ctx) => ctx.db.get(sessionId));
    expect(session?.checkInMessage).toBe("Meet at the blue wall!");
  });

  it("non-leader throws", async () => {
    const t = convexTest(schema, modules);
    const leaderId = await createTestUser(t);
    const memberId = await createTestUser(t, { generatedName: "Member" });
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, leaderId, gymId, {
      status: "active",
    });

    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: memberId,
        status: "accepted",
        invitedBy: leaderId,
        checkedIn: false,
      })
    );

    await expect(
      t.withIdentity({ subject: memberId }).mutation(
        api.sessions.updateCheckInMessage,
        { sessionId, message: "Unauthorized message" }
      )
    ).rejects.toThrow("Only the leader can update the check-in message");
  });
});

// ─── checkSessionLifecycle ───────────────────────────────────

describe("checkSessionLifecycle", () => {
  it("open session past scheduledAt becomes active", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, userId, gymId, {
      status: "open",
      scheduledAt: Date.now() - 1000, // 1 second in the past
    });

    await t.mutation(internal.sessions.checkSessionLifecycle);

    const session = await t.run((ctx) => ctx.db.get(sessionId));
    expect(session?.status).toBe("active");
  });

  it("active session 2+ hours past scheduledAt becomes completed", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, userId, gymId, {
      status: "active",
      scheduledAt: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
    });

    await t.mutation(internal.sessions.checkSessionLifecycle);

    const session = await t.run((ctx) => ctx.db.get(sessionId));
    expect(session?.status).toBe("completed");
  });

  it("future open session is not activated", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, userId, gymId, {
      status: "open",
      scheduledAt: Date.now() + 60 * 60 * 1000, // 1 hour in future
    });

    await t.mutation(internal.sessions.checkSessionLifecycle);

    const session = await t.run((ctx) => ctx.db.get(sessionId));
    expect(session?.status).toBe("open");
  });

  it("active session past dissolveAt becomes dissolved", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const gymId = await createTestGym(t);
    const sessionId = await createTestSession(t, userId, gymId, {
      status: "active",
      scheduledAt: Date.now() - 60 * 1000, // 1 min ago (not 2hrs yet)
      dissolveAt: Date.now() - 1000, // dissolve window expired
    });

    await t.mutation(internal.sessions.checkSessionLifecycle);

    const session = await t.run((ctx) => ctx.db.get(sessionId));
    expect(session?.status).toBe("dissolved");
  });
});

// ─── checkNoShows ────────────────────────────────────────────

describe("checkNoShows", () => {
  it("accepted member in completed quest window becomes no_show_pending", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const memberId = await createTestUser(t, { generatedName: "Member" });
    const gymId = await createTestGym(t);

    // Quest completed 2 hours ago (within 1-3 hour window)
    const sessionId = await createTestSession(t, creatorId, gymId, {
      type: "quest",
      status: "completed",
      scheduledAt: Date.now() - 2 * 60 * 60 * 1000,
    });

    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: memberId,
        status: "accepted", // not checked in
        invitedBy: creatorId,
        checkedIn: false,
      })
    );

    await t.mutation(internal.sessions.checkNoShows);

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", memberId)
        )
        .unique()
    );
    expect(membership?.status).toBe("no_show_pending");
  });

  it("no_show_pending member becomes no_show on second pass", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const memberId = await createTestUser(t, { generatedName: "Member" });
    const gymId = await createTestGym(t);

    const sessionId = await createTestSession(t, creatorId, gymId, {
      type: "quest",
      status: "completed",
      scheduledAt: Date.now() - 2 * 60 * 60 * 1000,
    });

    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: memberId,
        status: "no_show_pending",
        invitedBy: creatorId,
        checkedIn: false,
      })
    );

    await t.mutation(internal.sessions.checkNoShows);

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", memberId)
        )
        .unique()
    );
    expect(membership?.status).toBe("no_show");
  });

  it("checked-in member is not flagged", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const memberId = await createTestUser(t, { generatedName: "Member" });
    const gymId = await createTestGym(t);

    const sessionId = await createTestSession(t, creatorId, gymId, {
      type: "quest",
      status: "completed",
      scheduledAt: Date.now() - 2 * 60 * 60 * 1000,
    });

    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: memberId,
        status: "accepted",
        invitedBy: creatorId,
        checkedIn: true, // checked in!
      })
    );

    await t.mutation(internal.sessions.checkNoShows);

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", memberId)
        )
        .unique()
    );
    expect(membership?.status).toBe("accepted"); // unchanged
  });

  it("raid sessions are not checked for no-shows", async () => {
    const t = convexTest(schema, modules);
    const creatorId = await createTestUser(t);
    const memberId = await createTestUser(t, { generatedName: "Member" });
    const gymId = await createTestGym(t);

    const sessionId = await createTestSession(t, creatorId, gymId, {
      type: "raid", // not a quest
      status: "completed",
      scheduledAt: Date.now() - 2 * 60 * 60 * 1000,
    });

    await t.run((ctx) =>
      ctx.db.insert("sessionMembers", {
        sessionId,
        userId: memberId,
        status: "accepted",
        invitedBy: creatorId,
        checkedIn: false,
      })
    );

    await t.mutation(internal.sessions.checkNoShows);

    const membership = await t.run((ctx) =>
      ctx.db
        .query("sessionMembers")
        .withIndex("by_session_user", (q) =>
          q.eq("sessionId", sessionId).eq("userId", memberId)
        )
        .unique()
    );
    expect(membership?.status).toBe("accepted"); // unchanged
  });
});

// ─── clearExpiredStatuses ────────────────────────────────────

describe("clearExpiredStatuses", () => {
  it("clears expired currentStatus from users", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, {
      currentStatus: {
        effect: "Cursed",
        type: "debuff",
        expiresAt: Date.now() - 1000, // expired
      },
    });

    await t.mutation(internal.sessions.clearExpiredStatuses);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.currentStatus).toBeUndefined();
  });

  it("leaves unexpired status alone", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t, {
      currentStatus: {
        effect: "Buff",
        type: "buff",
        expiresAt: Date.now() + 60 * 60 * 1000, // expires in 1 hour
      },
    });

    await t.mutation(internal.sessions.clearExpiredStatuses);

    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.currentStatus).toBeDefined();
    expect(user?.currentStatus?.effect).toBe("Buff");
  });
});

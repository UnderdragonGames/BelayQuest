import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users ───────────────────────────────────────────────
  users: defineTable({
    phone: v.string(),
    generatedName: v.string(),
    climbingStyles: v.array(v.string()),
    gradeRangeRoute: v.optional(
      v.object({
        min: v.string(),
        max: v.string(),
      })
    ),
    gradeRangeBoulder: v.optional(
      v.object({
        min: v.string(),
        max: v.string(),
      })
    ),
    yearsClimbing: v.optional(v.string()),
    level: v.number(),
    totalXp: v.number(),
    currentStatus: v.optional(
      v.object({
        effect: v.string(),
        type: v.union(v.literal("buff"), v.literal("debuff")),
        expiresAt: v.number(),
      })
    ),
    maxGradeRoute: v.optional(v.string()),
    maxGradeBoulder: v.optional(v.string()),
    favoriteGyms: v.array(v.id("gyms")),
    expoPushToken: v.optional(v.string()),
    onboardingComplete: v.boolean(),
  })
    .index("by_phone", ["phone"])
    .index("by_generatedName", ["generatedName"]),

  // ─── Gyms ────────────────────────────────────────────────
  gyms: defineTable({
    name: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    source: v.string(),
    verified: v.boolean(),
  })
    .index("by_city_state", ["state", "city"])
    .searchIndex("search_name", { searchField: "name" }),

  // ─── Sessions (Raids + Quests) ───────────────────────────
  sessions: defineTable({
    type: v.union(v.literal("raid"), v.literal("quest")),
    creatorId: v.id("users"),
    leaderId: v.id("users"),
    gymId: v.id("gyms"),
    scheduledAt: v.number(),
    note: v.optional(v.string()),
    checkInMessage: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("dissolved")
    ),
    // Quest-specific
    capacity: v.optional(v.number()),
    climbingType: v.optional(v.string()),
    gradeRange: v.optional(
      v.object({
        min: v.string(),
        max: v.string(),
      })
    ),
    dissolveAt: v.optional(v.number()),
    // Universal link short code
    shortCode: v.string(),
  })
    .index("by_gym_status", ["gymId", "status"])
    .index("by_status_scheduledAt", ["status", "scheduledAt"])
    .index("by_creator", ["creatorId"])
    .index("by_shortCode", ["shortCode"]),

  // ─── Session Members ─────────────────────────────────────
  sessionMembers: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    status: v.union(
      v.literal("invited"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("no_show_pending"),
      v.literal("attended"),
      v.literal("no_show")
    ),
    invitedBy: v.id("users"),
    respondedAt: v.optional(v.number()),
    checkedIn: v.boolean(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_session_user", ["sessionId", "userId"]),

  // ─── Connections ─────────────────────────────────────────
  connections: defineTable({
    userId: v.id("users"),
    connectedUserId: v.id("users"),
    nickname: v.optional(v.string()),
    source: v.union(
      v.literal("phone"),
      v.literal("quest_match"),
      v.literal("invite_link")
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_connected", ["userId", "connectedUserId"]),

  // ─── Guilds ──────────────────────────────────────────────
  guilds: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    isDefault: v.boolean(),
  }).index("by_owner", ["ownerId"]),

  guildMembers: defineTable({
    guildId: v.id("guilds"),
    userId: v.id("users"),
  })
    .index("by_guild", ["guildId"])
    .index("by_user", ["userId"]),

  // ─── Sends (Route Log) ──────────────────────────────────
  sends: defineTable({
    userId: v.id("users"),
    sessionId: v.optional(v.id("sessions")),
    gymId: v.id("gyms"),
    grade: v.string(),
    gradeSystem: v.union(v.literal("yds"), v.literal("v_scale")),
    type: v.union(v.literal("send"), v.literal("attempt")),
    xpAwarded: v.number(),
    climbedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_date", ["userId", "climbedAt"]),

  // ─── XP Ledger ───────────────────────────────────────────
  xpLedger: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    source: v.union(
      v.literal("send"),
      v.literal("attempt"),
      v.literal("party_bonus"),
      v.literal("grade_breakthrough"),
      v.literal("adjustment")
    ),
    sourceId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"]),

  // ─── Quest Matches (Post-Session) ───────────────────────
  questMatches: defineTable({
    sessionId: v.id("sessions"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    response: v.union(
      v.literal("pending"),
      v.literal("yes"),
      v.literal("no")
    ),
    respondedAt: v.optional(v.number()),
  })
    .index("by_session", ["sessionId"])
    .index("by_to_user", ["toUserId"]),

  // ─── Pending Invites (Phone Number) ──────────────────────
  pendingInvites: defineTable({
    phone: v.string(),
    sessionId: v.id("sessions"),
    invitedBy: v.id("users"),
    smsMessageId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_phone", ["phone"])
    .index("by_session", ["sessionId"]),
});

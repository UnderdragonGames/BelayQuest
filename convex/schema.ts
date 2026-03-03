import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// ─── Avatar shape (reused across tables) ─────────────────────
// Not a Convex validator — just a reference for the shape used
// in avatarDefaults, avatarGymOverrides, and session snapshots.
const avatarValidator = v.object({
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
});

export default defineSchema({
  ...authTables,

  // ─── Users ───────────────────────────────────────────────
  // Extends authTables.users with app-specific fields.
  // Auth fields (phone, email, name, image, etc.) come from authTables;
  // we override to add our app columns.
  users: defineTable({
    // Auth fields (all optional to allow incremental onboarding)
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    phoneVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),
    // App-specific fields
    generatedName: v.optional(v.string()),
    climbingStyles: v.optional(v.array(v.string())),
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
    level: v.optional(v.number()),
    totalXp: v.optional(v.number()),
    currentStatus: v.optional(
      v.object({
        effect: v.string(),
        type: v.union(v.literal("buff"), v.literal("debuff")),
        expiresAt: v.number(),
      })
    ),
    maxGradeRoute: v.optional(v.string()),
    maxGradeBoulder: v.optional(v.string()),
    favoriteGyms: v.optional(v.array(v.id("gyms"))),
    expoPushToken: v.optional(v.string()),
    pendingInvitePhones: v.optional(v.array(v.string())),
    onboardingComplete: v.optional(v.boolean()),

    // ─── Cached progression stats ──────────────────────────
    // Volume PRs: max sends at each grade in a single session
    // Stored as array of {grade, count} since Convex doesn't support Map
    volumePRs: v.optional(
      v.array(v.object({ grade: v.string(), count: v.number() }))
    ),

    // ─── Hero class (auto-detected, v1+) ───────────────────
    heroClass: v.optional(
      v.union(
        v.literal("grinder"),
        v.literal("sender"),
        v.literal("projector"),
        v.literal("explorer"),
        v.literal("rally_captain")
      )
    ),

    // ─── Avatar defaults ───────────────────────────────────
    avatarDefaults: v.optional(avatarValidator),
  })
    .index("by_generatedName", ["generatedName"])
    .index("email", ["email"])
    .index("phone", ["phone"]),

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

  // ─── Gym Grade Systems ──────────────────────────────────
  // Gym-specific grading systems (e.g., color circuits).
  // Standard systems (YDS, V Scale, Font, French) are handled in code.
  gymGradeSystems: defineTable({
    gymId: v.id("gyms"),
    name: v.string(), // "Bouldering Project Circuit"
    type: v.union(v.literal("color"), v.literal("custom")),
    grades: v.array(
      v.object({
        label: v.string(), // "Yellow", "Red", "Purple"
        order: v.number(), // 1, 2, 3 — defines progression
        vRangeMin: v.optional(v.string()), // "VB"
        vRangeMax: v.optional(v.string()), // "V1"
        xpMidpoint: v.optional(v.string()), // "V0" — used for XP calculation
      })
    ),
  }).index("by_gym", ["gymId"]),

  // ─── Routes (v1+ — identified route entities) ───────────
  // Not populated in v0 (manual logging has no route identity).
  // Created when QR/NFC scanning is introduced.
  routes: defineTable({
    gymId: v.id("gyms"),
    grade: v.string(),
    gradeSystem: v.union(
      v.literal("yds"),
      v.literal("v_scale"),
      v.literal("font"),
      v.literal("french"),
      v.literal("gym_color")
    ),
    climbingType: v.optional(v.string()), // "boulder", "lead", "top_rope"
    locationDescription: v.optional(v.string()), // "blue holds, slab wall"
    qrIdentifier: v.optional(v.string()), // QR/NFC code
    createdAt: v.number(),
    lastLoggedAt: v.optional(v.number()), // Tracks staleness
    // Cached community difficulty stats (recency-weighted)
    difficultyStats: v.optional(
      v.object({
        avgRating: v.number(), // 1-4 scale (soft to very_hard)
        ratingCount: v.number(),
        isBoss: v.boolean(), // Hardest at this grade at this gym
      })
    ),
  })
    .index("by_gym", ["gymId"])
    .index("by_gym_grade", ["gymId", "grade"])
    .index("by_qr", ["qrIdentifier"]),

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
    // Avatar snapshot at session time (for identification)
    avatarSnapshot: v.optional(avatarValidator),
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
  // Every climb logged — both sends and attempts (same entity).
  sends: defineTable({
    userId: v.id("users"),
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
    xpAwarded: v.number(),
    climbedAt: v.number(),
    // Forward-compatible: links to identified route (null in v0)
    routeId: v.optional(v.id("routes")),
    // Subjective difficulty relative to stated grade
    difficultyRating: v.optional(
      v.union(
        v.literal("soft"),
        v.literal("on_grade"),
        v.literal("hard"),
        v.literal("very_hard")
      )
    ),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_date", ["userId", "climbedAt"])
    .index("by_gym_grade", ["gymId", "grade"]),

  // ─── XP Ledger ───────────────────────────────────────────
  // Source of truth for all XP. users.totalXp is a cached sum.
  xpLedger: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    source: v.union(
      v.literal("send"),
      v.literal("attempt"),
      v.literal("party_bonus"),
      v.literal("grade_breakthrough"),
      v.literal("boss_defeat"),
      v.literal("volume_pr"),
      v.literal("achievement"),
      v.literal("adjustment")
    ),
    sourceId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"]),

  // ─── Events (Accomplishments & Milestones) ───────────────
  // Significant moments computed from sends/sessions.
  // Low volume (1-3 per session). Flexible, extensible.
  // Drives achievement detection, hero class computation, and
  // the "recent accomplishments" timeline.
  events: defineTable({
    userId: v.id("users"),
    type: v.string(), // Flexible: "grade_breakthrough", "volume_pr", "boss_defeat", "level_up", "tape_earned", etc.
    metadata: v.optional(v.any()), // { grade?, attemptCount?, previousRecord?, newRecord?, ... }
    xpAwarded: v.number(), // 0 if no XP for this event type
    sessionId: v.optional(v.id("sessions")),
    sendId: v.optional(v.id("sends")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"])
    .index("by_type", ["type"]),

  // ─── Inventory Items ─────────────────────────────────────
  // Per-item tracking with provenance. Enables trading, gifting,
  // and individual item history. Climbing-themed items.
  inventoryItems: defineTable({
    userId: v.id("users"), // Current owner
    itemType: v.string(), // "tape", "chalk", "liquid_chalk", "carabiner", "quickdraw", "brush", etc.
    sourceEventId: v.optional(v.id("events")),
    sourceAchievementId: v.optional(v.id("achievements")),
    status: v.union(
      v.literal("held"),
      v.literal("used"),
      v.literal("traded")
    ),
    acquiredAt: v.number(),
    usedAt: v.optional(v.number()),
    tradedToUserId: v.optional(v.id("users")),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "itemType"])
    .index("by_user_status", ["userId", "status"]),

  // ─── Achievements ────────────────────────────────────────
  // Hand-designed, earned from events. Each unlocks inventory
  // items and/or avatar cosmetics.
  achievements: defineTable({
    userId: v.id("users"),
    type: v.string(), // "first_v4", "streak_7", "boss_slayer", "explorer_5", etc.
    metadata: v.optional(v.any()), // { grade?, gymCount?, streakDays?, ... }
    itemsGranted: v.optional(v.array(v.string())), // Item types awarded
    cosmeticGranted: v.optional(v.string()), // Avatar cosmetic unlocked
    earnedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  // ─── Avatar Gym Overrides ────────────────────────────────
  // Per-gym appearance settings (e.g., harness at rope gym,
  // no harness at bouldering gym).
  avatarGymOverrides: defineTable({
    userId: v.id("users"),
    gymId: v.id("gyms"),
    overrides: v.any(), // Partial avatar fields
    lastUsedAt: v.number(),
  })
    .index("by_user_gym", ["userId", "gymId"]),

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

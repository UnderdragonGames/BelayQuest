# Belay Quest — Technical Architecture

## Stack Overview

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React Native (Expo managed) | Cross-platform iOS + Android. Expo managed workflow for fast iteration, EAS Build for distribution. |
| **Web** | React Native Web | Same components render on web. Read-only/unauthenticated. Minimizes double-work. |
| **Backend** | Convex | Reactive database, server functions, real-time subscriptions. Single backend for all data, logic, and realtime. |
| **Auth** | Convex Auth | SMS OTP for phone-based signup. Native React Native support. No external auth service needed. |
| **Push Notifications** | Expo Notifications | Unified APNs + FCM. Free tier sufficient for v1. Convex actions trigger push via Expo's push API. |
| **SMS Invites** | Twilio | Session invite SMS with universal links. Convex action calls Twilio API. ~$0.008/SMS. |
| **Universal Links** | Convex HTTP Actions | Serve session web pages with Open Graph meta tags. Handle universal link routing. |
| **Maps** | react-native-maps (Google Maps) | Gym search + favoriting. Distance-sorted results. Consider Mapbox later for custom pixel-art styling. |
| **Distribution (v1)** | EAS Internal Builds | Fast iteration with friend group. No App Store review needed. Up to ~100 devices. |

---

## Project Structure

```
BelayQuest/
├── app/                     # Expo Router screens
│   ├── (tabs)/              # Tab navigator
│   │   ├── quests.tsx       # Quests home
│   │   ├── board.tsx        # Quest Board
│   │   ├── party.tsx        # Party (connections + guilds)
│   │   └── character.tsx    # Character (stats/profile)
│   ├── session/
│   │   └── [id].tsx         # Session detail (Raid or Quest)
│   ├── create/
│   │   ├── raid.tsx         # Create Raid flow
│   │   └── quest.tsx        # Post to Quest Board flow
│   ├── onboarding/
│   │   ├── name.tsx         # Name generation (wizard step 1)
│   │   ├── grades.tsx       # Grade/style setup (wizard step 2)
│   │   ├── gyms.tsx         # Favorite gyms (wizard step 3)
│   │   └── invite.tsx       # Invite friends (wizard step 4)
│   └── _layout.tsx          # Root layout with ConvexProvider
│
├── components/
│   ├── ui/                  # Generic UI primitives
│   ├── session/             # Session cards, detail components
│   ├── party/               # Connection cards, guild chips
│   ├── character/           # Stats display, XP bar, status effects
│   └── wizard/              # Wizard mascot component + speech bubbles
│
├── convex/                  # Convex backend
│   ├── schema.ts            # Database schema
│   ├── auth.ts              # Convex Auth configuration
│   ├── sessions.ts          # Session (Raid/Quest) mutations & queries
│   ├── connections.ts       # Connection/guild mutations & queries
│   ├── progression.ts       # XP, levels, status effects
│   ├── gyms.ts              # Gym database queries
│   ├── notifications.ts     # Push notification actions
│   ├── sms.ts               # Twilio SMS actions
│   ├── http.ts              # HTTP actions (universal links, web pages)
│   └── crons.ts             # Scheduled jobs (session lifecycle, curse expiry)
│
├── lib/
│   ├── copy/                # Centralized copy/strings
│   │   ├── en.ts            # All user-facing strings (nerdy mode)
│   │   └── types.ts         # String key types
│   ├── names/               # Procedural name generation
│   │   ├── adjectives.ts    # Word list
│   │   ├── nouns.ts         # Word list
│   │   └── generator.ts     # Name generation logic
│   ├── xp/                  # XP calculation logic
│   │   └── calculator.ts    # Grade-relative XP formula
│   └── grades/              # Climbing grade utilities
│       └── parser.ts        # Grade parsing, comparison, ranges
│
├── hooks/
│   ├── useSession.ts        # Session data + actions
│   ├── useQuickRaid.ts      # One-tap raid (last gym + default guild)
│   ├── useConnections.ts    # Connection list + nicknames
│   ├── useProgression.ts    # XP, level, status effects
│   └── useCopy.ts           # String lookup hook
│
└── assets/
    ├── wizard/              # Pixel-art wizard sprites
    ├── icons/               # Tab icons, status effect icons
    └── sounds/              # Level-up chime, etc. (future)
```

---

## Data Model (Convex Schema)

### Core Tables

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users ───────────────────────────────────────────────
  users: defineTable({
    // Convex Auth links to this via auth subject
    phone: v.string(),                    // E.164 format, indexed
    generatedName: v.string(),            // "Crimson Gecko", unique
    climbingStyles: v.array(v.string()),  // ["boulder", "lead", "top_rope"]
    gradeRangeRoute: v.optional(v.object({
      min: v.string(),                    // "5.10a"
      max: v.string(),                    // "5.11+"
    })),
    gradeRangeBoulder: v.optional(v.object({
      min: v.string(),                    // "V4"
      max: v.string(),                    // "V6"
    })),
    yearsClimbing: v.optional(v.string()), // "1-3 years"
    level: v.number(),                     // Derived from XP, cached
    totalXp: v.number(),                   // Running total (cache; source of truth is ledger)
    currentStatus: v.optional(v.object({
      effect: v.string(),                 // "Blessed", "Cursed", etc.
      type: v.union(v.literal("buff"), v.literal("debuff")),
      expiresAt: v.number(),              // Timestamp
    })),
    maxGradeRoute: v.optional(v.string()),   // Highest sent route grade
    maxGradeBoulder: v.optional(v.string()), // Highest sent boulder grade
    favoriteGyms: v.array(v.id("gyms")),
    expoPushToken: v.optional(v.string()),   // For push notifications
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
    source: v.string(),                   // "cbj_seed", "user_submitted"
    verified: v.boolean(),
  })
    .index("by_city_state", ["state", "city"])
    .searchIndex("search_name", { searchField: "name" }),

  // ─── Sessions (Raids + Quests) ───────────────────────────
  sessions: defineTable({
    type: v.union(v.literal("raid"), v.literal("quest")),
    creatorId: v.id("users"),
    leaderId: v.id("users"),              // Party leader (can transfer)
    gymId: v.id("gyms"),
    scheduledAt: v.number(),              // Timestamp
    note: v.optional(v.string()),         // "Looking for lead belay"
    checkInMessage: v.optional(v.string()), // "Blue shirt, slab wall"
    status: v.union(
      v.literal("draft"),                // Quick Raid pre-confirmation, no invites sent
      v.literal("open"),                 // Accepting joins, invites sent
      v.literal("active"),              // Session time arrived
      v.literal("completed"),           // Session ended
      v.literal("dissolved"),           // No leader, auto-dissolved
    ),
    // Quest-specific fields
    capacity: v.optional(v.number()),     // Soft cap (3-7)
    climbingType: v.optional(v.string()), // "boulder", "lead", "top_rope", "any"
    gradeRange: v.optional(v.object({
      min: v.string(),
      max: v.string(),
    })),
    dissolveAt: v.optional(v.number()),   // Auto-dissolve timestamp (when leader deserts)
  })
    .index("by_gym_status", ["gymId", "status"])
    .index("by_status_scheduledAt", ["status", "scheduledAt"])
    .index("by_creator", ["creatorId"]),

  // ─── Session Members ─────────────────────────────────────
  sessionMembers: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    status: v.union(
      v.literal("invited"),              // Received invite, hasn't responded
      v.literal("accepted"),             // Confirmed attending
      v.literal("declined"),             // Explicitly declined
      v.literal("no_show_pending"),      // Session passed, no check-in
      v.literal("attended"),             // Confirmed attendance
      v.literal("no_show"),              // Confirmed no-show (honor system)
    ),
    invitedBy: v.id("users"),            // Who invited this person
    respondedAt: v.optional(v.number()),
    checkedIn: v.boolean(),              // Logged a send or tapped "I was here"
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_session_user", ["sessionId", "userId"]),

  // ─── Connections ─────────────────────────────────────────
  connections: defineTable({
    userId: v.id("users"),               // The user who owns this connection
    connectedUserId: v.id("users"),      // The person they're connected to
    nickname: v.optional(v.string()),     // User-local display name
    source: v.union(
      v.literal("phone"),               // Added by phone number
      v.literal("quest_match"),          // Mutual "climb again" after quest
      v.literal("invite_link"),          // Joined via SMS invite link
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_connected", ["userId", "connectedUserId"]),

  // ─── Guilds ──────────────────────────────────────────────
  guilds: defineTable({
    ownerId: v.id("users"),
    name: v.string(),                    // "Tuesday Crew"
    isDefault: v.boolean(),              // Used for quick raid
  })
    .index("by_owner", ["ownerId"]),

  guildMembers: defineTable({
    guildId: v.id("guilds"),
    userId: v.id("users"),               // The connected user in this guild
  })
    .index("by_guild", ["guildId"])
    .index("by_user", ["userId"]),

  // ─── Sends (Route Log) ──────────────────────────────────
  sends: defineTable({
    userId: v.id("users"),
    sessionId: v.optional(v.id("sessions")), // null = solo session
    gymId: v.id("gyms"),
    grade: v.string(),                   // "5.11+", "V6"
    gradeSystem: v.union(v.literal("yds"), v.literal("v_scale")),
    type: v.union(v.literal("send"), v.literal("attempt")),
    xpAwarded: v.number(),               // Calculated at log time
    climbedAt: v.number(),               // Timestamp
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_date", ["userId", "climbedAt"]),

  // ─── XP Ledger ───────────────────────────────────────────
  // Source of truth for all XP. users.totalXp is a cached sum.
  // Ledger enables future economy features (rewards, redemption).
  xpLedger: defineTable({
    userId: v.id("users"),
    amount: v.number(),                  // Can be negative (future: redemptions)
    source: v.union(
      v.literal("send"),                // Route completion
      v.literal("attempt"),             // Attempt XP
      v.literal("party_bonus"),          // Session with others
      v.literal("grade_breakthrough"),   // New max grade
      v.literal("adjustment"),           // Manual/system adjustment
    ),
    sourceId: v.optional(v.string()),    // Reference to send, session, etc.
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
      v.literal("no"),
    ),
    respondedAt: v.optional(v.number()),
  })
    .index("by_session", ["sessionId"])
    .index("by_to_user", ["toUserId"]),

  // ─── Pending Invites (Phone Number) ──────────────────────
  // For users invited by phone who don't have accounts yet
  pendingInvites: defineTable({
    phone: v.string(),                   // Phone number of invitee
    sessionId: v.id("sessions"),
    invitedBy: v.id("users"),
    smsMessageId: v.optional(v.string()), // Twilio message SID
    createdAt: v.number(),
  })
    .index("by_phone", ["phone"])
    .index("by_session", ["sessionId"]),
});
```

### Key Design Decisions

**XP Ledger Pattern:** Every XP change is an immutable ledger entry. `users.totalXp` is a cached sum for fast reads. This enables:
- Auditable XP history
- Future economy features (gym rewards, redemption, partnerships)
- Rate adjustments without data migration
- Analytics on XP sources

**Connections are directional:** Each connection is a row owned by one user. User A's connection to User B is independent of User B's connection to User A. This means:
- Nicknames are per-user (A calls B "Mike", B calls A "Jules")
- Removing a connection is one-sided and silent
- Mutual connections exist when both rows exist

**Sessions table is polymorphic:** Raids and Quests share a table with a `type` discriminator. Quest-specific fields are optional. This simplifies queries that span both types (e.g., "all upcoming sessions for this user").

**Soft cap enforcement:** Quest capacity is stored but not enforced with hard constraints. The mutation checks count and warns but allows overflow. No race condition complexity.

---

## Key Server Functions

### Session Lifecycle

```
Convex Mutations:
├── sessions.createRaid(gymId, scheduledAt, note?, inviteUserIds[], inviteGuildIds[])
├── sessions.createQuest(gymId, scheduledAt, note, capacity, climbingType, gradeRange, checkInMessage)
├── sessions.quickRaid()                    # Uses last gym + default guild + now+1hr
├── sessions.respondToInvite(sessionId, accept: boolean)
├── sessions.joinQuest(sessionId)           # Stranger joins open quest
├── sessions.inviteToSession(sessionId, userIds[])  # Anyone in session can invite
├── sessions.cancelAttendance(sessionId)
├── sessions.desertAsLeader(sessionId)      # Triggers dissolve timer
├── sessions.volunteerAsLeader(sessionId)
├── sessions.updateCheckInMessage(sessionId, message)
└── sessions.confirmAttendance(sessionId)   # "I was here" (honor system)

Convex Queries (real-time):
├── sessions.myUpcoming()                   # Quests tab: all sessions I'm in
├── sessions.questBoard(gymIds[])           # Quest Board: open quests at fav gyms
├── sessions.detail(sessionId)              # Session detail with members
└── sessions.membersForSession(sessionId)   # Live attendee list
```

### Progression

```
Convex Mutations:
├── progression.logSend(sessionId?, gymId, grade, gradeSystem, type)
│   → Calculates XP based on grade vs. personal max
│   → Creates xpLedger entry
│   → Updates user.totalXp cache
│   → Checks for grade breakthrough → applies buff status
│   → If in session with others → applies party bonus
│
├── progression.applyNoShowCurse(userId)
│   → Random debuff selection
│   → Sets user.currentStatus with expiry
│
└── progression.clearExpiredStatus()        # Cron job

Convex Queries:
├── progression.myStats()                   # Character tab data
├── progression.recentSends(userId, limit)
└── progression.gradeHistory(userId)        # For the graph
```

### XP Calculation

```typescript
// lib/xp/calculator.ts
//
// XP is relative to your personal max grade.
// The delta between the route grade and your max determines XP.
//
// Grade delta (route vs max):  XP awarded:
//   +1 or more (new PR)        150-200 + breakthrough bonus (100)
//   0 (at your max)            80-100
//   -1                         40-60
//   -2                         15-25
//   -3 or below                0-5
//
// Attempts award ~25% of send XP at same grade.
// Party bonus: +15% XP when in a session with others.
//
// All values are configurable and will be tuned during testing.
```

### Connections & Guilds

```
Convex Mutations:
├── connections.addByPhone(phone, nickname?)
│   → If phone matches existing user → create connection
│   → If no match → create pendingInvite, trigger Twilio SMS
│
├── connections.matchFromQuest(sessionId, toUserId, response)
│   → If mutual "yes" → create bidirectional connections
│
├── connections.setNickname(connectionId, nickname)
├── connections.remove(connectionId)        # Silent, one-sided
├── guilds.create(name, memberIds[])
├── guilds.addMember(guildId, userId)
├── guilds.removeMember(guildId, userId)
└── guilds.setDefault(guildId)              # For quick raid

Convex Queries:
├── connections.myConnections()             # Party tab
├── connections.myGuilds()
└── connections.search(query)               # For invite flow
```

### Notifications

```
Convex Actions (external API calls):
├── notifications.sendRaidInvite(userId, sessionId)
│   → Expo Push: "[Name] is heading to [gym] around [time]"
│   → Action buttons: "I'm In" / "Not Today"
│
├── notifications.sendSessionReminder(sessionId)
│   → 45 min before. Cron-scheduled.
│
├── notifications.sendQuestJoin(sessionId, joinedUserId)
│   → To session creator when stranger joins
│
├── notifications.sendLeaderDeserted(sessionId)
│   → To all members. "Party leader deserted!"
│
├── notifications.sendNoShowWarning(userId, sessionId)
│   → Honor system prompt. Cron checks ~1hr after session time.
│
├── notifications.sendGradeBreakthrough(userId, grade)
│   → "LEVEL UP! You sent [grade]!"
│
└── notifications.sendSessionDissolved(sessionId)
    → "The raid has fallen. No leader stepped up."
```

### SMS & Universal Links

```
Convex Actions:
├── sms.sendInvite(phone, sessionId, inviterUserId)
│   → Twilio API: sends SMS with belay.quest/j/{shortCode} link
│
Convex HTTP Actions:
├── GET /j/{shortCode}
│   → Returns HTML page with:
│     - Open Graph meta tags (for link previews)
│     - Session details (gym, time, party, spots)
│     - Apple Universal Link / Android App Link headers
│     - "Open in App" / "Download" CTAs
│   → The page is a first-class web experience, not a redirect wall
│
├── GET /.well-known/apple-app-site-association
│   → Apple Universal Links configuration
│
└── GET /.well-known/assetlinks.json
    → Android App Links configuration
```

---

## Scheduled Jobs (Crons)

```
Convex Crons:
├── Every 5 min:  checkSessionLifecycle()
│   → Sessions past scheduledAt: move to "active"
│   → Sessions 2+ hrs past scheduledAt: move to "completed"
│   → Trigger post-session prompts for quest sessions
│   → Check for dissolveAt timestamps (leaderless raids)
│
├── Every 15 min: sendSessionReminders()
│   → Find sessions 45 min from now
│   → Send reminders to accepted members who haven't been reminded
│
├── Every 15 min: checkNoShows()
│   → Sessions completed 1hr+ ago
│   → Members with status "accepted" who haven't checked in
│   → Send honor-system push notification
│
├── Every 1 hr:   clearExpiredStatuses()
│   → Remove expired buff/debuff status effects from users
│
└── Daily:        cleanupOldSessions()
    → Archive sessions older than 30 days
```

---

## Copy System

All user-facing strings live in `lib/copy/en.ts`. Single source of truth.

```typescript
// lib/copy/en.ts
export const copy = {
  // Session lifecycle
  "raid.invite.push": "{name} is heading to {gym} around {time}. Join?",
  "raid.dissolved": "The raid has fallen. No leader stepped up.",
  "quest.join.push": "{name} joined your quest at {gym}",
  "leader.deserted": "Your party leader deserted!",
  "leader.deserted.body": "The quest at {gym} needs a new leader. Step up?",

  // No-show / honor system
  "noshow.warning": "Dark magic stirs... did you make it to your quest at {gym}?",
  "noshow.cursed": "The spirits have cursed you! {effect} befalls you for abandoning your quest.",

  // Progression
  "grade.breakthrough": "By the ancient chalk... you've ascended to {grade}!",
  "levelup": "LEVEL UP! You've reached Level {level}!",
  "buff.applied": "A blessing upon you! Status: {effect}",

  // Wizard onboarding
  "wizard.welcome": "Ah, a new climber approaches! Let me see... The chalk spirits have chosen a name for you.",
  "wizard.grades": "What manner of walls do you scale, adventurer?",
  "wizard.gyms": "Every adventurer needs a dungeon. Where do you climb?",
  "wizard.invite": "One last thing — invite your party! Enter their numbers and I'll send word.",

  // ... etc
} as const;

// Type-safe string keys
export type CopyKey = keyof typeof copy;
```

Future: add `en-plain.ts` for "boring mode" with the same keys, standard language.

---

## Real-Time Data Flow

Convex's reactive queries mean the UI auto-updates when data changes. Key subscription flows:

```
Quest Board Screen
  └─ useQuery(api.sessions.questBoard, { gymIds: user.favoriteGyms })
     └─ Re-renders when: new quest posted, someone joins, quest fills up, quest dissolves

Session Detail Screen
  ├─ useQuery(api.sessions.detail, { sessionId })
  │  └─ Re-renders when: session status changes, leader transfers
  ├─ useQuery(api.sessions.membersForSession, { sessionId })
  │  └─ Re-renders when: someone joins/leaves/accepts/declines
  └─ useQuery(api.sends.forSession, { sessionId })
     └─ Re-renders when: anyone in the session logs a send (live send feed)

Quests Tab (Home)
  └─ useQuery(api.sessions.myUpcoming)
     └─ Re-renders when: new invite, someone joins your session, session dissolves

Character Screen
  └─ useQuery(api.progression.myStats)
     └─ Re-renders when: XP changes, level up, status effect changes
```

No polling. No manual refresh. Data is live.

---

## Authentication Flow

```
1. User opens app for first time
2. Enter phone number
3. Convex Auth sends SMS OTP via configured provider
4. User enters code
5. Convex Auth verifies → creates auth session
6. App checks: user.onboardingComplete?
   → false: route to wizard onboarding
   → true: route to Quests tab
7. Onboarding: generate name → set grades → fav gyms → invite friends
8. Set onboardingComplete = true
```

### Phone Number → User Resolution

When adding a connection by phone number:
```
1. User enters phone number
2. Query users table by phone index
3. If found → create connection row, done
4. If not found → create pendingInvites row
   → Convex action calls Twilio → SMS sent with session link
5. When invited person signs up:
   → Check pendingInvites by their phone
   → Auto-create connections for all pending invites
   → Add them to any sessions they were invited to
```

---

## Quick Raid (One-Tap)

The critical UX feature. Must be ≤1 tap from home screen.

```
User taps [⚡ Quick Raid] on Quests tab
  → sessions.quickRaid() mutation:
    1. Get user's default guild (guild.isDefault = true)
    2. Get user's most-used gym (or first favorite)
    3. Look up last completed raid with same guild
       → If found: use same day-of-week and time
         (e.g., last raid was Tuesday 6pm → schedule next Tuesday 6pm)
       → If not found: default to now + 1 hour
    4. Create session with type "raid"
    5. Create sessionMember rows for all guild members (status: "invited")
    6. Trigger push notifications to all guild members
    7. Return sessionId (session created in "draft" status, invites NOT sent yet)
  → Navigate to pre-filled session confirmation screen
  → User reviews gym, time, guild → can adjust any field
  → User taps "Send Invites" → invites fire, session moves to "open" status
```

The smart scheduling means Quick Raid learns your patterns. If you always climb
with "Tuesday Crew" on Tuesdays at 6pm, one tap schedules the next one.

If no default guild exists, prompt to set one. If no favorite gym, prompt to add one. These are onboarding gates — after onboarding, quick raid always works.

---

## Universal Links Architecture

### Apple Universal Links
```json
// Served by Convex HTTP action at /.well-known/apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [{
      "appIDs": ["TEAMID.quest.belay.app"],
      "paths": ["/j/*"]
    }]
  }
}
```

### Android App Links
```json
// Served by Convex HTTP action at /.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "quest.belay.app",
    "sha256_cert_fingerprints": ["..."]
  }
}]
```

### Link Resolution
```
belay.quest/j/{shortCode}
  → Convex HTTP action looks up session by shortCode
  → If mobile + app installed: deep link opens session detail
  → If mobile + no app: web page with session info + app store link
  → If desktop: web page with session info + download prompt
```

---

## Web (Read-Only) Architecture

Same React Native components, rendered via React Native Web.

```
Mobile App                          Web App
─────────                           ───────
Bottom Tab Navigator                Sidebar/Top Nav
Full interactivity                  Read-only (view-only mode)
Convex Auth (authenticated)         No auth (public queries)
Push notifications                  No push
Expo Notifications SDK              N/A

Shared:
- All screen components (with Platform-aware action gating)
- All Convex query subscriptions
- All UI primitives
- Copy system
```

Action buttons on web show download CTAs:
```typescript
function JoinQuestButton({ sessionId }) {
  if (Platform.OS === 'web') {
    return <DownloadAppCTA context="join-quest" />;
  }
  return <Button onPress={() => joinQuest(sessionId)}>Join Quest</Button>;
}
```

---

## Gym Database Seed

### Initial Load
1. Obtain CBJ CSV (3,100+ gyms)
2. Parse and normalize: name, address, city, state, lat/lng
3. Bulk insert via Convex migration script
4. All seeded gyms: `source: "cbj_seed"`, `verified: true`

### User Submissions
1. User searches, gym not found
2. User submits gym name + address via in-app form
3. Submission sent to designated email (no admin portal in v1)
4. Manual verification + addition to database
5. User notified when gym is added (future: push notification)

---

## Future-Proofing Notes

### Points Economy (Gym Rewards)
The XP ledger pattern supports future economy features:
- Gym partnerships: "redeem 500 XP for a free day pass"
- Negative ledger entries for redemptions
- Per-gym XP tracking (add gymId to ledger entries)
- Partner API for gyms to verify/redeem

### DLC / Monetization
Architecture supports cosmetic purchases without changes:
- **Name packs:** Additional word lists gated by purchase flag on user
- **Wizard skins:** Asset variant selection stored on user
- **Guild cosmetics:** Emblem/banner fields on guild table
- **Status effects:** Premium buff/curse names in copy system
- All cosmetic, no gameplay impact

### Boring Mode
Copy system enables this with zero architecture changes:
- Add `en-plain.ts` with same keys, standard language
- User preference stored on user record
- `useCopy()` hook reads preference, returns correct string file

### Map Customization
- Current: Google Maps via react-native-maps (functional)
- Future: Mapbox with custom pixel-art tile set (on-brand)
- Switch is isolated to map component, no architecture impact

---

## v1 Scope Summary

### In Scope
- [ ] Convex backend with full schema
- [ ] Convex Auth with phone/SMS OTP
- [ ] Onboarding flow (wizard-guided, 4 steps)
- [ ] Procedural name generation (unlimited reroll)
- [ ] Gym database (CBJ seed data)
- [ ] Gym favoriting + search
- [ ] Create Raid (full flow + quick raid one-tap)
- [ ] Create Quest (post to Quest Board)
- [ ] Quest Board (browse by favorited gyms, grade filter)
- [ ] Session detail (party list, check-in message, live sends)
- [ ] Invite to session (individuals + guilds)
- [ ] Anyone-can-invite within session
- [ ] Push notifications (Expo): invites, reminders, joins, desertions
- [ ] Session lifecycle (open → active → completed/dissolved)
- [ ] Party leader transfer + auto-dissolve
- [ ] Connections (add by phone, quest match)
- [ ] Guilds (create, manage, set default for quick raid)
- [ ] Nicknames (user-local)
- [ ] Send logging (live during session + post-session)
- [ ] XP system (grade-relative, ledger-based)
- [ ] Levels + status effects (buffs on breakthrough, debuffs on no-show)
- [ ] Honor-system no-show detection (Quest sessions only)
- [ ] SMS invites via Twilio
- [ ] Universal links (Convex HTTP actions)
- [ ] Session web page (read-only, no app required)
- [ ] Character screen (stats, sends, grade history)
- [ ] Centralized copy system
- [ ] EAS internal distribution

### Explicitly Out of Scope (v1)
- App Store / Play Store public launch
- Outdoor climbing support
- Competition/scorecard integration
- Home screen widgets
- Boring mode (plain language toggle)
- DLC / monetization
- Gym admin portal
- Map view (list-based gym selection is sufficient)
- Social feed / activity feed
- In-app messaging (beyond session check-in messages)
- User blocking
- Account deletion flow
- Analytics / telemetry

### Open Questions Remaining
1. **XP formula tuning** — exact values need playtesting with real sessions
2. **Status effect duration** — how long do blessings/curses last? Start with 7 days and tune.
3. **Party XP trigger** — when exactly does party bonus apply? Simplest: any send logged during a session with 2+ people.
4. **Wizard name** — the mascot needs a name
5. **Session check-in message** — single message field (not a chat). Confirmed.
6. **Connection removal edge cases** — removed connections can still appear in shared sessions via others' invites. No blocking in v1.
7. **Capacity for Quest Board quests** — creator-set in 3-7 range. Soft cap (can overflow slightly).

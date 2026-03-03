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
│   ├── progression.ts       # XP, levels, status effects, route logging, events
│   ├── inventory.ts         # Item management (use, trade)
│   ├── gyms.ts              # Gym database queries
│   ├── notifications.ts     # Push notification actions
│   ├── sms.ts               # Twilio SMS actions
│   ├── http.ts              # HTTP actions (universal links, web pages)
│   └── crons.ts             # Scheduled jobs (session lifecycle, curse expiry, boss/hero recompute)
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
│   │   └── calculator.ts    # Universal absolute-difficulty XP formula
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

### Tables

**users** — Player identity and cached progression stats. Extends Convex Auth with app-specific fields including avatar defaults, hero class, volume PRs, and pending invite tracking.

**gyms** — Climbing gym directory seeded from CBJ data. Supports search and geo-based lookup.

**gymGradeSystems** — Gym-specific grading circuits (e.g., color systems). Standard systems (YDS, V Scale, Font, French) are handled in code; this table stores gym-custom grades with V-grade range mappings for XP calculation.

**routes** — Identified route entities for QR/NFC scanning (v1+). Not populated in v0 (manual logging has no route identity). Includes cached community difficulty stats and boss designation.

**sessions** — Raids and Quests. Polymorphic table with `type` discriminator. Includes `shortCode` for universal link routing.

**sessionMembers** — Per-user session participation. Tracks invite/attendance status and stores an `avatarSnapshot` at session time for identification.

**connections** — Directional friend connections with user-local nicknames. Sources: phone, quest match, invite link.

**guilds / guildMembers** — Named groups for quick raid invites.

**sends** — Every climb logged (sends and attempts). Supports multiple grading systems (yds, v_scale, font, french, gym_color). Includes optional `routeId` (null in v0, links to route entities in v1+) and subjective `difficultyRating`.

**xpLedger** — Immutable ledger for all XP changes. Sources include send, attempt, party_bonus, grade_breakthrough, boss_defeat, volume_pr, achievement, and adjustment. `users.totalXp` is a cached sum.

**events** — Significant accomplishments computed from sends/sessions (1-3 per session). Flexible `type` string (grade_breakthrough, volume_pr, boss_defeat, level_up, tape_earned, etc.). Drives achievement detection, hero class computation, and the "recent accomplishments" timeline.

**inventoryItems** — Per-item tracking with provenance. Each item is an individual row (not quantity counters) enabling trading, gifting, and item history. Climbing-themed: tape, chalk, carabiners, brushes, etc.

**achievements** — Hand-designed accomplishments earned from events. Each unlocks inventory items and/or avatar cosmetics.

**avatarGymOverrides** — Per-gym avatar appearance settings (e.g., harness at rope gym, no harness at bouldering gym).

**questMatches** — Post-session "climb again?" mutual matching for Quest Board sessions.

**pendingInvites** — Phone-number invites for users who don't have accounts yet. Resolved on signup.

### Full Schema

See `convex/schema.ts` for the authoritative schema definition.

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

**Universal XP (absolute difficulty):** XP is tied to absolute grade difficulty, same for everyone. A V6 gives the same XP whether you're a beginner or expert. Warmups become naturally insignificant at high levels — emergent property, not an explicit penalty. Avoids "your V4 was worth less because you're strong" unfairness.

**Events as narrative layer:** Events are separate from sends (raw climb data) and xpLedger (XP accounting). Sends are high-volume granular data; events are low-volume celebrations. Adding new event types is just a string addition — no schema migration, no sends table pollution.

**Per-item inventory:** Individual rows per item (not quantity counters) because each item has provenance — which event/achievement granted it, when it was used, who it was traded to. Trading is just updating `userId` + status. More rows but each is tiny, and the flexibility is worth it.

**Avatar session/profile split:** Session view shows practical clothing colors only (for identification at the gym). Profile view adds fantasy cosmetics (glowing shoes, wolf companion, aura). A crown in session view could be mistaken for a real item, so cosmetics are excluded from session context.

**Forward-compatible route logging:** v0 logs climbs without route identity (`routeId: null`). When QR/NFC arrives in v1, the same sends table gains route links. Existing data can be retroactively linked if routes are identified.

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

### Progression & Route Logging

```
Convex Mutations:
├── progression.logClimb(sessionId?, gymId, grade, gradeSystem, type, difficultyRating?, routeId?)
│   → Replaces logSend — handles both sends and attempts
│   → Calculates XP based on absolute grade difficulty (universal, not personal)
│   → Creates sends row + xpLedger entry
│   → Updates user.totalXp cache
│   → Fires events inline:
│     → Checks for grade breakthrough → fires event + applies buff status
│     → Checks for volume PR at this grade → fires event
│     → Checks for boss defeat (v1+, requires routeId) → fires event
│     → Checks for level-up → fires event
│   → If in session with others → applies party bonus
│   → If attempt at/near max grade → grants tape item
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

### Achievements & Hero Classes

```
Convex Mutations/Queries:
├── progression.checkAchievements(userId, sessionId?)
│   → Scans recent events after each session
│   → Awards achievements + grants inventory items / avatar cosmetics
│   → ~15-20 hand-designed achievements in v0
│
├── progression.recomputeHeroClass(userId)
│   → Periodic recomputation from event patterns (cron or post-session)
│   → Classes: grinder, sender, projector, explorer, rally_captain
│   → Requires minimum data threshold before assigning
│   → Hysteresis: sustained pattern change required to flip classes
│
├── inventory.use(itemId)
│   → Marks item as used, applies effect
│
└── inventory.myItems(userId)
    → Returns held items grouped by type
```

### Avatar

```
Convex Mutations:
├── users.updateAvatarDefaults(avatarFields)
│   → Updates user.avatarDefaults
│
└── users.updateAvatarGymOverride(gymId, partialAvatarFields)
    → Upserts avatarGymOverrides for this user+gym
```

### XP Calculation

```typescript
// lib/xp/calculator.ts
//
// XP is tied to absolute difficulty — same for everyone.
// Based on Drummond & Popinga (2021): each V-grade step ≈ 3.17x
// increase in objective difficulty.
//
// V-Scale XP:
//   VB       10
//   V0       32
//   V1      101
//   V2      319
//   V3    1,012
//   V4    3,207
//   V5   10,167
//   V6   32,228
//   V7  102,163
//   V8  323,857
//   V9  1,026,607
//
// YDS (3.17x per full grade, ⁴√3.17 ≈ 1.33x per letter subdivision):
//   5.6       10
//   5.7       32
//   5.8      101
//   5.9      319
//   5.10a  1,012
//   5.10b  1,347
//   5.10c  1,793
//   5.10d  2,387
//   5.11a  3,207
//   5.11b  4,269
//   5.11c  5,683
//   5.11d  7,564
//   5.12a 10,167
//
// Gym color grades: XP uses the midpoint V-grade mapping from gymGradeSystems.
//   e.g., BP Purple (V2-V4, midpoint V3) → 1,012 XP
//
// Leveling: 2x cumulative XP per level (~20+ meaningful levels, tunable).
//   Level 1 = 0 XP, Level 2 = 10, Level 3 = 20, Level 4 = 40, ...
//   A V4 climber reaches ~level 11 in their first session.
//
// Attempts: XP treatment TBD (open question — ~25% of send XP mentioned but not confirmed).
// Party bonus: +15% XP when in a session with others.
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
├── Every 1 hr:   recomputeBossDesignations()
│   → Recency-weighted difficulty ratings per gym per grade
│   → Updates routes.difficultyStats.isBoss flag
│   → Requires minimum rating threshold before crowning a boss
│
├── Every 6 hrs:  recomputeHeroClasses()
│   → Scans recent events for active users
│   → Applies hysteresis (sustained pattern change required)
│   → Updates users.heroClass
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
- [ ] Onboarding flow (wizard-guided, 4 steps + calibration)
- [ ] Procedural name generation (unlimited reroll)
- [ ] Gym database (CBJ seed data)
- [ ] Gym favoriting + search
- [ ] Gym grade systems (color circuits via support submission)
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
- [ ] Route logging with difficulty rating (manual, v0 — no route identity)
- [ ] XP system (universal absolute difficulty, ledger-based)
- [ ] Levels + status effects (buffs on breakthrough, debuffs on no-show)
- [ ] Events system (grade breakthrough, volume PR, level up, tape earned)
- [ ] Inventory system (tape from attempts, trophy items from achievements)
- [ ] Achievements (hand-designed, ~15-20)
- [ ] Avatar appearance picker (customizable pixel art, per-gym overrides)
- [ ] Honor-system no-show detection (Quest sessions only)
- [ ] SMS invites via Twilio
- [ ] Universal links (Convex HTTP actions)
- [ ] Session web page (read-only, no app required)
- [ ] Character screen (stats, sends, grade history, hero class, inventory, achievements)
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
- QR/NFC route scanning (requires gym partnerships, v1+)
- Boss system (requires route identity, v1+)
- Hero classes (auto-detected, needs data first — v1+)
- Item trading/gifting
- Data-driven achievements

### Open Questions Remaining
1. **Attempt XP** — should attempts give XP? If so, what fraction? (~25% mentioned but not confirmed)
2. **Status effect duration** — how long do blessings/curses last? Start with 7 days and tune.
3. **Party XP trigger** — when exactly does party bonus apply? Simplest: any send logged during a session with 2+ people.
4. **Wizard name** — the mascot needs a name
5. **Level cap** — infinite levels that get exponentially harder, or a cap?
6. **Connection removal edge cases** — removed connections can still appear in shared sessions via others' invites. No blocking in v1.
7. **Boss reward design** — extra XP? Special item? Achievement? (for v1+ when route identity exists)
8. **Hero class thresholds** — exact behavioral thresholds for class detection (needs real data)
9. **Avatar pixel art resolution** — 16x16, 24x24, or 32x32?
10. **Unsupported grading systems** — how to handle users at launch who climb in systems we don't support

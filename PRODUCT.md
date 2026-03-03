# Belay Quest — Product Plan

**Domain:** belay.quest
**Aesthetic:** Pixel art, retro RPG vibes
**Platform:** React Native (iOS primary, Android supported)
**Tagline concept:** Find your climbing party.

---

## Vision

A lightweight, intent-based coordination app for rock climbers. Not a social network. Not a location tracker. Not a dating app. Closer to a walkie-talkie than Instagram.

The core interaction: **"I'm going climbing. Who's in?"**

### Design Principles

- **Intent-forward, not presence-forward.** You share a plan ("going to [gym] at [time]"), not your location.
- **Anonymous by default.** No demographics, no photos. Identity is a procedurally generated climbing name.
- **Activity-first, profile-second.** You join sessions, not people. Discovery happens through shared climbing, not browsing profiles.
- **No rejection signals.** The absence of connection is not a signal. Sessions end, nothing persists unless both parties act.
- **Anti-hookup by design.** No demographic info, no photos, no browsable profiles. Romantic connections may happen organically in person, but the app doesn't facilitate or suggest them.
- **Let failures surface.** No mock data, no fake activity. If nobody's climbing, the app is quiet. Honesty over engagement metrics.

---

## Identity System

### Generated Names
Every user gets a **persistent procedurally generated name** combining climbing/nature/absurd elements:
- "Crimson Gecko," "Chalk Phantom," "Boulder Otter," "Slab Wizard"
- Name style: `[Adjective] [Animal/Noun]` drawn from climbing + nature vocabulary
- This is your identity to strangers and new connections

### Nicknames
- Connections can set a **personal nickname** for anyone (e.g., their real name)
- Display: nickname shown prominently, generated name shown underneath
- The generated name is the universal identifier; nicknames are local to each viewer

### Profile Information (visible to others)
- Generated name
- **Level** (derived from XP — see Progression System)
- **Status effect** (current buff/debuff — see Progression System)
- Grade range (e.g., "V4-V6" or "5.10-5.11")
- Climbing style (bouldering, top rope, lead, all)
- Time climbing (e.g., "2 years") — accepted tradeoff that very long durations imply age

### What is deliberately excluded
- Photos
- Age, gender, or any demographic information
- Free-text bio (too gameable for signaling)
- Location or presence data

---

## Core Flows

### Flow 1: Broadcasting to Friends (Daily Driver)

1. Open the app, tap to create a new session
2. Pick a gym (from curated list of favorites), pick a rough time
3. Choose who to invite:
   - Select individuals from your connections list, OR
   - Select a saved group ("Tuesday Crew," "Weekend Warriors")
4. Invitees get a **push notification**: "[Name] is heading to [gym] around [time]"
5. They can tap "I'm in" or ignore
6. **Anyone in the session can invite additional people** — you don't own the guest list
7. Everyone in the session can see the full attendee list
8. Sessions are ephemeral — gone when they're over
9. If accepted, a **reminder push notification fires 45 minutes before** the session time

### Flow 2: Discovery (Meeting Strangers)

1. Post an **open session** at a gym + time, visible to anyone who has that gym in their favorites
2. Strangers opt into your session
3. You see their generated name, grade range, climbing style
4. Open sessions have a **capacity limit (3-7 people)** to keep them intimate and manageable
5. If a gym has many open sessions, they can be **sorted/filtered by grade range**
6. There's a **public check-in message** visible to all session members (e.g., "blue shirt, near the back wall") — public visibility keeps it clean and appropriate
7. You meet, you climb
8. After the session, both people get a quiet prompt: **"Climb with [Slab Wizard] again?"**
9. Mutual yes → they're added to each other's connection list under their generated name
10. No response or one-sided → nothing happens, no notification, no trace

### Flow 3: In-Person Connection (Viral Loop)

1. You meet someone at the gym IRL and want to connect
2. Enter their phone number in the app
3. **If they have an account:** automatically links and adds them to your connections
4. **If they don't have an account:** sends an SMS with a universal link to a **web page** showing the session (gym, time, who's going, spots remaining). The web page is a first-class experience — no app required to view. App required to join. This is the organic invite/viral mechanic.
5. Universal links (iOS) / App Links (Android) open the session directly in-app if installed
6. If someone is connected both via phone number AND via in-app discovery, **identities merge**

### Flow 4: Solo Climbing / Progression

1. During or after a session (solo or group), log what you climbed
2. Record sends (completed routes) and attempts (failed/projected routes)
3. Earn XP and receive **pixel-art party notifications** when you hit a harder grade
4. Progression feels like leveling up — leaning into the RPG/quest aesthetic
5. Group sessions generate **party XP bonus** for shared accomplishment
6. Potential future integration with **climbing competition scorecards** for event tracking

---

## Progression System

### XP & Leveling

XP is tied to **absolute difficulty** — same for everyone. A V6 gives the same XP whether you're a beginner or expert. Based on research (Drummond & Popinga 2021), each V-grade step represents a **3.17x increase** in objective difficulty. We use this directly for XP scaling.

**Why this works:**
- 1 route at your grade ≈ 3 routes one grade below (research-backed)
- Warmups are naturally insignificant — no explicit "you get less XP" rule needed
- A V8 climber doing V4 warmups: each V4 is ~1% of a V8. Warmups don't matter.

**First session for experienced climbers:** Everyone starts at level 1. When you log your first session, you'll level up rapidly through the early levels. Wizard explains: "Because you're more advanced, you'll level up quickly at first."

**Leveling:** 2x cumulative XP per level, giving ~20+ meaningful levels with lots of small wins. The 2x multiplier is a tuning knob that can be adjusted post-launch without schema changes.

### Status Effects

Status effects are visible on your profile and add personality:

**Positive (Blessings):**
- Granted when you **break your grade ceiling** (first send at a new max grade)
- Random positive status: "Blessed," "Enchanted," "Ascendant," "Luminous," "Embered," etc.
- Fades after a period of time (a few days? a week?)

**Negative (Debuffs):**
- Applied when you **no-show a session** you committed to
- Random negative status: "Poisoned," "Cursed," "Hexed," "Frozen," "Haunted," etc.
- Fades over time with consistent attendance at future sessions

**Party Bonus:**
- Small XP multiplier when climbing with others in a session
- Rewards the social behavior the app exists to encourage

---

## Route Logging & Boss System

### Phased Approach
- **v0 (launch):** Manual route logging — user selects grade, type, and gym. No route identity. Every logged climb includes optional difficulty rating (soft / on-grade / hard / very hard). Builds the habit and collects data.
- **v1:** QR stickers on route tags (belay.quest/r/{routeId}). Scanning pre-fills route data. First scan creates route entity.
- **v2:** NFC tags for faster interaction (works with gloves/chalk hands).

### Difficulty Ratings
Every logged climb can include a subjective difficulty rating relative to the stated grade. Aggregated ratings surface community consensus over time. Data is recency-weighted — older ratings decay naturally, handling gym route resets without manual flagging.

### Boss System (v1+, requires route identity)
- The boss is **per grade at a gym** — every climber at every level has a boss to chase
- Boss designation comes from community difficulty ratings: the route rated hardest at a given grade becomes the boss
- Defeating the boss (sending the hardest route at your grade) earns extra XP and a visual flair
- Boss computation uses recency-weighted sliding window, recomputed periodically

---

## Achievements & Items

### Achievements
Hand-designed for v0 (~15-20 achievements). Each unlocks both a permanent inventory trophy and an optional avatar cosmetic. Categories:
- **Climbing milestones:** First send at each grade, total sends milestones, grade breakthrough
- **Persistence:** Tape milestones, sent a route after N+ attempts
- **Boss slayer:** Defeated gym bosses across grades/gyms (v1+)
- **Social:** Hosted N raids, met N strangers, climbed at N gyms with same person
- **Consistency:** Streaks, session count milestones
- **Explorer:** Climbed at N gyms, climbed in N grading systems

### Climbing-Themed Inventory
Items are things climbers actually use — not generic RPG potions. Per-item tracking with provenance.

**Consumables:** Tape (earned from attempts at hard grades), chalk (earned from volume), liquid chalk (exceptional sessions).

**Trophy items from achievements:** Carabiner (first session), quickdraw (first lead), brush (boss defeated), belay device (hosted N raids), rope (streak milestone), crash pad (bouldering milestone), hangboard (consistency), glowing climbing shoes (grade breakthrough).

**Avatar cosmetics from achievements:** Crown/headband (boss), cape/chalk bag flair (streaks), glowing shoes (breakthrough), special harness color (social), aura effect (high-level milestones).

---

## Avatar System

### Customizable Pixel-Art Avatar
Every user has an avatar used for identification and RPG identity:
- **Session view:** Stripped-down clothing/hair colors only — what someone would see at the gym. No cosmetics. Used for identification ("look for the red shirt").
- **Profile view:** Full character with achievement cosmetics (wolf companion, glowing shoes, aura, etc.). Your RPG identity.

### Customizable Attributes
| Attribute | Options |
|-----------|---------|
| Hair/hat | Medium-length hair OR hat (two options, gender-neutral) |
| Hair/hat color | Color picker |
| Skin tone | 3 preset pixel tones |
| Glasses | Yes/no + frame color |
| Shirt color | Color picker |
| Pants/shorts | Toggle + color picker |
| Harness | Yes/no + color (boulderers might not wear one) |
| Shoe color | Color picker |

No gender selection, no body type options, no demographic signals. Focus is "what are you wearing today."

### Per-Gym Defaults
Avatar selections persist per gym (harness at rope gym, no harness at bouldering gym). First time at a gym inherits from your most recent defaults.

### Session Check-In
When a session goes active, the party leader gets a confirmation screen with their avatar (defaults from last session at this gym). Quick-tap adjustments, then confirm. Non-leaders can optionally update but aren't prompted.

---

## Hero Classes

Auto-detected behavioral archetypes, assigned from event patterns after sufficient data. Visible on profile as a title. No gameplay impact — purely flavor and identity. Can shift over time.

| Class | Signal | Vibe |
|-------|--------|------|
| **Grinder** | High session count, consistent attendance | Always at the gym. Doesn't skip weeks. |
| **Sender** | High success rate on hard routes, frequent flash sends | Goes for the top. When they try, they send. |
| **Projector** | Many attempts before sending, high tape count | Picks hard things and works them. Patient. |
| **Explorer** | Many gyms visited, variety in grades/styles | Climbs everywhere. Breadth over depth. |
| **Rally Captain** | Most raids hosted, most connections made | The social glue. Gets everyone together. |

Computed periodically with hysteresis (won't flip from session to session). Requires minimum data threshold before first assignment. v1+ feature — needs real data to set meaningful thresholds.

---

## Session Details

### Session Types
- **Raid** (friends/known connections) — invite-only, visible to invitees. "Raid at Movement 6pm."
- **Quest Board** (discovery) — posted to the Quest Board, visible to anyone with the gym favorited. Strangers join your party.

### Session Lifecycle
1. **Created** — creator picks gym, time, invites people or posts publicly
2. **Active** — people join, check in, climb, **log sends live** (so you don't forget)
3. **Completed** — session ends, post-session prompts fire (XP summary, "climb again?" for discovery, guild invite)
4. **Canceled/Abandoned** — see below

### Session Leadership
- The session creator is the **party leader** (responsible for being identifiable in discovery sessions)
- If the party leader cancels, a notification goes out: "Your party leader deserted!"
- Another member can **volunteer to take over** as party leader
- If no one volunteers, the session dissolves
- This applies to both party sessions and open sessions

### Cancellation & No-Shows
- Anyone can cancel their attendance at any time (no penalty for canceling in advance)
- No-show penalties **only apply to sessions you accepted** (not invitations you ignored)
- **Honor system with a grace period:** after a session's scheduled time passes, if you haven't checked in (logged a send or tapped "I was here"), you get a push notification: "Oh no! You're about to be cursed. Did you make it to [gym]?" with [I was there] / [I couldn't make it]
- If you confirm you weren't there (or don't respond): **random negative status effect** — "Poisoned," "Cursed," "Hexed," "Frozen," "Haunted," etc.
- Status effects are **publicly visible** on your profile, making them a funny social consequence
- Effects fade over time with consistent attendance at future sessions
- The humor takes the sting out while still creating accountability — especially important for Quest Board sessions where strangers committed based on your attendance
- **No-show penalties only apply to Quests (open sessions), not Raids (friend sessions)** — your friends can give you grief themselves

### Session Rules
- Anyone in the session can invite additional people
- The invite list is unique per session (no one is "always invited" — you choose each time)
- Full attendee list is visible to all session members
- Sessions are immutable in the sense that they can't be retroactively edited to exclude someone — new invites only go forward

---

## Home Screen / Navigation

### Primary View: Your Quests
- Sessions (Rallies and Quest Board quests) you've accepted or been invited to, sorted by time
- Most prominent: sessions you've accepted (your committed schedule)
- Then: pending invitations awaiting your response

### Secondary View: Quest Board (Discovery)
- Open quests at gyms you've favorited
- Grouped by gym
- Sorted/filtered by grade range if a gym has many
- Shows capacity (e.g., "3/5 spots filled")

### Third View: Party (Connections & Guilds)
- Your connection list (generated names + any nicknames you've set)
- **Guilds** — saved named groups for quick Raid invites ("Tuesday Crew," "Weekend Warriors")
- After a session, you can add new connections directly to a guild from the post-session prompt
- Manage connections (easy removal — no notification sent to the other person)

### Fourth View: Character
- Your pixel avatar, generated name, level, current status effect
- Stats: total sessions, routes logged, max grades, XP
- Recent sends with XP earned
- Grade history graph (progression over time)
- Settings, favorite gyms, edit profile

### Session Creation
- Prominent, fluid action to create a new Raid or post to the Quest Board
- Quick flow: gym → time → invite (individuals or guild) or post as quest

---

## Notifications

### v1 Notifications
| Trigger | Recipient | Content |
|---------|-----------|---------|
| Session created + invite | Invitees | "[Name] is heading to [gym] around [time]" |
| 45 min before session | Accepted attendees | Reminder for upcoming session |
| Party leader cancels | All session members | "Your party leader deserted! Volunteer to take over?" |
| Someone joins your open session | Session creator | "[Slab Wizard] joined your session at [gym]" |
| Post-session mutual match | Both parties | "Climb with [name] again?" (discovery sessions only) |
| Grade milestone | The user | Pixel-art celebration for leveling up |

### Future Consideration
- Home screen widget showing "friends climbing today" — noted for later, not v1

---

## Gym Data

### Seed Data
- [Climbing Business Journal](https://climbingbusinessjournal.com/directory/map/gym-map-data-csv/) maintains a CSV of 3,100+ climbing gyms (US and Canada), actively updated, available for private use
- Supplementary sources: [99Boulders](https://www.99boulders.com/climbing-gyms), [Mountain Project](https://www.mountainproject.com/gyms)

### User Interaction
- Users **favorite** gyms they climb at — this scopes what open sessions they see
- User submissions can supplement the database over time (suggest a missing gym)

---

## Branding & Aesthetic

### Visual Style
- **Pixel art / retro RPG** — 8-bit-ish character avatars, chunky UI elements
- Adventure/quest metaphor: connections are your "party," saved groups are "guilds," sessions are "quests"
- Warm, playful, irreverent — not corporate, not Strava-sleek
- Hand-drawn or illustrated supplementary elements (trail map meets field journal)

### Tone
- Playful but not childish
- Climbing slang welcome (beta, send, proj, flash, whip)
- The anonymity should feel exciting and fun, not shady
- RPG language where it fits naturally (party, quest, XP, level up)

### The Wizard (Mascot / Guide)
- A pixel-art wizard character who appears at key moments — **not** persistent like Clippy
- Provides contextual guidance and flavor text during onboarding and first-time interactions
- Tone: helpful, slightly irreverent, in-character as a fantasy wizard who's really into climbing
- Example moments:
  - First Raid: "A raid! Assemble your party and pick a dungeon — er, gym."
  - First Quest join: "A stranger approaches! They'll see your check-in message when they arrive."
  - First curse: "The spirits have cursed you for abandoning your quest. Show up next time to lift the curse."
  - First grade breakthrough: "By the ancient chalk... you've ascended! A blessing upon you."
  - No-show warning: "Oh no! Dark magic stirs... did you make it to your quest?"
- Name TBD — should feel like a climbing-world wizard, not generic fantasy

### Name Generation Vocabulary
Draw from climbing + nature + slightly absurd:
- Adjectives: Crimson, Chalk, Granite, Mossy, Feral, Rusty, Alpine, Dusty, Solar, Midnight
- Nouns: Gecko, Phantom, Otter, Wizard, Falcon, Badger, Lynx, Sphinx, Yeti, Mantis

---

## Platform & Web

### React Native + React Native Web
- Primary platform: **iOS and Android** via React Native
- Web version via **React Native Web** — same codebase, adapted navigation
- The web version is a full experience, not just a marketing site

### Web-Specific Considerations
- **Session landing pages** (universal links) are web-first — viewable by anyone, no app required
- Web navigation differs from mobile: likely a sidebar or top nav instead of bottom tabs
- Homepage on web will have additional content (marketing, app store links, feature overview)
- Core app functionality (Quests, Quest Board, Party, Character) available on web
- Mobile app is the primary experience; web is secondary but functional

---

## Competitive Landscape Summary

No existing app has solved this problem. Key failures of competitors:
- **Cold-start / dead app problem** — every dedicated climbing partner app (RockBase, onBelay, ClimbTime) failed to achieve critical mass
- **Profile-forward discovery** leads to hookup-app dynamics or empty browsing
- **Notification failures** kill utility (RockBase)
- **Over-scoping** (gym + outdoor + tracking + social) dilutes the core value

What climbers actually use today: texting friends, Facebook groups, walking up to strangers at the gym. Belay Quest should feel like a better version of the group text, with a bonus discovery layer.

### Key Design Patterns Borrowed
| Source | Pattern | How We Use It |
|--------|---------|---------------|
| GoodRec | Session-forward, not profile-forward | Discovery through sessions, not browsing people |
| Peloton | "Friend started activity" notification | Push when a friend posts a session |
| Zenly/Bump | Ambient friend awareness | Home screen showing upcoming friend sessions |
| "Free" (2015) | Green-dot availability broadcast | The core "I'm going climbing" action |
| ClimbTime | Current vs. future partner listing | Open sessions with time-based relevance |

---

## Open Questions

1. **Competition integration** — Climbing comps use scorecards. Research needed on formats (USAC, gym-specific). Future feature.
2. **Party XP trigger** — when exactly does party bonus apply? Simplest: any send logged during a session with 2+ people.
3. **Connection removal edge cases** — removed connections can still appear in shared sessions. No blocking in v1.
4. **Status effect duration** — How long do blessings/curses last? Start with 7 days and tune.
5. **Wizard name and personality** — The wizard mascot needs a name. Personality details TBD.
6. **Widget / ambient awareness** — Future feature. Home screen widget showing "friends climbing today."
7. **Outdoor climbing support** — Explicitly out of scope for v1. Revisit based on community demand.
8. **Attempt XP** — should attempts give XP? If so, what fraction of send XP? (~25% mentioned but not confirmed)
9. **Level cap** — infinite levels that get exponentially harder, or a hard cap?
10. **Boss reward design** — extra XP? Special item? Achievement? (v1+ when route identity exists)
11. **Hero class thresholds** — exact behavioral thresholds for detection (needs real user data)
12. **Hero class reveal** — revealed with fanfare, or quietly appears?
13. **Avatar pixel art resolution** — 16x16, 24x24, or 32x32?
14. **Auto-generated avatar** — do users who never customize get an avatar from name hash?
15. **Full achievement list** — needs a design pass for all ~15-20 v0 achievements

### Resolved (previously open)
- ~~**Name reroll limits**~~ — Unlimited rerolls.
- ~~**Session check-in message**~~ — Single message field, not a chat.
- ~~**Capacity limits**~~ — Creator-set in 3-7 range. Soft cap.
- ~~**XP formula**~~ — Universal absolute difficulty, 3.17x per grade (research-backed).
- ~~**Profile: "time climbing"**~~ — Range picker ("1-3 years").

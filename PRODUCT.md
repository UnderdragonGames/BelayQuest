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

XP mirrors real climbing effort — it rewards pushing your limits, not grinding easy routes.

**XP curve based on personal grade relativity:**
- Routes **at or near your limit** → high XP (this is where growth happens)
- Routes **1-2 grades below your max** → moderate XP (solid training)
- Routes **3+ grades below your max** → minimal/no XP (warmups don't count)
- Routes **above your previous max** → massive XP + grade breakthrough event

The system tracks your current max grade and calculates XP relative to that. As you improve, the same grades yield less XP — exactly like real climbing where a 5.10 stops feeling hard once you're projecting 5.12.

**Level** is derived from cumulative XP and is visible on your profile. Level should feel meaningful but not be the point — it's a fun side effect of climbing, not the reason you climb.

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

## Session Details

### Session Types
- **Rally** (friends/known connections) — invite-only, visible to invitees. "Rally at Movement 6pm."
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
- Anyone can cancel their attendance at any time
- **No-shows receive a random negative status effect** — RPG-flavored debuffs like "Poisoned," "Cursed," "Hexed," "Frozen," etc.
- Status effects are **publicly visible** on your profile, making them a funny social consequence
- Effects fade over time with consistent attendance
- The humor takes the sting out while still creating accountability — especially important for Quest Board sessions where strangers committed based on your attendance

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
- **Guilds** — saved named groups for quick Rally invites ("Tuesday Crew," "Weekend Warriors")
- After a session, you can add new connections directly to a guild from the post-session prompt
- Manage connections (easy removal — no notification sent to the other person)

### Fourth View: Character
- Your pixel avatar, generated name, level, current status effect
- Stats: total sessions, routes logged, max grades, XP
- Recent sends with XP earned
- Grade history graph (progression over time)
- Settings, favorite gyms, edit profile

### Session Creation
- Prominent, fluid action to create a new Rally or post to the Quest Board
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

### Name Generation Vocabulary
Draw from climbing + nature + slightly absurd:
- Adjectives: Crimson, Chalk, Granite, Mossy, Feral, Rusty, Alpine, Dusty, Solar, Midnight
- Nouns: Gecko, Phantom, Otter, Wizard, Falcon, Badger, Lynx, Sphinx, Yeti, Mantis

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

1. **Competition integration** — Climbing comps use scorecards. Is there a way to import/interface with comp scoring? Research needed on formats (USAC, gym-specific). Future feature.
2. **Party XP mechanics** — What triggers party XP? Completing a session together? Both sending the same route? Needs design work to feel earned, not automatic.
3. **Capacity limits for Quest Board quests** — Creator-set (3-7 range) or fixed? Should it vary by session type (bouldering sessions can be bigger than rope climbing since you don't need a dedicated partner)?
4. **Profile: "time climbing" field** — Exact format? Free text ("2 years"), range picker ("1-3 years"), or derived from app usage?
5. **Connection removal edge cases** — Easy and silent (no notification). But what if someone you removed joins a session you're in via another person's invite? Do you see them? Can you block?
6. **Session check-in message** — Is this a single message field, or a mini-chat within the session? Single message is simpler and less likely to become a messaging app.
7. **Status effect duration** — How long do blessings last? How many sessions to clear a debuff? Needs tuning.
8. **XP formula specifics** — Exact XP values per grade delta. How many levels? What do levels unlock (if anything)?
9. **No-show detection** — How do we know someone no-showed vs. just didn't check in? Does someone have to report it, or is it automatic (e.g., session ended and you never logged a send or tapped "I was there")?
10. **Session web page scope** — How much of the app experience is on the web? Just the invite landing page? Or can you view the Quest Board on web too?
11. **Widget / ambient awareness** — Future feature. Home screen widget showing "friends climbing today."
12. **Outdoor climbing support** — Explicitly out of scope for v1. Revisit based on community demand.

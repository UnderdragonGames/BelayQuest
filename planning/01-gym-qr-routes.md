# Feature: Route Logging, QR/NFC Routes & Boss System

**Status:** Refined

## Phased Rollout

### v0: Manual Route Logging (MVP)
- User logs a climb by selecting grade, type (boulder/rope), and gym (known from session context or selected manually)
- Routes are **not identified entities** — just personal log entries ("I climbed a V5 at this gym")
- User can optionally rate subjective difficulty relative to grade: soft / on-grade / hard / very hard
- "Very hard" or equivalent could trigger extra XP or a visual callout — signals you're pushing limits
- **Architecture must be forward-compatible:** log entries should have an optional `routeId` field (null in v0) so they can be retroactively linked to identified routes when QR/NFC arrives
- The UI for difficulty rating exists from day one, building the habit and collecting data before routes are identifiable

### v1: QR Stickers (Gym Partnership)
- URL-based QR codes (belay.quest/r/{routeId}) placed on route tags
- Scanning opens the app (deep link) and pre-fills route data: grade, type, gym, route identity
- Defaults to logging as "sent" — user can change to attempt, rate difficulty
- First scan of a new QR creates the route entity in the system
- Requires gym partnership or permission to place stickers

### v2: NFC Tags
- Same URL-based system, NFC tap instead of camera scan
- Faster interaction, works with gloves/chalk hands
- Embedded in durable stickers on route tags or wall

### Future: Wearable/Clip-On Device
- A small device clipped to harness or chalk bag
- Key insight: **belayers often don't have their phones on them** — a dedicated device for tracking climbs from something they *do* have (harness, chalk bag) is a genuine value add, not just a novelty
- Could be NFC reader, QR scanner, or simple button-based logger that syncs to the app later
- This is a significant hardware investment but solves a real friction point
- Explore when app has traction and route identity system is mature

## Subjective Difficulty Rating

- Every logged climb (send or attempt) can include a difficulty rating relative to the stated grade
- Scale: **soft / on-grade / hard / very hard** (or similar)
- This is community feedback on route setting — "this 5.11 is stiff" / "this V4 is soft"
- Aggregated ratings surface consensus over time
- Data is recency-weighted (see Boss System below)

## Boss System

### Per-Grade Bosses
- The boss is **per grade at a gym**, not per type. There's a Boss 5.9, a Boss 5.10a, a Boss V4, etc.
- This means every climber at every level has a boss to chase — not just the strongest climbers
- Boss designation is determined by **community difficulty ratings**: the route at a given grade that the most people rate as hardest becomes the boss
- Mirrors the real feeling: when you're at the edge of your grade and you find the hardest one in the gym, that's significant

### Two Significant Moments
The system should recognize and reward both:
1. **Defeating the boss** — sending the hardest route at your current grade (extra XP, visual flair)
2. **Grade breakthrough** — sending anything above your previous max (already in the XP system as breakthrough bonus)

### Recency-Weighted Data
- Difficulty ratings use a **recency-weighted sliding window**, not a hard cutoff
- More recent ratings count more heavily than older ones
- After ~1 month with no new data, a route's influence on boss designation fades naturally
- This handles gym route resets gracefully: when a route is taken down and stops getting logged, its data decays. When a new route goes up and starts getting ratings, it enters the pool.
- No one needs to manually flag route resets

### Boss Designation Requirements
- Need sufficient data before declaring a boss — minimum threshold of ratings at a grade before a boss is crowned
- Below threshold: no boss at that grade yet (avoids noise from 1-2 ratings)

## Data Architecture Notes

### Forward-Compatible Schema
The `sends` table currently has: userId, sessionId, gymId, grade, gradeSystem, type, xpAwarded, climbedAt

For this feature, we'll need to add (all optional in v0):
- `routeId` — links to an identified route entity (null until QR/NFC)
- `difficultyRating` — subjective rating (soft/on-grade/hard/very_hard)

New table needed (v1+):
- `routes` — identified route entities with gym, grade, type, location description, QR/NFC identifier, creation date
- Route-level aggregated difficulty stats (computed, cached)

### Boss Computation
- Computed periodically (cron or on-demand) from recency-weighted difficulty ratings
- Cached per gym per grade — "Boss V4 at Movement Austin = Route X"
- Recomputed when new ratings come in or on a schedule

## Open Questions (Resolved)
- ~~Gym partnership vs user-generated~~ → Phased: v0 manual, v1 QR (gym partnership), v2 NFC
- ~~QR encoding~~ → URL-based (belay.quest/r/{routeId})
- ~~Boss designation~~ → Per-grade, community-rated, recency-weighted
- ~~Route lifecycle~~ → Recency-weighted decay, no manual flagging needed
- ~~Route identity in v0~~ → No identity, but schema is forward-compatible

## Remaining Open Questions
- What does the boss reward look like? Extra XP amount? Special item? Achievement?
- Visual design for boss routes in the UI — how do you know a route is the boss before you climb it?
- Minimum data threshold for boss designation — how many ratings before a boss is crowned?
- v0 UI design for manual route logging — how streamlined can we make it during a session?
- How does the clip-on device sync? Bluetooth to phone? WiFi direct? Batch upload later?

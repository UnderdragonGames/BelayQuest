# Feature: Attempt Tracking, Revive Potions & Events System

**Status:** Refined

## Core Principle

"You can't out-climb your social problems." — Curses come from social failures (no-shows) and require social solutions (showing up). Climbing rewards are separate and should never bypass social accountability.

## v0: Attempt Tracking & Revive Potions

### Attempts = Sends (Same Entity)
- Attempts and sends live in the same `sends` table, distinguished by `type: "send" | "attempt"`
- No separate data type — an attempt is just an incomplete send

### Revive Potions
- Logging an attempt at a difficult grade (at/near your max) earns a Revive Potion
- Revive Potions are **display items** — a badge of honor showing you push your limits
- Accumulated count visible on your profile (publicly visible if someone taps your avatar)
- No functional/gameplay use in v0 — can't clear curses, can't buy anything
- Future: may evolve into super potions, feed into badge system, grant special tags

### The "Finally Sent It" Moment
- When you send something at or above your max after grinding attempts, the system recognizes the effort
- Triggers: wizard comment, extra XP, visual celebration (more dramatic than a normal send)
- In v1+ (with route identity): "Sent V6 after 8 attempts!" becomes trackable per-route

## Volume PRs

### Concept
- Track the most routes you've climbed at each grade in a single session
- When you break your record: "New PR: 6 V5s in one session!"
- This is a **computed event** derived from sends data, not a new entity

### Implementation
- Cached stats on user record: `volumePRs: { [grade]: number }`
- On each send logged, check if count at that grade in current session exceeds cached PR
- If exceeded: update cache, fire event

## Events System

### Architecture (Option B: Separate from Sends)
- `sends` table: raw climb log (high volume, 10-20 per session)
- `events` table: significant moments only (low volume, 1-3 per session)
- Events are **computed in real-time** during send-logging mutations
- Each event records what happened, with enough metadata to display a rich timeline

### Events Table Schema
```
events: {
  userId
  type: "grade_breakthrough" | "volume_pr" | "boss_defeat" | "revive_potion" | "level_up" | ...
  metadata: { grade?, attemptCount?, previousRecord?, newRecord?, ... }
  xpAwarded: number (0 if no XP for this event type)
  sessionId?: (what session triggered it, if any)
  sendId?: (what specific climb triggered it, if any)
  createdAt
}
```

### Why Separate from Sends
- Sends are raw data — high volume, granular, the source of truth for climb history
- Events are celebrations — low volume, meaningful, the source of truth for accomplishments
- Events can change on a moment's notice: new types added, seasonal/temporary events, promotional events — all without polluting the sends table
- Adding a new event type = adding a string to the union type, no schema migration
- "Recent accomplishments" screen = simple query on events table

### Event Types (v0)
| Event Type | Trigger | XP? | Visual |
|------------|---------|-----|--------|
| `grade_breakthrough` | First send at a new max grade | Yes (breakthrough bonus) | Major celebration, wizard comment, blessing applied |
| `volume_pr` | Most climbs at a grade in a session | Maybe small bonus | Notification, wizard comment |
| `revive_potion` | Attempt at/near max grade | No | Potion icon, subtle fanfare |
| `level_up` | XP threshold crossed | N/A (consequence of XP) | Major celebration, wizard comment |

### Future Event Types (v1+)
| Event Type | Trigger |
|------------|---------|
| `boss_defeat` | Send the boss route at a grade (requires route identity) |
| `project_complete` | Send a route after N tracked attempts (requires route identity) |
| `streak` | Climbed N days/weeks in a row |
| `explorer` | Climbed at N different gyms |
| Seasonal/promotional | Flexible — any new type value |

### Relationship to xpLedger
- xpLedger remains the **accounting ledger** for XP — every XP transaction, positive or negative
- Events are the **narrative layer** — what happened and why it matters
- Some events produce xpLedger entries, some don't (e.g., revive potion = no XP)
- They reference each other but serve different purposes: ledger for math, events for display

## Badges (v2 — Deferred)

### Why Deferred
- Badge thresholds should be based on **actual user data**, not theory
- After v0 launches and we see real climbing patterns, we can set meaningful thresholds
- The events table provides the data foundation — badges are computed from event history

### Tentative Direction
- Some events graduate to badges based on accumulation thresholds
- Badges grant **permanent small XP multiplier** (balanced by levels getting harder to gain)
- Badges visible on profile with items/cosmetics
- Thresholds TBD from real data

## Profile Visibility
- Revive Potions, events, and future badges are **publicly visible** when someone taps your avatar
- Not prominently advertised, but fully visible on inspection
- No reason to hide failure — it shows you're pushing yourself
- Seeing unfamiliar badges on others creates curiosity and goals ("What's that badge? Oh, I could do that!")

## Inventory System

### Per-Item Table (not quantity counters)
Each item is an individual row with provenance — where it came from, where it went. Enables trading, gifting, healing other players without migration.

```
inventoryItems: {
  userId          // current owner
  itemType: "revive_potion" | "super_potion" | ...
  sourceEventId?  // what event granted this item
  status: "held" | "used" | "traded"
  acquiredAt
  usedAt?
  tradedToUserId? // if traded/gifted, who received it
}
```

### Why Per-Item, Not Quantity Counters
- Each item has history: earned from what event, used when, traded to whom
- Trading/gifting is just updating `userId` + `tradedToUserId` + `status`
- "Heal another player" = use a potion targeting someone, recorded on the item
- Quantity is always computable: count where userId = X and itemType = Y and status = "held"
- More rows, but each row is tiny and the flexibility is worth it

### Item Types (v0)
| Item | Source | Use |
|------|--------|-----|
| `revive_potion` | Attempt at/near max grade | Display only (v0), future mechanics TBD |

### Future Item Mechanics
- Trading items between players
- Using items on other players (heal a curse? buff a friend?)
- Items evolving (3 revive potions → 1 super potion?)
- Items as badge ingredients
- Seasonal/event-specific items

## Data Architecture Summary

| Table | Purpose | Volume |
|-------|---------|--------|
| `sends` | Every climb logged (sends + attempts) | High (10-20/session) |
| `events` | Significant moments / accomplishments | Low (1-3/session) |
| `xpLedger` | XP accounting (debits + credits) | Medium (1 per send + bonuses) |
| `inventoryItems` | Individual items with provenance | Low-medium (1 per item earned) |
| `achievements` (v2) | Persistent badges / unlocks | Very low (earned over weeks/months) |
| `users` (cached stats) | Volume PRs, potion count, etc. | Updated per session |

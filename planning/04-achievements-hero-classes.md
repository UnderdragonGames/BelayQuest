# Feature: Achievements, Climbing Gear Items & Hero Classes

**Status:** Refined

## Achievements

### Design Approach
- **Hand-designed** for v0 — curated list, each one feels intentional
- Hybrid (data-driven discoveries) considered for later, but may not be needed
- Achievements manifest as **inventory items AND avatar cosmetics** — not just a checklist

### Achievement Categories

**Climbing Milestones:**
- First send at each grade (V0, V1, V2... / 5.8, 5.9, 5.10a...)
- Total sends milestones (10, 50, 100, 500)
- Grade breakthrough (first time exceeding your previous max)

**Persistence:**
- Revive potion milestones (earned N potions total)
- Sent a route after N+ attempts (ties to feature #2)

**Boss Slayer:**
- Defeated a gym boss (ties to feature #1)
- Defeated bosses across N grades
- Defeated bosses at N different gyms

**Social:**
- Hosted N raids
- Met N strangers via Quest Board
- Climbed at N different gyms with the same person

**Consistency:**
- Streak: climbed N days/weeks in a row
- Session count milestones (10, 50, 100 sessions)

**Explorer:**
- Climbed at N different gyms
- Climbed in N different grading systems

### Achievement Display
- Each achievement unlocks both:
  1. **Permanent inventory trophy** — visible in your character inventory
  2. **Optional avatar cosmetic** — gear/accessory for your pixel avatar
- Visible to others when they tap your avatar
- Unfamiliar achievements on others create curiosity and goals

## Climbing-Themed Inventory Items

### Philosophy
Items should be things climbers actually use and care about — not generic RPG potions and swords.

### Item Types

**Consumables / Earned Items:**
| Item | How Earned | Display |
|------|-----------|---------|
| Tape | Revive potion replacement — earned from attempts at hard grades | Roll of climbing tape |
| Chalk | Earned from volume (lots of sends in a session) | Chalk ball / chalk bag |
| Liquid Chalk | Premium chalk — earned from exceptional sessions | Bottle of liquid chalk |

**Trophy Items (from achievements):**
| Item | Achievement | Display |
|------|------------|---------|
| Carabiner | First session | Locking carabiner |
| Quickdraw | First lead climb logged | Quickdraw |
| Brush | Boss defeated | Boar hair brush |
| Belay Device | Hosted N raids | ATC/GriGri |
| Rope | Streak milestone | Coiled rope |
| Crash Pad | Bouldering milestone | Crash pad |
| Hangboard | Consistency milestone | Hangboard |
| Climbing Shoes (special) | Grade breakthrough | Glowing climbing shoes |

**Gear (Avatar Cosmetics from achievements):**
- Crown / headband → defeated a boss
- Cape / chalk bag flair → streak achievements
- Glowing shoes → grade breakthrough
- Special harness color → social achievements
- Aura effect → high-level milestones

### Relationship to Inventory System
- Uses the per-item `inventoryItems` table from feature #2
- Each item has provenance (which event/achievement granted it)
- Trophy items have `status: "held"` permanently (can't be used/traded)
- Consumable items (tape, chalk) could be tradeable in the future

## Hero Classes (Auto-Detected, Vibe-Based)

### Design Philosophy
Classes are based on **how you approach climbing**, not what type of climbing you do. They're auto-detected from behavior patterns, not chosen. Your class can shift over time as your habits change.

### Classes

**The Grinder**
- Signal: High session count, consistent attendance, steady progression
- Vibe: Always at the gym. Doesn't skip weeks. Reliable.
- Detection: Above-average session frequency, low variance in attendance gaps

**The Sender**
- Signal: High success rate on hard routes, frequent sends at/near max grade
- Vibe: Goes for the top. When they try something, they send it.
- Detection: High send-to-attempt ratio at upper grades, frequent flash sends

**The Projector**
- Signal: Many attempts on hard grades before sending, high revive potion (tape) count
- Vibe: Picks hard things and works them until they go. Patient. Persistent.
- Detection: High attempt count at max grade, eventual sends after multiple attempts

**The Explorer**
- Signal: Many gyms visited, variety in grades and styles climbed
- Vibe: Climbs everywhere. Breadth over depth.
- Detection: Above-average unique gym count, wide grade range in sends

**The Rally Captain**
- Signal: Most raids hosted, most connections made, high party session count
- Vibe: The person who gets everyone together. Social glue.
- Detection: Above-average session creation count, high connection count

### Class Mechanics
- Auto-assigned after sufficient data (minimum sessions/sends threshold)
- Visible on profile as a title under your generated name
- Class can shift if behavior patterns change over time
- No gameplay impact in v0 — purely flavor and identity
- Future: class-specific achievements, cosmetics, or minor perks

### Class Assignment Logic
- **Triggered by the events system** — no new infrastructure, same events table from feature #2
- Each class maps to event patterns (send events, attempt events, session creation events, etc.)
- Compute scores for each class based on recent event history
- Highest score = your class
- Require minimum data threshold before assigning (avoid premature labeling)
- Recompute periodically (cron or triggered after each session completes)
- Hysteresis: don't flip classes from session to session — require sustained pattern change

## Implementation Phasing

### v0 (Launch)
- Core achievements (hand-designed, ~15-20 achievements)
- Climbing-themed inventory items (tape, chalk, trophy items)
- Avatar cosmetics unlocked by achievements
- Events table drives achievement detection

### v1
- Hero classes (auto-detected, displayed on profile)
- More achievements based on real user patterns
- Boss-related achievements (requires route identity from feature #1)

### v2+
- Class-specific achievements or cosmetics
- Data-driven achievement suggestions (hybrid approach if needed)
- Trading/gifting items between players
- Seasonal achievements

## Data Architecture

### Achievements Table (v0)
```
achievements: {
  userId
  type: "first_v4" | "streak_7" | "boss_slayer" | "explorer_5" | ...
  metadata: { grade?, gymCount?, streakDays?, ... }
  itemsGranted: [itemType, ...]  // what inventory items were awarded
  earnedAt
}
```

### Relationship to Other Systems
- **Events table** (feature #2): achievements are detected by scanning recent events
- **Inventory table** (feature #2): achievements grant items into inventory
- **Sends table**: raw data for class computation and achievement triggers
- **Sessions table**: data for social achievements and class detection

## Open Questions (Resolved)
- ~~Data-driven vs hand-designed~~ → Hand-designed v0, maybe hybrid later
- ~~Display format~~ → Both inventory items AND avatar cosmetics
- ~~Hero classes: yes/no~~ → Yes, auto-detected from behavior, vibe-based not style-based
- ~~RPG items vs climbing items~~ → Climbing-themed (tape, chalk, carabiners, etc.)

## Remaining Open Questions
- Full list of v0 achievements (needs design pass)
- Pixel art for each item/cosmetic (needs art direction)
- Exact behavioral thresholds for class detection
- Should class assignment be revealed with fanfare, or quietly appear?
- Can you have a secondary class? ("Grinder with Explorer tendencies")

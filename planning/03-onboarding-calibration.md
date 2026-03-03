# Feature: Onboarding Calibration & XP/Leveling System

**Status:** Refined

## Onboarding Calibration

### Two Questions + Beginner Option
During onboarding (enhances existing wizard step 2), the user is asked:
1. **"What feels easy to you?"** — warmup/comfort zone grade
2. **"What's the hardest thing you've ever climbed?"** — current ceiling
3. **"I've never climbed before"** — complete beginner option

### UI
- Vertical sliders per grading system (low = warmup, high = max)
- "+" button to add additional grading systems
- Ask separately for each system the user climbs in (bouldering, rope, gym colors, etc.)

### What Calibration Does
- Sets initial `maxGradeRoute` / `maxGradeBoulder` on user record
- Everyone starts at **level 1** — experienced climbers level up rapidly in their first session
- Wizard flavor: "Because you're more advanced, you'll level up quickly at first"
- Determines what grade ranges to show in UI
- Does NOT affect XP-per-grade (that's universal)

## XP System (Revised — Universal, Not Personal)

### Key Design Change
**XP is tied to absolute difficulty, same for everyone.** A V6 gives the same XP whether you're a beginner or expert. The leveling curve makes easy routes feel insignificant at high levels — this is an emergent property, not an explicit penalty.

### Research Basis
Based on [Drummond & Popinga (2021)](https://arxiv.org/abs/2111.08140) — Bayesian inference on climbing grade data found each V-grade step ≈ **3.17x increase in objective difficulty**. We use this directly for XP scaling.

### XP Per Grade (3.17x per whole grade step)

**V-Scale:**
```
VB        10
V0        32
V1        101
V2        319
V3      1,012
V4      3,207
V5     10,167
V6     32,228
V7    102,163
V8    323,857
V9  1,026,607
V10 3,254,344
```

**YDS (3.17x per full grade, 1.33x per letter subdivision):**
```
5.4        5
5.5        8
5.6       10
5.7       32
5.8      101
5.9      319
5.10a  1,012
5.10b  1,347
5.10c  1,793
5.10d  2,387
5.11a  3,207
5.11b  4,269
5.11c  5,683
5.11d  7,564
5.12a 10,167
```

### Why These Numbers Work
- 1 route at your grade ≈ 3 routes one grade below (research-backed)
- Big numbers at high grades are fine — level thresholds scale to match
- A V8 climber doing V4 warmups: each V4 = 1% of a V8. Warmups are insignificant without any explicit "you get less XP" rule.

### Subdivision Mapping
- Full V-grades: 3.17x per step
- YDS letter grades (a/b/c/d): ⁴√3.17 ≈ 1.33x per letter
- +/- modifiers: treated as half-steps (~√3.17 ≈ 1.78x for full, ~1.33x for +/-)

## Leveling System

### Level Threshold Multiplier: 2x (tunable)
Level thresholds scale at **2x per level** (gentler than the 3.17x XP curve). This gives ~20+ meaningful levels with lots of small wins.

```
Level    Cumulative XP to reach
  1              0
  2             10
  3             20
  4             40
  5             80
  6            160
  7            320
  8            640
  9          1,280
 10          2,560
 11          5,120
 12         10,240
 13         20,480
 14         40,960
 15         81,920
 16        163,840
 17        327,680
 18        655,360
 19      1,310,720
 20      2,621,440
```

### How It Plays Out

**V4 climber (3,207 XP per send), first session:**
- Warms up with some V2s and V3s, sends a few V4s
- Total XP from session: ~15,000
- Reaches level ~11 immediately
- Wizard: "Because you're more advanced, you'll level up quickly at first"

**V4 climber, ongoing:**
- Each V4 send = 3,207 XP
- Level 12 needs ~10,240 cumulative → a few more V4s
- Level 15 needs ~81,920 → about 25 total V4 sends to get here
- Level 16 needs ~163,840 → grinding V4s slows down, V5 would help a lot

**Complete beginner, first session:**
- Climbs some VBs (10 XP each) and a V0 (32 XP)
- Reaches level 3-4
- Every session feels like progress

### Tunability
- The 2x level multiplier is a **tuning knob** — can be adjusted post-launch
- Changing it only requires recalculating thresholds from the same cumulative XP
- No schema changes, no data migration
- XP-per-grade (3.17x) stays fixed (research-backed)

## Grading Systems

### Curated Standards (ship with these)
- **YDS** (5.x) — rope climbing, US standard
- **V Scale** — bouldering, US standard
- **Font** — bouldering, European
- **French Sport** — rope climbing, European

### Gym-Specific Color Systems
- Attached to specific gyms in the database
- Added via support form/email (no gym portal in v0)
- Colors are ordered with optional V-grade range annotations
- For XP purposes: color → midpoint of its V-grade range
- Example: BP Purple (V2-V4) → treated as V3 (1,012 XP)

### Grading System Schema
```
gymGradeSystems: {
  gymId
  name: "Bouldering Project Circuit"
  type: "color" | "custom"
  grades: [
    { label: "Yellow", order: 1, vRangeMin?: "VB", vRangeMax?: "V1", xpMidpoint?: "V0" },
    { label: "Red",    order: 2, vRangeMin?: "V0", vRangeMax?: "V2", xpMidpoint?: "V1" },
    { label: "Purple", order: 3, vRangeMin?: "V2", vRangeMax?: "V4", xpMidpoint?: "V3" },
    ...
  ]
}
```

### Handling Overlapping Ranges
- Gym color grades are first-class grades, not aliases
- The `order` field defines progression within the gym's system
- V-grade range is informational (tooltips, cross-gym comparison)
- XP uses the midpoint mapping — simple, good enough

## Open Questions (Resolved)
- ~~Separate bouldering/rope?~~ → Yes, ask per grading system with "+" to add more
- ~~Starting level~~ → Everyone starts at level 1, fast ramp for experienced climbers
- ~~XP relative to personal max~~ → No, universal XP based on absolute difficulty
- ~~Research vs invented curve~~ → Research-based 3.17x per grade, compressed 2x for level thresholds

## Remaining Open Questions
- Exact wizard dialogue for each calibration step
- How to handle a user who climbs in an unsupported grading system at launch
- Should attempts give XP? If so, what fraction of send XP? (Current ARCHITECTURE.md says ~25%)
- Level cap: is there one? Or infinite levels that just get exponentially harder?
- How often do we expect level-ups at steady state for an active climber? (Tuning target)

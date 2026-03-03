# Belay Quest — Screen Designs

## Navigation Structure

```
Tab Bar (bottom)
├── Quests      (your upcoming sessions)
├── Quest Board (discovery / open quests)
├── Party       (connections & guilds)
└── Character   (your stats, level, settings)
```

---

## 1. Quests Tab (Home / Primary View)

The first thing you see. Your climbing schedule.

```
┌─────────────────────────────────┐
│  BELAY QUEST            [+] ←── New Raid / Quest
│─────────────────────────────────│
│                                 │
│  TODAY                          │
│  ┌─────────────────────────────┐│
│  │ ⚔ Raid at Movement        ││
│  │   6:00 PM                   ││
│  │   🧑‍🤝‍🧑 You, Chalk Phantom,  ││
│  │      Boulder Otter (+2)     ││
│  │   [Accepted ✓]              ││
│  └─────────────────────────────┘│
│                                 │
│  TOMORROW                       │
│  ┌─────────────────────────────┐│
│  │ ⚔ Raid at Summit           ││
│  │   5:30 PM                   ││
│  │   🧑‍🤝‍🧑 Slab Wizard           ││
│  │   [Accept]  [Decline]       ││
│  └─────────────────────────────┘│
│                                 │
│  THIS WEEK                      │
│  ┌─────────────────────────────┐│
│  │ 📜 Quest Board: Summit      ││
│  │   Saturday 2:00 PM          ││
│  │   🧑‍🤝‍🧑 Feral Lynx (V5-V7)   ││
│  │      2/5 spots              ││
│  │   [Accept]  [Decline]       ││
│  └─────────────────────────────┘│
│                                 │
│─────────────────────────────────│
│  [Quests] [Board] [Party] [Character]│
└─────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────┐
│  BELAY QUEST            [+]    │
│─────────────────────────────────│
│                                 │
│                                 │
│         No quests ahead.        │
│                                 │
│      ⛰  Time to rally the      │
│          party?                 │
│                                 │
│      [ Start a Raid ]          │
│      [ Check the Quest Board ]  │
│                                 │
│                                 │
│─────────────────────────────────│
│  [Quests] [Board] [Party] [Character]│
└─────────────────────────────────┘
```

### Session Detail (tap into a Raid or Quest)
```
┌─────────────────────────────────┐
│  ← Back                        │
│─────────────────────────────────│
│                                 │
│  ⚔ Raid at Movement           │
│  Today, 6:00 PM                 │
│                                 │
│  PARTY                          │
│  ┌─────────────────────────────┐│
│  │ ★ You (Party Leader)        ││
│  │   Lv.12  ✨ Ascendant       ││
│  │   Lead · 5.11+              ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │  Chalk Phantom              ││
│  │  (Mike) ←── your nickname   ││
│  │   Lv.8                      ││
│  │   Boulder · V5              ││
│  │   ✓ Accepted                ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │  Boulder Otter              ││
│  │   Lv.5  ☠ Cursed ←── lol   ││
│  │   Top Rope · 5.10           ││
│  │   ⏳ Pending                 ││
│  └─────────────────────────────┘│
│                                 │
│  [ + Invite More ]              │
│                                 │
│  CHECK-IN MESSAGE               │
│  ┌─────────────────────────────┐│
│  │ "Blue shirt, near the slab  ││
│  │  wall" — You                ││
│  └─────────────────────────────┘│
│                                 │
│  LIVE SENDS            [+ Log] │
│  ┌─────────────────────────────┐│
│  │  5.11  ✓ send   on-grade    ││
│  │    +45 XP                   ││
│  │  5.11+ ✗ attempt  hard      ││
│  │    +10 XP  🩹 tape earned   ││
│  │  V5    ✓ send   soft        ││
│  │    +30 XP                   ││
│  └─────────────────────────────┘│
│                                 │
│  EVENTS                        │
│  ┌─────────────────────────────┐│
│  │  ✨ Grade Breakthrough!      ││
│  │  🏔 Volume PR: 3× V5!       ││
│  └─────────────────────────────┘│
│                                 │
│  [ Cancel My Attendance ]       │
│                                 │
│─────────────────────────────────│
│  [Quests] [Board] [Party] [Character]│
└─────────────────────────────────┘
```

---

## 2. Quest Board Tab (Discovery)

Open sessions at your favorited gyms.

```
┌─────────────────────────────────┐
│  QUEST BOARD                    │
│─────────────────────────────────│
│                                 │
│  ⭐ Movement Climbing           │
│  ┌─────────────────────────────┐│
│  │ 📜 "Looking for lead belay" ││
│  │   Today 7:00 PM             ││
│  │   Granite Falcon (Lv.15)    ││
│  │   Lead · 5.11-5.12          ││
│  │   3/5 joined                ││
│  │   [ Join Quest ]            ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 📜 "Bouldering sesh"        ││
│  │   Tomorrow 4:00 PM          ││
│  │   Mossy Badger (Lv.3)       ││
│  │   Boulder · V3-V5           ││
│  │   1/4 joined                ││
│  │   [ Join Quest ]            ││
│  └─────────────────────────────┘│
│                                 │
│  ⭐ Summit Dallas               │
│  ┌─────────────────────────────┐│
│  │ 📜 "TR partner needed"      ││
│  │   Saturday 10:00 AM         ││
│  │   Alpine Sphinx (Lv.9)      ││
│  │   Top Rope · 5.10           ││
│  │   1/3 joined                ││
│  │   [ Join Quest ]            ││
│  └─────────────────────────────┘│
│                                 │
│  [ + Post to Quest Board ]      │
│                                 │
│─────────────────────────────────│
│  [Quests] [Board] [Party] [Character]│
└─────────────────────────────────┘
```

### Quest Board — Grade Filter
```
┌─────────────────────────────────┐
│  QUEST BOARD                    │
│─────────────────────────────────│
│  Filter: [All] [V0-V3] [V4-V6] │
│          [V7+] [5.9-] [5.10]   │
│          [5.11] [5.12+]        │
│─────────────────────────────────│
│  ...                            │
```

---

## 3. Party Tab (Connections & Guilds)

```
┌─────────────────────────────────┐
│  PARTY                          │
│─────────────────────────────────│
│                                 │
│  GUILDS                         │
│  ┌──────────┐ ┌──────────┐     │
│  │ Tuesday  │ │ Weekend  │     │
│  │ Crew     │ │ Warriors │     │
│  │ 4 people │ │ 7 people │     │
│  └──────────┘ └──────────┘     │
│  [ + New Guild ]                │
│                                 │
│  CONNECTIONS                    │
│  ┌─────────────────────────────┐│
│  │  Chalk Phantom              ││
│  │  (Mike)                     ││
│  │  Lv.8 · Boulder · V5       ││
│  │  Last session: 2 days ago   ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │  Slab Wizard                ││
│  │  Lv.14 · Lead · 5.12       ││
│  │  ✨ Blessed                  ││
│  │  Last session: 1 week ago   ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │  Boulder Otter              ││
│  │  (Sarah)                    ││
│  │  Lv.5 · Top Rope · 5.10    ││
│  │  ☠ Cursed                   ││
│  │  Last session: 3 days ago   ││
│  └─────────────────────────────┘│
│                                 │
│  [ + Add by Phone Number ]      │
│                                 │
│─────────────────────────────────│
│  [Quests] [Board] [Party] [Character]│
└─────────────────────────────────┘
```

---

## 4. Character Tab

```
┌─────────────────────────────────┐
│  CHARACTER                      │
│─────────────────────────────────│
│                                 │
│  ┌─────────────────────────────┐│
│  │    [Pixel Avatar]           ││
│  │    (profile view: with      ││
│  │     cosmetic overlays)      ││
│  │                             ││
│  │    Crimson Gecko            ││
│  │    The Grinder ←── hero     ││
│  │    Level 12                 ││
│  │    ✨ Ascendant              ││
│  │                             ││
│  │    Lead · 5.11+             ││
│  │    Climbing 3 years         ││
│  │                             ││
│  │    [ Edit Avatar ]          ││
│  └─────────────────────────────┘│
│                                 │
│  STATS                          │
│  ┌─────────────────────────────┐│
│  │  Total Sessions     87      ││
│  │  Routes Logged     412      ││
│  │  Max Grade       5.11+      ││
│  │  Max Boulder       V6       ││
│  │  XP            2,340        ││
│  └─────────────────────────────┘│
│                                 │
│  ACHIEVEMENTS       [View All] │
│  ┌─────────────────────────────┐│
│  │  🏔 First V5!               ││
│  │  🔥 7-Day Streak            ││
│  │  🧗 100 Sends               ││
│  │  + 4 more                   ││
│  └─────────────────────────────┘│
│                                 │
│  INVENTORY          [View All] │
│  ┌─────────────────────────────┐│
│  │  🩹 Tape ×12                ││
│  │  🧲 Carabiner (trophy)     ││
│  │  👟 Glowing Shoes (cosmetic)││
│  └─────────────────────────────┘│
│                                 │
│  RECENT SENDS                   │
│  ┌─────────────────────────────┐│
│  │  5.11+ ✨ NEW PR!           ││
│  │  Movement · Feb 24          ││
│  │  +180 XP                    ││
│  ├─────────────────────────────┤│
│  │  5.11  on-grade             ││
│  │  Movement · Feb 24          ││
│  │  +45 XP                    ││
│  ├─────────────────────────────┤│
│  │  V6 (attempt) hard          ││
│  │  Summit · Feb 22            ││
│  │  +20 XP  🩹 tape            ││
│  └─────────────────────────────┘│
│                                 │
│  GRADE HISTORY                  │
│  ┌─────────────────────────────┐│
│  │  ▁▂▂▃▃▃▄▅▅▆▆▇ ←── graph   ││
│  │  Jan    Feb    Mar          ││
│  └─────────────────────────────┘│
│                                 │
│  [ Settings ⚙ ]                 │
│  [ Favorite Gyms ]              │
│  [ Edit Profile ]               │
│                                 │
│─────────────────────────────────│
│  [Quests] [Board] [Party] [Character]│
└─────────────────────────────────┘
```

---

## 5. Create Session Flow

### Step 1: Choose Type
```
┌─────────────────────────────────┐
│  ← Cancel                      │
│─────────────────────────────────│
│                                 │
│  NEW SESSION                    │
│                                 │
│  ┌─────────────────────────────┐│
│  │  ⚔ Raid                    ││
│  │  Invite your crew to climb  ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  📜 Quest Board              ││
│  │  Find new climbing partners ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

### Step 2: Set Details
```
┌─────────────────────────────────┐
│  ← Back              Next →    │
│─────────────────────────────────│
│                                 │
│  WHERE                          │
│  ┌─────────────────────────────┐│
│  │ ⭐ Movement          ←fav   ││
│  │ ⭐ Summit                    ││
│  │    Austin Bouldering Co     ││
│  │    [Search gyms...]         ││
│  └─────────────────────────────┘│
│                                 │
│  WHEN                           │
│  ┌─────────────────────────────┐│
│  │ Today    Tomorrow   Pick    ││
│  │                             ││
│  │ Around:  [6:00 PM]  ←dial   ││
│  └─────────────────────────────┘│
│                                 │
│  NOTE (optional)                │
│  ┌─────────────────────────────┐│
│  │ "Looking for lead belay"    ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

### Step 3a: Invite (Raid only)
```
┌─────────────────────────────────┐
│  ← Back             Create →   │
│─────────────────────────────────│
│                                 │
│  INVITE                         │
│                                 │
│  GUILDS                         │
│  ┌──────────┐ ┌──────────┐     │
│  │☐Tuesday  │ │☐Weekend  │     │
│  │  Crew    │ │  Warriors│     │
│  └──────────┘ └──────────┘     │
│                                 │
│  CONNECTIONS                    │
│  ☐ Chalk Phantom (Mike)        │
│  ☐ Slab Wizard                 │
│  ☐ Boulder Otter (Sarah)       │
│  ☑ Feral Lynx                  │
│  ☑ Granite Falcon (Jake)       │
│                                 │
│  [ + Add by Phone Number ]      │
│                                 │
└─────────────────────────────────┘
```

### Step 3b: Set Capacity (Quest Board only)
```
┌─────────────────────────────────┐
│  ← Back              Post →    │
│─────────────────────────────────│
│                                 │
│  PARTY SIZE                     │
│                                 │
│  How many climbers?             │
│                                 │
│   [3]  [4]  [5]  [6]  [7]     │
│                                 │
│  CLIMBING TYPE                  │
│  [Boulder] [Top Rope] [Lead]   │
│  [Any]                          │
│                                 │
│  GRADE RANGE                    │
│  [  V4  ] — [  V7  ]           │
│                                 │
│  CHECK-IN MESSAGE               │
│  ┌─────────────────────────────┐│
│  │ "Blue shirt, slab wall"     ││
│  └─────────────────────────────┘│
│  Visible to all who join.       │
│                                 │
└─────────────────────────────────┘
```

---

## 6. Post-Session Prompt

Appears after a session's scheduled time has passed.
For Quest Board sessions: includes "climb again?" prompts.
For all sessions: includes guild invite and send summary.

```
┌─────────────────────────────────┐
│                                 │
│  Quest Complete!                │
│                                 │
│  SESSION SENDS                  │
│  ┌─────────────────────────────┐│
│  │  5.11  ✓        +45 XP     ││
│  │  5.11+ ✗        +10 XP     ││
│  │  V5    ✓        +30 XP     ││
│  │              Total: +85 XP  ││
│  │  [ + Log More ]             ││
│  └─────────────────────────────┘│
│                                 │
│  YOU CLIMBED WITH          ←─── Quest Board only
│  ┌─────────────────────────────┐│
│  │  Mossy Badger               ││
│  │  Lv.3 · Boulder · V4       ││
│  │                             ││
│  │  Climb together again?      ││
│  │  [ Yes! ]    [ Not now ]    ││
│  │                             ││
│  │  Add to guild?              ││
│  │  [Tuesday Crew] [Weekend..]││
│  │  [ + New Guild ]            ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  Dusty Mantis               ││
│  │  Lv.7 · Boulder · V6       ││
│  │                             ││
│  │  Climb together again?      ││
│  │  [ Yes! ]    [ Not now ]    ││
│  │                             ││
│  │  Add to guild?              ││
│  │  [Tuesday Crew] [Weekend..]││
│  │  [ + New Guild ]            ││
│  └─────────────────────────────┘│
│                                 │
│  [ Done ]                       │
│                                 │
└─────────────────────────────────┘
```

---

## 7. Push Notification Examples

```
Raid Invite:
┌─────────────────────────────────┐
│ 🏔 BELAY QUEST                  │
│ Chalk Phantom is heading to     │
│ Movement around 6pm. Join?      │
│ [I'm In]           [Not Today]  │
└─────────────────────────────────┘

Session Reminder (45 min before):
┌─────────────────────────────────┐
│ 🏔 BELAY QUEST                  │
│ Raid at Movement in 45 min!    │
│ Party: You + 3 others           │
└─────────────────────────────────┘

Quest Board Join:
┌─────────────────────────────────┐
│ 🏔 BELAY QUEST                  │
│ Feral Lynx joined your quest    │
│ at Summit tomorrow at 2pm       │
└─────────────────────────────────┘

Grade Breakthrough:
┌─────────────────────────────────┐
│ 🏔 BELAY QUEST                  │
│ ✨ LEVEL UP! You sent 5.11+!    │
│ New status: Ascendant           │
└─────────────────────────────────┘

Party Leader Deserted:
┌─────────────────────────────────┐
│ 🏔 BELAY QUEST                  │
│ ☠ Party leader deserted!        │
│ Raid at Movement 6pm needs     │
│ a new leader. Step up?          │
│ [Take Over]        [Leave]      │
└─────────────────────────────────┘

No-Show Warning (Quest only):
┌─────────────────────────────────┐
│ 🏔 BELAY QUEST                  │
│ 🧙 Dark magic stirs...          │
│ Did you make it to your quest   │
│ at Movement?                    │
│ [I Was There]   [I Couldn't]    │
└─────────────────────────────────┘
```

---

## 8. SMS Invite (Non-User Viral Flow)

When you add a phone number for someone who doesn't have the app:

```
SMS Message:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hey! Crimson Gecko invited you to
climb at Movement around 6pm.

3 others are joining.

Join the quest: belay.quest/j/x7k2

🏔 Belay Quest — Find your
   climbing party.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Link opens a **web page** (universal link / app link):
- **Always works in browser** — no app required to view session details
- Web page shows: gym, time, who's going (generated names), spots remaining
- On mobile with app installed → universal link opens session directly in app
- On mobile without app → web page with session info + app store link (deep link preserved for post-install)
- On desktop → full web view of session, prompt to download mobile app to join

The web page is a first-class experience, not a redirect wall. You can see the session without the app. You need the app to join.

---

## Flow Diagram: User Journey Map

```
                    ┌──────────────┐
                    │  Download &  │
                    │  Sign Up     │
                    │  (phone #)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Generate    │
                    │  Name &      │
                    │  Set Grades  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Favorite    │
                    │  Your Gyms   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌───▼────┐ ┌─────▼──────┐
       │ Add friends │ │ Browse │ │  Go solo   │
       │ by phone #  │ │ Quest  │ │  & log     │
       │             │ │ Board  │ │  climbs    │
       └──────┬──────┘ └───┬────┘ └─────┬──────┘
              │            │            │
       ┌──────▼──────┐ ┌───▼────────┐  │
       │ Raid your  │ │ Join open  │  │
       │ crew        │ │ quest      │  │
       └──────┬──────┘ └───┬────────┘  │
              │            │            │
              │      ┌─────▼─────┐     │
              │      │  Climb    │     │
              │      │  together │     │
              │      └─────┬─────┘     │
              │            │            │
              │      ┌─────▼─────┐     │
              │      │ "Again?"  │     │
              │      │  Mutual → │     │
              │      │  Connect  │     │
              │      └─────┬─────┘     │
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼───────┐
                    │  Log sends   │
                    │  Earn XP     │
                    │  Level up    │
                    └──────────────┘
```

---

## 9. Onboarding (Wizard-Guided)

The wizard guides you through setup. Each step is a single screen with
the wizard character providing flavor text.

```
┌─────────────────────────────────┐
│                                 │
│         [Pixel Wizard]          │
│                                 │
│  🧙 "Ah, a new climber          │
│   approaches! Let me see...     │
│   The chalk spirits have        │
│   chosen a name for you."       │
│                                 │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │     ✨ Crimson Gecko ✨       ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  [ That's me! ]                 │
│  [ Reroll ]  ←── limited uses? │
│                                 │
└─────────────────────────────────┘
```

```
┌─────────────────────────────────┐
│                                 │
│         [Pixel Wizard]          │
│                                 │
│  🧙 "What manner of walls       │
│   do you scale, adventurer?"    │
│                                 │
│  CLIMBING STYLE                 │
│  [Boulder] [Top Rope] [Lead]   │
│  [All of the above]            │
│                                 │
│  YOUR GRADE RANGE               │
│  Route: [ 5.10a ] — [ 5.11+ ]  │
│  Boulder: [ V4 ] — [ V6 ]      │
│                                 │
│  HOW LONG HAVE YOU CLIMBED?     │
│  [ < 1 year ] [ 1-3 years ]    │
│  [ 3-5 years ] [ 5+ years ]    │
│                                 │
│  [ Continue → ]                 │
│                                 │
└─────────────────────────────────┘
```

```
┌─────────────────────────────────┐
│                                 │
│         [Pixel Wizard]          │
│                                 │
│  🧙 "Every adventurer needs     │
│   a dungeon. Where do you       │
│   climb?"                       │
│                                 │
│  SEARCH YOUR GYMS               │
│  ┌─────────────────────────────┐│
│  │ [Search gyms near me...]    ││
│  └─────────────────────────────┘│
│                                 │
│  NEARBY                         │
│  ☑ Movement Climbing            │
│  ☐ Summit Dallas                │
│  ☐ Austin Bouldering Co         │
│                                 │
│  [ Continue → ]                 │
│                                 │
└─────────────────────────────────┘
```

```
┌─────────────────────────────────┐
│                                 │
│         [Pixel Wizard]          │
│                                 │
│  🧙 "One last thing — invite    │
│   your party! Enter their       │
│   numbers and I'll send word."  │
│                                 │
│  ┌─────────────────────────────┐│
│  │ [Enter phone number...]     ││
│  └─────────────────────────────┘│
│  Added:                         │
│  📱 (512) 555-0142              │
│  📱 (512) 555-0199              │
│                                 │
│  [ Skip for now ]               │
│  [ Start Your Quest → ]        │
│                                 │
└─────────────────────────────────┘
```

---

## 10. Session Web Page (Universal Link Landing)

What non-users see when they tap a belay.quest link.
No app required to view — app required to join.

```
┌─────────────────────────────────────────┐
│  🏔 BELAY QUEST                         │
│─────────────────────────────────────────│
│                                         │
│  You've been invited to climb!          │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  ⚔ Raid at Movement Climbing       ││
│  │  Thursday, Feb 27 · around 6:00 PM  ││
│  │                                     ││
│  │  PARTY (3 going)                    ││
│  │  ★ Crimson Gecko (Lv.12)           ││
│  │    Chalk Phantom (Lv.8)            ││
│  │    Boulder Otter (Lv.5)            ││
│  │                                     ││
│  │  + 2 spots open                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  [ Open in App ]                        │
│  [ Download Belay Quest ]               │
│     iOS · Android                       │
│                                         │
│  ─────────────────────────────────────  │
│  Belay Quest — Find your climbing party │
│  belay.quest                            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 11. Avatar Appearance Picker

Accessible from Character tab ("Edit Avatar") and during session check-in for party leaders.

### Session Check-In (Leader Prompted)
```
┌─────────────────────────────────┐
│  ← Back                        │
│─────────────────────────────────│
│                                 │
│  🧙 "What are you wearing       │
│   today, adventurer?"           │
│                                 │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │    [Pixel Avatar Preview]   ││
│  │    (session view: no        ││
│  │     cosmetic overlays)      ││
│  │                             ││
│  └─────────────────────────────┘│
│                                 │
│  HAIR                           │
│  [Hair] [Hat]   Color: [■■■■]  │
│                                 │
│  SKIN TONE                      │
│  [1] [2] [3]                    │
│                                 │
│  GLASSES                        │
│  [Yes] [No]     Color: [■■■■]  │
│                                 │
│  SHIRT          Color: [■■■■]  │
│  PANTS                          │
│  [Pants] [Shorts] Color: [■■■■]│
│                                 │
│  HARNESS                        │
│  [Yes] [No]     Color: [■■■■]  │
│                                 │
│  SHOES          Color: [■■■■]  │
│                                 │
│  Defaults from: Movement ←gym  │
│                                 │
│  [ Confirm & Check In ]        │
│                                 │
└─────────────────────────────────┘
```

Notes:
- Color pickers offer 8-10 preset swatches + optional custom hex
- Per-gym defaults: selections persist per gym (harness at rope gym, no harness at bouldering)
- First time at a gym inherits from most recent defaults
- Non-leaders can access from Character tab but are not prompted

### Achievements & Inventory Screens

```
┌─────────────────────────────────┐
│  ← Character                   │
│─────────────────────────────────│
│  ACHIEVEMENTS                   │
│                                 │
│  ┌─────────────────────────────┐│
│  │  🏔 First V5!               ││
│  │  Earned Feb 24              ││
│  │  → Unlocked: Glowing Shoes ││
│  ├─────────────────────────────┤│
│  │  🔥 7-Day Streak            ││
│  │  Earned Feb 20              ││
│  │  → Unlocked: Rope (trophy) ││
│  ├─────────────────────────────┤│
│  │  🧗 100 Sends               ││
│  │  Earned Feb 15              ││
│  │  → Unlocked: Chalk          ││
│  ├─────────────────────────────┤│
│  │  ☐ Boss Slayer (locked)     ││
│  │  ☐ Explorer (3/5 gyms)     ││
│  │  ☐ Rally Captain (locked)  ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

```
┌─────────────────────────────────┐
│  ← Character                   │
│─────────────────────────────────│
│  INVENTORY                      │
│                                 │
│  CONSUMABLES                    │
│  ┌─────────────────────────────┐│
│  │  🩹 Tape ×12                ││
│  │  Earned from attempts       ││
│  ├─────────────────────────────┤│
│  │  🧊 Chalk ×3                ││
│  │  Earned from volume         ││
│  └─────────────────────────────┘│
│                                 │
│  TROPHIES                       │
│  ┌─────────────────────────────┐│
│  │  🧲 Carabiner              ││
│  │  "First session" · Feb 1   ││
│  ├─────────────────────────────┤│
│  │  👟 Glowing Shoes           ││
│  │  "First V5!" · Feb 24      ││
│  └─────────────────────────────┘│
│                                 │
│  COSMETICS (equipped)           │
│  ┌─────────────────────────────┐│
│  │  👟 Glowing Shoes — ON     ││
│  │  (visible on profile avatar)││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

---

## Screen Inventory

| Screen | Purpose | Priority |
|--------|---------|----------|
| Quests (home) | View upcoming sessions | P0 |
| Session Detail | See party, check-in msg, live send logging | P0 |
| Create Raid | Gym → time → invite flow | P0 |
| Quest Board | Browse open quests by gym | P0 |
| Post to Quest Board | Gym → time → capacity → grade range | P0 |
| Party (connections) | View/manage connections and guilds | P0 |
| Character | Stats, level, grade history, settings | P0 |
| Post-Session Prompt | XP summary, "climb again?", guild invite | P0 |
| Onboarding (wizard) | Wizard-guided: name → grades → gyms → invite | P0 |
| Session Web Page | Universal link landing — viewable without app | P0 |
| No-Show Prompt | Honor-system "did you make it?" (Quests only) | P0 |
| Avatar Picker | Customize pixel-art avatar (session check-in + character tab) | P1 |
| Achievements List | View earned + locked achievements with rewards | P1 |
| Inventory View | Browse held items (consumables, trophies, cosmetics) | P1 |
| Manage Guild | Add/remove people from a saved guild | P1 |
| Settings | Notifications, account, favorites | P1 |
| Route Logger | Inline send/attempt logging with difficulty rating (in session detail) | P1 |
| Grade Breakthrough | Celebration screen with pixel art | P1 |
| Connection Profile | View another person's public profile (avatar + achievements) | P1 |

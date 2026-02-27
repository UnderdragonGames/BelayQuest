# Belay Quest — Screen Designs

## Navigation Structure

```
Tab Bar (bottom)
├── Quests      (your upcoming sessions)
├── Quest Board (discovery / open quests)
├── Party       (connections & groups)
└── Profile     (your stats, level, settings)
```

---

## 1. Quests Tab (Home / Primary View)

The first thing you see. Your climbing schedule.

```
┌─────────────────────────────────┐
│  BELAY QUEST            [+] ←── New Rally / Quest
│─────────────────────────────────│
│                                 │
│  TODAY                          │
│  ┌─────────────────────────────┐│
│  │ ⚔ Rally at Movement        ││
│  │   6:00 PM                   ││
│  │   🧑‍🤝‍🧑 You, Chalk Phantom,  ││
│  │      Boulder Otter (+2)     ││
│  │   [Accepted ✓]              ││
│  └─────────────────────────────┘│
│                                 │
│  TOMORROW                       │
│  ┌─────────────────────────────┐│
│  │ ⚔ Rally at Summit           ││
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
│  [Quests]  [Board]  [Party]  [Me]│
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
│      [ Start a Rally ]          │
│      [ Check the Quest Board ]  │
│                                 │
│                                 │
│─────────────────────────────────│
│  [Quests]  [Board]  [Party]  [Me]│
└─────────────────────────────────┘
```

### Session Detail (tap into a Rally or Quest)
```
┌─────────────────────────────────┐
│  ← Back                        │
│─────────────────────────────────│
│                                 │
│  ⚔ Rally at Movement           │
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
│  [ Cancel My Attendance ]       │
│                                 │
│─────────────────────────────────│
│  [Quests]  [Board]  [Party]  [Me]│
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
│  [Quests]  [Board]  [Party]  [Me]│
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

## 3. Party Tab (Connections & Groups)

```
┌─────────────────────────────────┐
│  PARTY                          │
│─────────────────────────────────│
│                                 │
│  GROUPS                         │
│  ┌──────────┐ ┌──────────┐     │
│  │ Tuesday  │ │ Weekend  │     │
│  │ Crew     │ │ Warriors │     │
│  │ 4 people │ │ 7 people │     │
│  └──────────┘ └──────────┘     │
│  [ + New Group ]                │
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
│  [Quests]  [Board]  [Party]  [Me]│
└─────────────────────────────────┘
```

---

## 4. Profile Tab (Me)

```
┌─────────────────────────────────┐
│  YOUR QUEST                     │
│─────────────────────────────────│
│                                 │
│  ┌─────────────────────────────┐│
│  │    [Pixel Avatar]           ││
│  │                             ││
│  │    Crimson Gecko            ││
│  │    Level 12                 ││
│  │    ✨ Ascendant              ││
│  │                             ││
│  │    Lead · 5.11+             ││
│  │    Climbing 3 years         ││
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
│  RECENT SENDS                   │
│  ┌─────────────────────────────┐│
│  │  5.11+ ✨ NEW PR!           ││
│  │  Movement · Feb 24          ││
│  │  +180 XP                    ││
│  ├─────────────────────────────┤│
│  │  5.11                       ││
│  │  Movement · Feb 24          ││
│  │  +45 XP                    ││
│  ├─────────────────────────────┤│
│  │  V6 (attempt)               ││
│  │  Summit · Feb 22            ││
│  │  +20 XP                    ││
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
│  [Quests]  [Board]  [Party]  [Me]│
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
│  │  ⚔ Rally                    ││
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

### Step 3a: Invite (Rally only)
```
┌─────────────────────────────────┐
│  ← Back             Create →   │
│─────────────────────────────────│
│                                 │
│  INVITE                         │
│                                 │
│  GROUPS                         │
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

## 6. Post-Session Prompt (Discovery only)

Appears after a Quest Board session's scheduled time has passed.

```
┌─────────────────────────────────┐
│                                 │
│  Quest Complete!                │
│                                 │
│  You climbed with:              │
│                                 │
│  ┌─────────────────────────────┐│
│  │  Mossy Badger               ││
│  │  Lv.3 · Boulder · V4       ││
│  │                             ││
│  │  Climb together again?      ││
│  │                             ││
│  │  [ Yes! ]    [ Not now ]    ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │  Dusty Mantis               ││
│  │  Lv.7 · Boulder · V6       ││
│  │                             ││
│  │  Climb together again?      ││
│  │                             ││
│  │  [ Yes! ]    [ Not now ]    ││
│  └─────────────────────────────┘│
│                                 │
│  LOG YOUR SENDS                 │
│  [ Log Routes from This Sesh ] │
│                                 │
└─────────────────────────────────┘
```

---

## 7. Push Notification Examples

```
Rally Invite:
┌─────────────────────────────────┐
│ 🏔 BELAY QUEST                  │
│ Chalk Phantom is heading to     │
│ Movement around 6pm. Join?      │
│ [I'm In]           [Not Today]  │
└─────────────────────────────────┘

Session Reminder (45 min before):
┌─────────────────────────────────┐
│ 🏔 BELAY QUEST                  │
│ Rally at Movement in 45 min!    │
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
│ Rally at Movement 6pm needs     │
│ a new leader. Step up?          │
│ [Take Over]        [Leave]      │
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

Link opens:
- On mobile with app → opens session directly
- On mobile without app → app store with deep link preserved
- On any device → web preview showing session details + download prompt

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
       │ Rally your  │ │ Join open  │  │
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

## Screen Inventory

| Screen | Purpose | Priority |
|--------|---------|----------|
| Quests (home) | View upcoming sessions | P0 |
| Session Detail | See party, check-in msg, manage attendance | P0 |
| Create Rally | Gym → time → invite flow | P0 |
| Quest Board | Browse open quests by gym | P0 |
| Post to Quest Board | Gym → time → capacity → grade range | P0 |
| Party (connections) | View/manage connections and groups | P0 |
| Profile (me) | Stats, level, grade history, settings | P0 |
| Post-Session Prompt | "Climb again?" mutual match | P0 |
| Onboarding | Sign up, generate name, set grades, fav gyms | P0 |
| Manage Group | Add/remove people from a saved group | P1 |
| Settings | Notifications, account, favorites | P1 |
| Route Logger | Log sends/attempts during or after session | P1 |
| Grade Breakthrough | Celebration screen with pixel art | P1 |
| Connection Profile | View another person's public profile | P1 |

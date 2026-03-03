# Feature: Avatar Appearance Picker

**Status:** Refined

## Core Concept

Every user has a customizable pixel-art avatar used for identification and RPG identity. The avatar has two views:

- **Session view:** Stripped-down clothing/hair colors only — what someone would actually see at the gym. No cosmetic overlays. Used for identification.
- **Profile view:** Full character — base appearance PLUS achievement cosmetics (wolf companion, glowing shoes, aura, etc.). Your RPG identity.

This separation ensures session avatars are practical ("look for the red shirt") while profile avatars are fantastical.

## Customizable Attributes

All rendered in pixel-art style:

| Attribute | Options | Notes |
|-----------|---------|-------|
| Hair/hat | Medium-length hair OR hat | Two options only. Medium hair is gender-neutral. Hat adds variety without gender signal. |
| Hair/hat color | Color picker | Applies to whichever option is selected |
| Skin tone | 3 preset pixel tones | Practical identification signal. Not granular. |
| Glasses | Yes/no + frame color | Gender-neutral, real thing people wear climbing |
| Shirt color | Color picker | |
| Pants/shorts | Toggle + color picker | |
| Harness | Yes/no + color | Not everyone wears one (boulderers) |
| Shoe color | Color picker | |

### Design Constraints (Privacy-Preserving)
- No gender selection
- No body type options
- Hair is medium-length only (one style) — could be anyone
- Hat as alternative to hair — adds variety, reduces identification signals
- Focus is purely on "what are you wearing today" for identification

## Session Check-In Flow

### Party Leader (Prompted)
When a session goes active, the leader gets a confirmation screen:
1. Their avatar appears with **defaults from last session at this gym**
2. Quick tap to adjust any attribute (color swatches, toggles)
3. Confirm → avatar is visible to all session members
4. Fast interaction — not a full character creator, just "is this still accurate?"

### Per-Gym Defaults
- Selections persist as defaults **per gym** (you might wear different shoes at different gyms, or have a harness at one and not another)
- First time at a gym: inherits from your most recent session defaults
- Subsequent visits: uses last settings for that gym

### Non-Leaders
- Can optionally update their avatar at any time but are **not prompted**
- Their avatar uses their most recent defaults
- Visible in session member list

## Where Avatars Appear

### Session View (practical, no cosmetics)
- **Session detail:** All member avatars in the party list
- **Session check-in:** Leader's avatar shown prominently with a party leader badge/icon
- **Quest Board:** Small avatars next to session listings

### Profile View (full RPG character)
- **Character screen:** Your full avatar with all achievement cosmetics
- **Profile popup:** When someone taps your avatar anywhere in the app
- **Achievement cosmetics layered on top:** Glowing shoes, wolf companion, aura effects, etc.

### Leader Identification
- Leader is identified by a **UI indicator** (small star, crown icon, party leader label) — not by hair/hat rules
- Everyone has access to the same customization options

## Achievement Cosmetic Layering (from Feature #4)

### Session View: No Cosmetics
- Pure identification — what you're wearing today
- A crown could be mistaken for a real item, so fantasy elements are excluded
- Keeps it practical for "find this person at the gym"

### Profile View: Full Fantasy
- Achievement cosmetics layer on top of base appearance
- Examples that work (clearly fantasy, can't be mistaken for real):
  - Magical wolf companion
  - Glowing shoes / aura
  - Enchanted chalk bag
  - Floating particles
  - Background effects
- Examples that could confuse (avoid in session view, fine in profile):
  - Crown
  - Cape
  - Wings

## Data Architecture

### User Record (Avatar Defaults)
```
avatarDefaults: {
  hair: "medium" | "hat"
  hairColor: string (hex)
  skinTone: 1 | 2 | 3
  glasses: boolean
  glassesColor?: string (hex)
  shirtColor: string (hex)
  pantsType: "pants" | "shorts"
  pantsColor: string (hex)
  harness: boolean
  harnessColor?: string (hex)
  shoeColor: string (hex)
}
```

### Per-Gym Overrides
```
avatarGymOverrides: {
  userId
  gymId
  overrides: { ...partial avatarDefaults }
  lastUsedAt
}
```

### Session Avatar (Snapshot)
When a session goes active, the leader's current avatar is **snapshotted** onto the session record so it's preserved even if they change defaults later.

```
// On sessionMembers or session record
avatarSnapshot: { ...avatarDefaults }
```

## Implementation Notes

- Color pickers should offer preset swatches (8-10 common colors) with optional custom hex for power users
- Pixel art rendering: likely 32x32 sprites with color substitution (base sprite + color palette)
- Avatar rendering component is shared between session view (no cosmetics) and profile view (with cosmetics)
- Cosmetic layer is an overlay system — base sprite + optional cosmetic sprites composited on top

## Open Questions (Resolved)
- ~~Leader only or everyone?~~ → Everyone gets avatars, leader is prompted to confirm at check-in
- ~~Hair options~~ → Medium hair or hat only, no gender signal
- ~~Skin tone~~ → Yes, 3 presets. Practical identification signal.
- ~~Achievement cosmetic conflicts~~ → Separated into session view (no cosmetics) vs profile view (full fantasy)

## Remaining Open Questions
- Pixel art style/resolution — 16x16, 24x24, or 32x32?
- How many hat styles? (One generic, or a few options like beanie, cap, headband?)
- Should color presets differ per attribute? (Shirt has more variety than skin tone)
- How is the avatar rendered technically? Layered sprites? SVG with color fills? Procedural?
- Do we need an avatar for users who never customize? (Auto-generated from name hash?)

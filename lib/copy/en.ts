/**
 * All user-facing strings. Single source of truth.
 * Keys are dot-separated paths. Values support {interpolation}.
 * Future: add en-plain.ts for "boring mode" with same keys.
 */
export const copy = {
  // ─── App ─────────────────────────────────────────────────
  "app.name": "Belay Quest",
  "app.tagline": "Find your climbing party.",

  // ─── Tabs ────────────────────────────────────────────────
  "tab.quests": "Quests",
  "tab.board": "Board",
  "tab.party": "Party",
  "tab.character": "Character",

  // ─── Session Types ───────────────────────────────────────
  "session.raid": "Raid",
  "session.quest": "Quest",
  "session.raid.description": "Rally your guild to climb",
  "session.quest.description": "Seek new climbing allies",

  // ─── Session Status ──────────────────────────────────────
  "session.status.draft": "Preparing...",
  "session.status.open": "Assembling party",
  "session.status.active": "In progress",
  "session.status.completed": "Quest complete!",
  "session.status.dissolved": "The raid has fallen.",

  // ─── Quick Raid ──────────────────────────────────────────
  "quickraid.button": "Quick Raid",
  "quickraid.confirm": "Send Invites",

  // ─── Notifications ───────────────────────────────────────
  "notif.raid.invite": "{name} is heading to {gym} around {time}. Join the raid?",
  "notif.raid.reminder": "Raid at {gym} in 45 min! Party: You + {count} others",
  "notif.quest.join": "{name} joined your quest at {gym}",
  "notif.leader.deserted": "Your party leader deserted!",
  "notif.leader.deserted.body":
    "The quest at {gym} needs a new leader. Step up or the raid falls.",
  "notif.session.dissolved":
    "The raid has fallen. No leader stepped up. The party scatters.",

  // ─── No-Show / Honor System ──────────────────────────────
  "noshow.warning":
    "Dark magic stirs... did you make it to your quest at {gym}?",
  "noshow.confirm.attended": "I was there",
  "noshow.confirm.missed": "I couldn't make it",
  "noshow.cursed":
    "The spirits have cursed you! {effect} befalls you for abandoning your quest.",

  // ─── Progression ─────────────────────────────────────────
  "xp.earned": "+{amount} XP",
  "grade.breakthrough":
    "By the ancient chalk... you've ascended to {grade}!",
  "levelup": "LEVEL UP! You've reached Level {level}!",
  "buff.applied": "A blessing upon you! Status: {effect}",

  // ─── Post-Session ────────────────────────────────────────
  "postsession.title": "Quest Complete!",
  "postsession.climb_again": "Climb together again?",
  "postsession.yes": "Yes!",
  "postsession.no": "Not now",
  "postsession.add_to_guild": "Add to guild?",
  "postsession.log_more": "Log More",

  // ─── Wizard Onboarding ───────────────────────────────────
  "wizard.welcome":
    "Ah, a new climber approaches! Let me see... The chalk spirits have chosen a name for you.",
  "wizard.reroll": "Reroll",
  "wizard.accept_name": "That's me!",
  "wizard.grades":
    "What manner of walls do you scale, adventurer?",
  "wizard.gyms":
    "Every adventurer needs a dungeon. Where do you climb?",
  "wizard.invite":
    "One last thing — invite your party! Enter their numbers and I'll send word.",
  "wizard.skip": "Skip for now",
  "wizard.start": "Start Your Quest",

  // ─── Party / Connections ─────────────────────────────────
  "party.guilds": "Guilds",
  "party.connections": "Connections",
  "party.new_guild": "New Guild",
  "party.add_phone": "Add by Phone Number",
  "party.last_session": "Last session: {time}",

  // ─── Character ───────────────────────────────────────────
  "character.title": "Character",
  "character.stats": "Stats",
  "character.total_sessions": "Total Sessions",
  "character.routes_logged": "Routes Logged",
  "character.max_grade": "Max Grade",
  "character.max_boulder": "Max Boulder",
  "character.recent_sends": "Recent Sends",
  "character.grade_history": "Grade History",

  // ─── Empty States ────────────────────────────────────────
  "empty.quests": "No quests ahead.",
  "empty.quests.cta": "Time to rally the party?",
  "empty.board": "No open quests at your gyms.",
  "empty.board.cta": "Post one to the Quest Board?",
  "empty.connections": "Your party is empty.",
  "empty.connections.cta": "Add friends by phone number to get started.",

  // ─── Actions ─────────────────────────────────────────────
  "action.create_raid": "Start a Raid",
  "action.post_quest": "Post to Quest Board",
  "action.join_quest": "Join Quest",
  "action.invite_more": "Invite More",
  "action.cancel_attendance": "Cancel My Attendance",
  "action.take_over": "Take Over",
  "action.leave": "Leave",
  "action.done": "Done",

  // ─── SMS Invite ──────────────────────────────────────────
  "sms.invite":
    "Hey! {name} invited you to climb at {gym} around {time}. {count} others are joining. Join the quest: {link}",
} as const;

export type CopyKey = keyof typeof copy;

/**
 * Interpolate a copy string with values.
 * Usage: t("notif.raid.invite", { name: "Chalk Phantom", gym: "Movement", time: "6pm" })
 */
export function t(
  key: CopyKey,
  values?: Record<string, string | number>
): string {
  let text: string = copy[key];
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

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
  "character.recent": "Recent Sends",
  "character.sessions": "Total Sessions",
  "character.routes": "Routes Logged",
  "character.max_route": "Max Route",

  // ─── Route Logging ──────────────────────────────────────
  "log.title": "Log Climb",
  "log.send": "Send",
  "log.attempt": "Attempt",
  "log.soft": "Soft",
  "log.on_grade": "On Grade",
  "log.hard": "Hard",
  "log.very_hard": "Very Hard",
  "log.button": "Log It",
  "log.success": "+{amount} XP",
  "log.select_grade": "Select a grade",
  "log.difficulty": "How did it feel?",

  // ─── Session Events ────────────────────────────────────
  "event.volume_pr": "Volume PR: {count}x {grade}!",
  "event.tape_earned": "Tape earned!",
  "event.grade_breakthrough": "Grade breakthrough: {grade}!",
  "session.sends": "Sends",
  "session.no_sends": "No climbs logged yet",

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

  // ─── Create Raid Flow ───────────────────────────────────
  "raid.step.gym": "Choose Your Dungeon",
  "raid.step.time": "Set the Hour",
  "raid.step.invite": "Rally Your Party",
  "raid.step.confirm": "Confirm the Raid",
  "raid.gym.empty": "No favorite gyms yet. Add some in Settings!",
  "raid.time.today": "Today",
  "raid.time.tomorrow": "Tomorrow",
  "raid.time.pick_date": "Pick a Date",
  "raid.invite.guilds": "Guilds",
  "raid.invite.connections": "Connections",
  "raid.invite.add_phone": "Add by Phone Number",
  "raid.invite.none_selected": "No one selected yet.",
  "raid.confirm.gym": "Dungeon",
  "raid.confirm.time": "Time",
  "raid.confirm.party": "Party",
  "raid.confirm.send": "Send Invites",
  "raid.confirm.note_placeholder": "Add a note (optional)",
  "raid.confirm.members_count": "{count} adventurers",
  "raid.step.next": "Next",
  "raid.step.back": "Back",
  "raid.quickraid.no_guild": "Create a guild first in the Party tab.",
  "raid.quickraid.no_gym": "Add a favorite gym first in Settings.",

  // ─── Upcoming Sessions ─────────────────────────────────
  "upcoming.accept": "Join",
  "upcoming.decline": "Pass",
  "upcoming.invited": "Invited",
  "upcoming.accepted": "Going",
  "upcoming.you_plus": "You + {count} others",

  // ─── SMS Invite ──────────────────────────────────────────
  "sms.invite":
    "{name} invited you to climb at {gym} around {time} via BelayQuest. {count} others are joining. Details: {link}\n\nReply STOP to opt out. Msg & data rates may apply.",

  // ─── Add People Modal ────────────────────────────────────
  "add_people.title": "Add People",
  "add_people.tab_phone": "Phone",
  "add_people.tab_contacts": "Contacts",
  "add_people.phone_placeholder": "Phone number...",
  "add_people.nickname_placeholder": "Nickname (optional)...",
  "add_people.add": "Add",
  "add_people.done": "Done",
  "add_people.contacts_permission":
    "Allow contacts access to quickly invite your climbing partners.",
  "add_people.contacts_empty": "No contacts with phone numbers found.",
  "add_people.contacts_search": "Search contacts...",
  "add_people.already_connected": "Already connected",
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

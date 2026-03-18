import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ─── Session Lifecycle (every 5 min) ──────────────────────────
// Move open sessions past scheduledAt → active
// Move active sessions 2+ hrs past scheduledAt → completed
// Dissolve leaderless raids past dissolveAt
crons.interval(
  "checkSessionLifecycle",
  { minutes: 5 },
  internal.sessions.checkSessionLifecycle
);

// ─── Session Reminders (every 15 min) ─────────────────────────
// Send push notifications to accepted members 45 min before start
crons.interval(
  "sendSessionReminders",
  { minutes: 15 },
  internal.sessions.sendSessionReminders
);

// ─── No-Show Check (every 15 min) ────────────────────────────
// For sessions completed 1hr+ ago, flag members who never checked in
crons.interval(
  "checkNoShows",
  { minutes: 15 },
  internal.sessions.checkNoShows
);

// ─── Clear Expired Statuses (every hour) ──────────────────────
// Remove buff/debuff status effects that have expired
crons.interval(
  "clearExpiredStatuses",
  { hours: 1 },
  internal.sessions.clearExpiredStatuses
);

// ─── Cleanup Old Sessions (daily) ─────────────────────────────
// Archive sessions older than 30 days
crons.interval(
  "cleanupOldSessions",
  { hours: 24 },
  internal.sessions.cleanupOldSessions
);

export default crons;

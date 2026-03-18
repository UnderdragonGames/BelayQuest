import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { t } from "../lib/copy/en";

// ─── Expo Push API ────────────────────────────────────────────
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
}

async function sendExpoPushMessages(messages: ExpoPushMessage[]) {
  if (messages.length === 0) return;
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(batch),
    });
  }
}

// ─── registerPushToken ────────────────────────────────────────
// Called from frontend when notification permission is granted.
export const registerPushToken = internalMutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { expoPushToken: args.token });
  },
});

// ─── Internal data queries (actions can't access DB directly) ─

export const getRaidInviteData = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const gym = await ctx.db.get(session.gymId);
    const leader = await ctx.db.get(session.leaderId);

    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const invitedTokens: string[] = [];
    for (const m of members) {
      if (m.status !== "invited") continue;
      const user = await ctx.db.get(m.userId);
      if (user?.expoPushToken) invitedTokens.push(user.expoPushToken);
    }

    return {
      leaderName: leader?.generatedName ?? leader?.name ?? "Your ally",
      gymName: gym?.name ?? "the gym",
      scheduledAt: session.scheduledAt,
      invitedTokens,
    };
  },
});

export const getReminderData = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const gym = await ctx.db.get(session.gymId);
    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const accepted = members.filter((m) => m.status === "accepted");
    const acceptedTokens: string[] = [];
    for (const m of accepted) {
      const user = await ctx.db.get(m.userId);
      if (user?.expoPushToken) acceptedTokens.push(user.expoPushToken);
    }

    return {
      gymName: gym?.name ?? "the gym",
      acceptedCount: accepted.length,
      acceptedTokens,
    };
  },
});

export const getQuestJoinData = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    joinedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const gym = await ctx.db.get(session.gymId);
    const creator = await ctx.db.get(session.creatorId);
    const joined = await ctx.db.get(args.joinedUserId);

    return {
      creatorToken: creator?.expoPushToken ?? null,
      joinedName: joined?.generatedName ?? joined?.name ?? "A stranger",
      gymName: gym?.name ?? "the gym",
    };
  },
});

export const getLeaderDesertedData = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const gym = await ctx.db.get(session.gymId);
    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const memberTokens: string[] = [];
    for (const m of members) {
      if (!["accepted", "invited"].includes(m.status)) continue;
      const user = await ctx.db.get(m.userId);
      if (user?.expoPushToken) memberTokens.push(user.expoPushToken);
    }

    return {
      gymName: gym?.name ?? "the gym",
      memberTokens,
    };
  },
});

export const getNoShowWarningData = internalQuery({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const gym = await ctx.db.get(session.gymId);

    return {
      token: user?.expoPushToken ?? null,
      gymName: gym?.name ?? "the gym",
    };
  },
});

export const getUserPushToken = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<string | null> => {
    const user = await ctx.db.get(args.userId);
    return user?.expoPushToken ?? null;
  },
});

// ─── sendRaidInvite ───────────────────────────────────────────
export const sendRaidInvite = internalAction({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.notifications.getRaidInviteData, {
      sessionId: args.sessionId,
    });
    if (!data) return;

    const time = new Date(data.scheduledAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const body = t("notif.raid.invite", {
      name: data.leaderName,
      gym: data.gymName,
      time,
    });

    const messages: ExpoPushMessage[] = data.invitedTokens.map((token) => ({
      to: token,
      title: "Raid Incoming!",
      body,
      sound: "default",
      data: { sessionId: args.sessionId, type: "raid_invite" },
    }));
    await sendExpoPushMessages(messages);
  },
});

// ─── sendSessionReminder ──────────────────────────────────────
export const sendSessionReminder = internalAction({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.notifications.getReminderData, {
      sessionId: args.sessionId,
    });
    if (!data) return;

    const others = Math.max(0, data.acceptedCount - 1);
    const body = t("notif.raid.reminder", {
      gym: data.gymName,
      count: String(others),
    });
    const messages: ExpoPushMessage[] = data.acceptedTokens.map((token) => ({
      to: token,
      title: "Raid in 45 min!",
      body,
      sound: "default",
      data: { sessionId: args.sessionId, type: "session_reminder" },
    }));
    await sendExpoPushMessages(messages);
  },
});

// ─── sendQuestJoin ────────────────────────────────────────────
export const sendQuestJoin = internalAction({
  args: {
    sessionId: v.id("sessions"),
    joinedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.notifications.getQuestJoinData, {
      sessionId: args.sessionId,
      joinedUserId: args.joinedUserId,
    });
    if (!data?.creatorToken) return;

    await sendExpoPushMessages([
      {
        to: data.creatorToken,
        title: "New party member!",
        body: t("notif.quest.join", {
          name: data.joinedName,
          gym: data.gymName,
        }),
        sound: "default",
        data: { sessionId: args.sessionId, type: "quest_join" },
      },
    ]);
  },
});

// ─── sendLeaderDeserted ───────────────────────────────────────
export const sendLeaderDeserted = internalAction({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(
      internal.notifications.getLeaderDesertedData,
      { sessionId: args.sessionId }
    );
    if (!data) return;

    const body = t("notif.leader.deserted.body", { gym: data.gymName });
    const messages: ExpoPushMessage[] = data.memberTokens.map((token) => ({
      to: token,
      title: t("notif.leader.deserted"),
      body,
      sound: "default",
      data: { sessionId: args.sessionId, type: "leader_deserted" },
    }));
    await sendExpoPushMessages(messages);
  },
});

// ─── sendGradeBreakthrough ────────────────────────────────────
export const sendGradeBreakthrough = internalAction({
  args: {
    userId: v.id("users"),
    grade: v.string(),
  },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.notifications.getUserPushToken, {
      userId: args.userId,
    });
    if (!token) return;

    await sendExpoPushMessages([
      {
        to: token,
        title: "Grade Breakthrough!",
        body: t("grade.breakthrough", { grade: args.grade }),
        sound: "default",
        data: { type: "grade_breakthrough", grade: args.grade },
      },
    ]);
  },
});

// ─── sendNoShowWarning ────────────────────────────────────────
export const sendNoShowWarning = internalAction({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(
      internal.notifications.getNoShowWarningData,
      { userId: args.userId, sessionId: args.sessionId }
    );
    if (!data?.token) return;

    await sendExpoPushMessages([
      {
        to: data.token,
        title: "Dark magic stirs...",
        body: t("noshow.warning", { gym: data.gymName }),
        sound: "default",
        data: { sessionId: args.sessionId, type: "no_show_warning" },
      },
    ]);
  },
});

// ─── sendSessionDissolved ─────────────────────────────────────
export const sendSessionDissolved = internalAction({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(
      internal.notifications.getLeaderDesertedData,
      { sessionId: args.sessionId }
    );
    if (!data) return;

    const messages: ExpoPushMessage[] = data.memberTokens.map((token) => ({
      to: token,
      title: "The raid has fallen.",
      body: t("notif.session.dissolved"),
      sound: "default",
      data: { type: "session_dissolved" },
    }));
    await sendExpoPushMessages(messages);
  },
});

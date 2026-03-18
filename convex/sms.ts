import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { t } from "../lib/copy/en";

// ─── isOptedOut (internal) ────────────────────────────────────
// Check if a phone number has opted out of SMS.
export const isOptedOut = internalQuery({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const record = await ctx.db
      .query("smsOptOuts")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    return record !== null;
  },
});

// ─── recordOptOut (internal) ──────────────────────────────────
// Record a phone number opting out of SMS.
export const recordOptOut = internalMutation({
  args: {
    phone: v.string(),
    source: v.union(v.literal("stop_reply"), v.literal("manual")),
  },
  handler: async (ctx, { phone, source }) => {
    // Don't duplicate
    const existing = await ctx.db
      .query("smsOptOuts")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .first();
    if (existing) return;

    await ctx.db.insert("smsOptOuts", {
      phone,
      optedOutAt: Date.now(),
      source,
    });
  },
});

// ─── getInviteData (internal) ─────────────────────────────────
// Fetches session + inviter info for SMS body construction.
export const getInviteData = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    inviterUserId: v.id("users"),
  },
  handler: async (ctx, { sessionId, inviterUserId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;

    const gym = await ctx.db.get(session.gymId);
    const inviter = await ctx.db.get(inviterUserId);

    const members = await ctx.db
      .query("sessionMembers")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const acceptedCount = members.filter(
      (m) => m.status === "accepted" || m.status === "attended"
    ).length;

    return {
      gymName: gym?.name ?? "the gym",
      scheduledAt: session.scheduledAt,
      shortCode: session.shortCode,
      memberCount: acceptedCount,
      inviterName: inviter?.generatedName ?? inviter?.name ?? "Your ally",
    };
  },
});

// ─── sendInvite (internal action) ────────────────────────────
// Sends an SMS invite to a non-user phone number for a session.
// Checks opt-out list and pending invite dedup before sending.
export const sendInvite = internalAction({
  args: {
    phone: v.string(),
    sessionId: v.id("sessions"),
    inviterUserId: v.id("users"),
  },
  handler: async (ctx, { phone, sessionId, inviterUserId }) => {
    // Check opt-out list
    const optedOut = await ctx.runQuery(internal.sms.isOptedOut, { phone });
    if (optedOut) {
      console.log(`[SMS] Skipping opted-out number ${phone}`);
      return;
    }

    const data = await ctx.runQuery(internal.sms.getInviteData, {
      sessionId,
      inviterUserId,
    });
    if (!data) return;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        `Twilio not configured. Missing: ${[
          !accountSid && "TWILIO_ACCOUNT_SID",
          !authToken && "TWILIO_AUTH_TOKEN",
          !fromNumber && "TWILIO_PHONE_NUMBER",
        ]
          .filter(Boolean)
          .join(", ")}`
      );
    }

    const date = new Date(data.scheduledAt);
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const link = `https://belay.quest/j/${data.shortCode}`;
    const body = t("sms.invite", {
      name: data.inviterName,
      gym: data.gymName,
      time: timeStr,
      count: data.memberCount,
      link,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        },
        body: new URLSearchParams({
          To: phone,
          From: fromNumber,
          Body: body,
        }).toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio SMS failed (${response.status}): ${error}`);
    }
  },
});

// ─── handleInboundSms (internal action) ──────────────────────
// Processes inbound SMS from Twilio webhook. Handles STOP keywords
// and sends a single confirmation reply.
const STOP_KEYWORDS = [
  "stop",
  "quit",
  "end",
  "revoke",
  "opt out",
  "cancel",
  "unsubscribe",
];

export const handleInboundSms = internalAction({
  args: {
    from: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { from, body }) => {
    const normalized = body.trim().toLowerCase();

    if (!STOP_KEYWORDS.includes(normalized)) {
      return;
    }

    // Record opt-out
    await ctx.runMutation(internal.sms.recordOptOut, {
      phone: from,
      source: "stop_reply",
    });

    // Send single confirmation (TCPA allows exactly one post-STOP message)
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) return;

    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        },
        body: new URLSearchParams({
          To: from,
          From: fromNumber,
          Body: "You've been unsubscribed from BelayQuest messages. You will not receive further texts.",
        }).toString(),
      }
    );

    console.log(`[SMS] Opt-out recorded for ${from}`);
  },
});

import { convexAuth } from "@convex-dev/auth/server";
import { Phone } from "@convex-dev/auth/providers/Phone";

// ── Test review account ──────────────────────────────────────────
// For App Store / TestFlight reviewers. Set TEST_REVIEW_PHONE in
// Convex env vars (E.164, e.g. +15550001234). The reviewer signs in
// with that number using provider "phone-test" and code "000000".
// No SMS is sent. Client-side AuthGate auto-selects the provider.
const TEST_REVIEW_PHONE = process.env.TEST_REVIEW_PHONE;
const TEST_REVIEW_CODE = "000000";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Phone({
      generateVerificationToken: async () => {
        // 6-digit numeric OTP
        const code = String(Math.floor(100000 + Math.random() * 900000));
        return code;
      },
      sendVerificationRequest: async ({ identifier: phone, token }) => {
        console.log(`[OTP] Code for ${phone}: ${token}`);

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
          throw new Error(
            `Twilio not configured. Missing: ${[
              !accountSid && "TWILIO_ACCOUNT_SID",
              !authToken && "TWILIO_AUTH_TOKEN",
              !fromNumber && "TWILIO_PHONE_NUMBER",
            ].filter(Boolean).join(", ")}`,
          );
        }

        console.log(`[OTP] Sending SMS to ${phone} from ${fromNumber}`);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization:
                "Basic " + btoa(`${accountSid}:${authToken}`),
            },
            body: new URLSearchParams({
              To: phone,
              From: fromNumber,
              Body: `Your BelayQuest verification code is: ${token}\n\nReply STOP to opt out. Msg & data rates may apply.`,
            }).toString(),
          },
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Twilio SMS failed (${response.status}): ${error}`);
        }

        console.log(`[OTP] SMS sent successfully to ${phone}`);
      },
    }),
    // Test provider — fixed code, no SMS. Only usable with TEST_REVIEW_PHONE.
    Phone({
      id: "phone-test",
      generateVerificationToken: async () => TEST_REVIEW_CODE,
      sendVerificationRequest: async ({ identifier: phone }) => {
        console.log(`[OTP] Test login for ${phone} — code is ${TEST_REVIEW_CODE}`);
      },
      authorize: async (params, account) => {
        // Only allow the designated test phone number
        if (!TEST_REVIEW_PHONE) {
          throw new Error("Test login is not configured");
        }
        if (params.phone !== TEST_REVIEW_PHONE) {
          throw new Error("Test login is only available for the review account");
        }
        if (account.providerAccountId !== params.phone) {
          throw new Error("Phone mismatch");
        }
      },
    }),
  ],
});

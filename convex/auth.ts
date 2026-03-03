import { convexAuth } from "@convex-dev/auth/server";
import { Phone } from "@convex-dev/auth/providers/Phone";

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
              Body: `Your BelayQuest code is: ${token}`,
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
  ],
});

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// ─── Apple Universal Links association file ──────────────────
// Replace TEAM_ID below with the actual Apple Developer Team ID
// (found at https://developer.apple.com/account → Membership Details)
http.route({
  path: "/.well-known/apple-app-site-association",
  method: "GET",
  handler: httpAction(async () => {
    const aasa = {
      applinks: {
        apps: [],
        details: [
          {
            appID: "TEAM_ID.quest.belay.app",
            paths: ["/j/*"],
          },
        ],
      },
    };
    return new Response(JSON.stringify(aasa), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ─── Android App Links association file ──────────────────────
// Replace FINGERPRINT_PLACEHOLDER with the SHA-256 fingerprint of
// the signing certificate (get via: keytool -list -v -keystore <keystore>
// or from Play Console → Setup → App signing → SHA-256 certificate fingerprint)
http.route({
  path: "/.well-known/assetlinks.json",
  method: "GET",
  handler: httpAction(async () => {
    const assetlinks = [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "quest.belay.app",
          sha256_cert_fingerprints: ["FINGERPRINT_PLACEHOLDER"],
        },
      },
    ];
    return new Response(JSON.stringify(assetlinks), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ─── Twilio inbound SMS webhook ───────────────────────────────
// Handles STOP/opt-out replies. Configure in Twilio console:
// Messaging → Phone Number → Webhook URL → POST to this endpoint.
http.route({
  path: "/twilio/inbound",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const formData = await request.text();
    const params = new URLSearchParams(formData);
    const from = params.get("From");
    const body = params.get("Body");

    if (from && body) {
      await ctx.runAction(internal.sms.handleInboundSms, { from, body });
    }

    // Twilio expects TwiML response (empty response = no reply)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } }
    );
  }),
});

// OG image: static fallback for 404 / missing sessions
const OG_IMAGE_FALLBACK =
  "https://belayquest.com/assets/images/homepage/BelayQuestComposite.jpg";

// ─── Helpers ──────────────────────────────────────────────────

/** Escape text for safe embedding in SVG/XML */
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Format scheduledAt into { dateStr, timeStr } for display */
function formatSessionDate(scheduledAt: number) {
  const date = new Date(scheduledAt);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return { dateStr, timeStr };
}

/** Generate a 1200x630 OG image as SVG for a raid/quest session */
function generateOgSvg(session: {
  type: string;
  gymName: string;
  scheduledAt: number;
  memberCount: number;
  note?: string | null;
}): string {
  const { dateStr, timeStr } = formatSessionDate(session.scheduledAt);
  const label = session.type === "raid" ? "RAID" : "QUEST";
  const gymName = xmlEscape(session.gymName);
  const dateTime = xmlEscape(`${dateStr} · ${timeStr}`);
  const adventurers = `${session.memberCount} adventurer${session.memberCount !== 1 ? "s" : ""} going`;
  const noteLine = session.note
    ? `<text x="600" y="460" text-anchor="middle" fill="#b8a080" font-family="Georgia, serif" font-style="italic" font-size="28">&quot;${xmlEscape(session.note)}&quot;</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <!-- Background -->
  <rect width="1200" height="630" fill="#2a1f14"/>

  <!-- Border frame -->
  <rect x="20" y="20" width="1160" height="590" rx="12" fill="none" stroke="#5c4a32" stroke-width="3"/>
  <rect x="32" y="32" width="1136" height="566" rx="8" fill="none" stroke="#3d2e1c" stroke-width="1.5"/>

  <!-- Crossed swords decorative element -->
  <text x="600" y="160" text-anchor="middle" font-size="72">⚔️</text>

  <!-- Label -->
  <text x="600" y="230" text-anchor="middle" fill="#f4a261" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="40" letter-spacing="12">${label}</text>

  <!-- Gym name -->
  <text x="600" y="310" text-anchor="middle" fill="#eaeaea" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="52">${gymName}</text>

  <!-- Date and time -->
  <text x="600" y="370" text-anchor="middle" fill="#d4c4a0" font-family="'Helvetica Neue', Arial, sans-serif" font-size="34">${dateTime}</text>

  <!-- Note (optional) -->
  ${noteLine}

  <!-- Adventurer count -->
  <text x="600" y="${session.note ? "520" : "460"}" text-anchor="middle" fill="#999" font-family="'Helvetica Neue', Arial, sans-serif" font-size="30">${adventurers}</text>
</svg>`;
}

// ─── Session share page with OG meta tags + dynamic OG image ──
http.route({
  pathPrefix: "/j/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/j\//, "");

    // ── Route: /j/{shortCode}/og.svg → dynamic OG image ──
    const svgMatch = path.match(/^([^/]+)\/og\.svg$/);
    if (svgMatch) {
      const shortCode = svgMatch[1];
      const session = await ctx.runQuery(internal.sessions.getByShortCode, {
        shortCode,
      });

      if (!session) {
        return new Response("Not found", { status: 404 });
      }

      const svg = generateOgSvg(session);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // ── Route: /j/{shortCode} → HTML with OG meta tags ───
    const shortCode = path.replace(/\/$/, "");

    if (!shortCode) {
      return new Response("Not found", { status: 404 });
    }

    const session = await ctx.runQuery(internal.sessions.getByShortCode, {
      shortCode,
    });

    if (!session) {
      const html = `<!DOCTYPE html>
<html><head>
  <meta property="og:title" content="Belay Quest" />
  <meta property="og:description" content="Find your climbing party." />
  <meta property="og:image" content="${OG_IMAGE_FALLBACK}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
</head><body>
  <p>Session not found. <a href="https://belayquest.com">Go to Belay Quest</a></p>
</body></html>`;
      return new Response(html, {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    const { dateStr, timeStr } = formatSessionDate(session.scheduledAt);

    const title =
      session.type === "raid"
        ? `Raid at ${session.gymName}`
        : `Quest at ${session.gymName}`;
    const description = `${dateStr} at ${timeStr} · ${session.memberCount} adventurer${session.memberCount !== 1 ? "s" : ""} going${session.note ? ` · "${session.note}"` : ""}`;

    const ogImage = `${url.origin}/j/${shortCode}/og.svg`;
    const deepLink = `belayquest://j/${shortCode}`;

    const spotsText =
      session.capacity != null
        ? `${session.capacity - session.memberCount} spots remaining`
        : `${session.memberCount} adventurer${session.memberCount !== 1 ? "s" : ""} going`;

    const memberRows = session.members
      .map(
        (m) =>
          `<div class="member-row">
            <span class="member-icon">⚔</span>
            <span class="member-name">${xmlEscape(m.name)}</span>
            <span class="member-level">Lv ${m.level}</span>
          </div>`
      )
      .join("");

    const noteHtml = session.note
      ? `<div class="note">"${xmlEscape(session.note)}"</div>`
      : "";

    const label = session.type === "raid" ? "RAID" : "QUEST";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${xmlEscape(title)} — Belay Quest</title>

  <!-- Open Graph -->
  <meta property="og:title" content="${xmlEscape(title)}" />
  <meta property="og:description" content="${xmlEscape(description)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url.href}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${xmlEscape(title)}" />
  <meta name="twitter:description" content="${xmlEscape(description)}" />
  <meta name="twitter:image" content="${ogImage}" />

  <!-- Apple Universal Links -->
  <meta name="apple-itunes-app" content="app-id=APPLE_APP_ID, app-argument=${deepLink}" />

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #2a1f14;
      color: #e8d5b0;
      font-family: 'Georgia', serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 48px;
    }
    .logo {
      font-size: 13px;
      letter-spacing: 3px;
      color: #8a7050;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    .card {
      background: #3d2e1c;
      border: 2px solid #5c4a32;
      border-radius: 4px;
      width: 100%;
      max-width: 420px;
      padding: 28px 24px;
    }
    .label {
      font-size: 11px;
      letter-spacing: 4px;
      color: #f4a261;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .gym-name {
      font-size: 28px;
      font-weight: bold;
      color: #eaeaea;
      margin-bottom: 6px;
      line-height: 1.2;
    }
    .datetime {
      font-size: 15px;
      color: #b8a080;
      margin-bottom: 20px;
    }
    .note {
      font-style: italic;
      font-size: 14px;
      color: #9a8060;
      margin-bottom: 16px;
    }
    .divider {
      border: none;
      border-top: 1px solid #5c4a32;
      margin: 16px 0;
    }
    .party-header {
      font-size: 11px;
      letter-spacing: 3px;
      color: #f4a261;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .member-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
      border-bottom: 1px solid #4a3828;
    }
    .member-row:last-child { border-bottom: none; }
    .member-icon { color: #f4a261; font-size: 14px; }
    .member-name { flex: 1; font-size: 15px; color: #e8d5b0; }
    .member-level { font-size: 12px; color: #8a7050; }
    .spots {
      margin-top: 12px;
      font-size: 13px;
      color: #8a7050;
      text-align: center;
    }
    .cta-section {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      max-width: 420px;
    }
    .btn-open {
      display: block;
      background: #f4a261;
      color: #2a1f14;
      text-align: center;
      font-family: 'Georgia', serif;
      font-weight: bold;
      font-size: 16px;
      letter-spacing: 2px;
      padding: 14px;
      border-radius: 3px;
      text-decoration: none;
      text-transform: uppercase;
    }
    .btn-open:hover { background: #e8915a; }
    .store-row {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    .btn-store {
      flex: 1;
      display: block;
      background: #2a1f14;
      border: 1px solid #5c4a32;
      color: #b8a080;
      text-align: center;
      font-size: 13px;
      padding: 10px 8px;
      border-radius: 3px;
      text-decoration: none;
    }
    .btn-store:hover { border-color: #f4a261; color: #e8d5b0; }
    .footer {
      margin-top: 32px;
      font-size: 11px;
      color: #5c4a32;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="logo">⚔ Belay Quest ⚔</div>

  <div class="card">
    <div class="label">${label}</div>
    <div class="gym-name">${xmlEscape(session.gymName)}</div>
    <div class="datetime">${xmlEscape(dateStr)} · ${xmlEscape(timeStr)}</div>
    ${noteHtml}

    <hr class="divider" />

    <div class="party-header">Party</div>
    ${memberRows}
    <div class="spots">${xmlEscape(spotsText)}</div>
  </div>

  <div class="cta-section">
    <a class="btn-open" href="${deepLink}">Open in App</a>
    <div class="store-row">
      <a class="btn-store" href="https://apps.apple.com/app/belayquest/id0000000000">App Store</a>
      <a class="btn-store" href="https://play.google.com/store/apps/details?id=quest.belay.app">Google Play</a>
    </div>
  </div>

  <div class="footer">Don't have the app? Download Belay Quest to join the adventure.</div>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }),
});

export default http;

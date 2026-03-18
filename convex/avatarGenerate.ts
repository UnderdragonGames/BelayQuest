"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { PNG } from "pngjs";

// ─── Skin tone to text ─────────────────────────────────────────────────────
const SKIN_TONE_TEXT = {
  1: "light skin",
  2: "medium skin",
  3: "dark skin",
} as const;

// ─── Hex color to closest descriptive name ────────────────────────────────
const COLOR_NAMES: [string, string][] = [
  ["#1a1010", "near black"],
  ["#4a4a4a", "dark grey"],
  ["#8a8a8a", "grey"],
  ["#c0c0c0", "silver"],
  ["#4a3020", "dark brown"],
  ["#7a5a38", "brown"],
  ["#c4882a", "golden"],
  ["#2a3060", "navy blue"],
  ["#4a6a8a", "steel blue"],
  ["#2a6a4a", "forest green"],
  ["#6a2a2a", "dark red"],
  ["#8a6a2a", "olive"],
  ["#6a2a6a", "purple"],
  ["#c4a882", "tan"],
  ["#e0c8a0", "cream"],
  ["#e8e8e8", "white"],
];

function colorName(hex: string): string {
  const h = hex.toLowerCase();
  const found = COLOR_NAMES.find(([k]) => k === h);
  if (found) return found[1];
  return hex;
}

// ─── Build prompt from avatar defaults ───────────────────────────────────
function buildPrompt(avatar: {
  hair: "medium" | "hat";
  hairColor: string;
  skinTone: 1 | 2 | 3;
  glasses: boolean;
  glassesColor?: string;
  shirtColor: string;
  pantsType: "pants" | "shorts";
  pantsColor: string;
  harness: boolean;
  harnessColor?: string;
  shoeColor: string;
}): string {
  const parts: string[] = [
    "pixel art RPG adventurer character",
    SKIN_TONE_TEXT[avatar.skinTone],
  ];

  if (avatar.hair === "hat") {
    parts.push(`${colorName(avatar.hairColor)} hat`);
  } else {
    parts.push(`${colorName(avatar.hairColor)} hair`);
  }

  if (avatar.glasses && avatar.glassesColor) {
    parts.push(`${colorName(avatar.glassesColor)} glasses`);
  }

  parts.push(`${colorName(avatar.shirtColor)} shirt`);
  parts.push(
    `${colorName(avatar.pantsColor)} ${avatar.pantsType === "pants" ? "pants" : "shorts"}`
  );

  if (avatar.harness && avatar.harnessColor) {
    parts.push(`${colorName(avatar.harnessColor)} climbing harness`);
  }

  parts.push(`${colorName(avatar.shoeColor)} climbing shoes`);
  parts.push("south facing, low top-down view, chibi proportions");

  return parts.join(", ");
}

// ─── Nearest-neighbor upscale ──────────────────────────────────────────────
function upscaleNearest(pngBuffer: Buffer, scale: number): Buffer {
  const src = PNG.sync.read(pngBuffer);
  const dst = new PNG({ width: src.width * scale, height: src.height * scale });
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const sx = Math.floor(x / scale);
      const sy = Math.floor(y / scale);
      const si = (sy * src.width + sx) * 4;
      const di = (y * dst.width + x) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
  return PNG.sync.write(dst);
}

// ─── generateAvatar (public action) ──────────────────────────────────────
export const generateAvatar = action({
  args: {
    hair: v.union(v.literal("medium"), v.literal("hat")),
    hairColor: v.string(),
    skinTone: v.union(v.literal(1), v.literal(2), v.literal(3)),
    glasses: v.boolean(),
    glassesColor: v.optional(v.string()),
    shirtColor: v.string(),
    pantsType: v.union(v.literal("pants"), v.literal("shorts")),
    pantsColor: v.string(),
    harness: v.boolean(),
    harnessColor: v.optional(v.string()),
    shoeColor: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const apiKey = process.env.PIXELLAB_API_KEY;
    if (!apiKey) throw new Error("PIXELLAB_API_KEY not configured");

    const prompt = buildPrompt(args);

    // Call PixelLab Bitforge API
    const response = await fetch("https://api.pixellab.ai/v1/generate-image-bitforge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: prompt,
        image_size: { width: 48, height: 48 },
        no_background: true,
        text_guidance_scale: 5,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PixelLab API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const b64 = data.image?.base64 as string;
    if (!b64) throw new Error("No image in PixelLab response");

    // Decode base64 PNG, upscale 3x with nearest-neighbor, re-encode
    const raw = b64.startsWith("data:") ? b64.split(",", 2)[1] : b64;
    const smallBuf = Buffer.from(raw, "base64");
    const scaledBuf = upscaleNearest(smallBuf, 3);
    const blob = new Blob([new Uint8Array(scaledBuf)], { type: "image/png" });

    // Upload to Convex storage
    const uploadUrl = await ctx.storage.generateUploadUrl();
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: blob,
    });
    if (!uploadRes.ok) {
      throw new Error(`Storage upload failed: ${uploadRes.status}`);
    }
    const { storageId } = await uploadRes.json();

    // Persist storageId and return serving URL
    const avatarUrl = await ctx.runMutation(internal.avatars.saveAvatarStorageId, {
      userId,
      storageId,
    });

    return avatarUrl ?? "";
  },
});

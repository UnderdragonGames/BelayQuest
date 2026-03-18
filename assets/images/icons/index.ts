/**
 * RPG pixel-art icon sprites for BelayQuest.
 *
 * Usage:
 *   import { ICONS, IconName } from "@/assets/images/icons";
 *   <Image source={ICONS.boulder} style={{ width: 32, height: 32 }} />
 *
 * All icons are 128px max dimension, lossless webp with transparent backgrounds.
 * Use resizeMode="contain" and Image.NEAREST for crisp pixel-art rendering.
 */

export const ICONS = {
  alert: require("./alert.webp"),
  backpack: require("./backpack.webp"),
  bell: require("./bell.webp"),
  boulder: require("./boulder.webp"),
  chalkbag: require("./chalkbag.webp"),
  chat: require("./chat.webp"),
  checkmark: require("./checkmark.webp"),
  compass: require("./compass.webp"),
  crown: require("./crown.webp"),
  flag: require("./flag.webp"),
  footprints: require("./footprints.webp"),
  gear: require("./gear.webp"),
  hand: require("./hand.webp"),
  handshake: require("./handshake.webp"),
  helmet: require("./helmet.webp"),
  back: require("./back.webp"),
  hourglass: require("./hourglass.webp"),
  key: require("./key.webp"),
  cam: require("./cam.webp"),
  magnifier: require("./magnifier.webp"),
  plus: require("./plus.webp"),
  potion: require("./potion.webp"),
  rope: require("./rope.webp"),
  scroll: require("./scroll.webp"),
  shield: require("./shield.webp"),
  shoe: require("./shoe.webp"),
  signpost: require("./signpost.webp"),
  skull: require("./skull.webp"),
  star: require("./star.webp"),
  swords: require("./swords.webp"),
} as const;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/**
 * Stonebase UI elements for BelayQuest.
 *
 * Usage:
 *   import { UI, UiAssetName } from "@/assets/images/ui";
 *   <Image source={UI.itemSlot} style={{ width: 54, height: 54 }} />
 *
 * All assets are lossless webp, pre-scaled 3x with nearest-neighbor from the
 * Stonebase UI sprite sheet. Render at natural size (no runtime scaling).
 */

export const UI = {
  // ── Action Bars ──────────────────────────────────────────────
  actionBarBottom: require("./ActionBarBottom.webp"), // 82x27 -> 246x81
  actionBarBottomLeft: require("./ActionBarBottomLeft.webp"), // L=96x81 (cols 0..31 at 1x)
  actionBarBottomMid: require("./ActionBarBottomMid.webp"), // mid=39x81 (cols 32..44 at 1x)
  actionBarBottomRight: require("./ActionBarBottomRight.webp"), // R=111x81 (cols 45..81 at 1x)
  actionBarCenter: require("./ActionBarCenter.webp"), // 27x21 -> 81x63
  actionBarEnd: require("./ActionBarEnd.webp"), // 27x31 -> 81x93
  actionBarLeft: require("./ActionBarLeft.webp"), // 27x82 -> 81x246
  // 3-col × 3-row: cap(36)|stretch(12)|cap(33), rows 0..5|6..22|23..81
  ablT1: require("./ABL_T1.webp"), ablT2: require("./ABL_T2.webp"), ablT3: require("./ABL_T3.webp"),
  ablM1: require("./ABL_M1.webp"), ablM2: require("./ABL_M2.webp"), ablM3: require("./ABL_M3.webp"),
  ablB1: require("./ABL_B1.webp"), ablB2: require("./ABL_B2.webp"), ablB3: require("./ABL_B3.webp"),
  actionBarRight: require("./ActionBarRight.webp"), // 27x82 -> 81x246
  // 3-col × 3-row: cap(33)|stretch(12)|cap(36), rows 0..5|6..22|23..81
  abrT1: require("./ABR_T1.webp"), abrT2: require("./ABR_T2.webp"), abrT3: require("./ABR_T3.webp"),
  abrM1: require("./ABR_M1.webp"), abrM2: require("./ABR_M2.webp"), abrM3: require("./ABR_M3.webp"),
  abrB1: require("./ABR_B1.webp"), abrB2: require("./ABR_B2.webp"), abrB3: require("./ABR_B3.webp"),
  actionBarStart: require("./ActionBarStart.webp"), // 27x31 -> 81x93

  // ── Action Boxes ─────────────────────────────────────────────
  actionBox24x24: require("./ActionBox24x24.webp"), // 24x24 -> 72x72
  actionBox33x34: require("./ActionBox33x34.webp"), // 33x34 -> 99x102
  actionBoxWood24x24: require("./ActionBoxWood24x24.webp"), // 24x24 -> 72x72
  actionBoxWood33x34: require("./ActionBoxWood33x34.webp"), // 33x34 -> 99x102

  // ── Arrows ───────────────────────────────────────────────────
  arrowDown: require("./ArrowDown.webp"), // 13x12 -> 39x36
  arrowDownDown: require("./ArrowDownDown.webp"), // 13x12 -> 39x36
  arrowLeft: require("./ArrowLeft.webp"), // 11x13 -> 33x39
  arrowLeftDown: require("./ArrowLeftDown.webp"), // 11x13 -> 33x39
  arrowRight: require("./ArrowRight.webp"), // 11x13 -> 33x39
  arrowRightDown: require("./ArrowRightDown.webp"), // 11x13 -> 33x39
  arrowUp: require("./ArrowUp.webp"), // 13x12 -> 39x36
  arrowUpDown: require("./ArrowUpDown.webp"), // 13x12 -> 39x36

  // ── Backgrounds ──────────────────────────────────────────────
  blockBackgroundBrown: require("./BlockBackgroundBrown.webp"), // 11x9 -> 33x27
  blockBackgroundMuddyYellow: require("./BlockBackgroundMuddyYellow.webp"), // 11x9 -> 33x27
  blockBackgroundMudgreen: require("./BlockBackgroundMudgreen.webp"), // 20x12 -> 60x36
  blockBackgroundRed: require("./BlockBackgroundRed.webp"), // 20x12 -> 60x36
  checkeredBG: require("./CheckeredBG.webp"), // 8x8 -> 24x24
  mapParchment128: require("./mapParchment128.webp"), // 128x128 -> 384x384
  parchmentTexture64: require("./parchmentTexture64.webp"), // 64x64 -> 192x192
  plainBackgroundRecolorable: require("./PlainBackgroundRecolorable.webp"), // 16x16 -> 48x48
  transparentBackgroundBlue: require("./TransparentBackgroundBlue.webp"), // 16x16 -> 48x48
  transparentBackgroundOrange: require("./TransparentBackgroundOrange.webp"), // 16x16 -> 48x48

  // ── Bars & Meters ────────────────────────────────────────────
  barLeft: require("./BarLeft.webp"),
  barMid: require("./BarMid.webp"),
  barRight: require("./BarRight.webp"),
  healthBarMetalBorder: require("./HealthBarMetalBorder.webp"), // 32x8 -> 96x24
  healthVertical: require("./HealthVertical.webp"), // 6x2 -> 18x6
  healthVerticalBody: require("./HealthVerticalBody.webp"), // 18x3
  healthVerticalHighlight: require("./HealthVerticalHighlight.webp"), // 18x3
  lifeHorizontal: require("./LifeHorizontal.webp"), // 2x3 -> 6x9
  lifeHorizontalBody: require("./LifeHorizontalBody.webp"), // 3x9
  lifeHorizontalHighlight: require("./LifeHorizontalHighlight.webp"), // 3x9
  lifeFill: require("./LifeFill.webp"),
  lifeFillBody: require("./LifeFillBody.webp"), // 3x9
  lifeFillHighlight: require("./LifeFillHighlight.webp"), // 3x9
  manaVertical: require("./ManaVertical.webp"), // 6x2 -> 18x6
  manaVerticalBody: require("./ManaVerticalBody.webp"), // 18x3
  manaVerticalHighlight: require("./ManaVerticalHighlight.webp"), // 18x3
  resourceVialVertical: require("./ResourceVialVertical.webp"), // 12x24 -> 36x72
  slider: require("./Slider.webp"), // 14x7 -> 42x21
  sliderTrack: require("./SliderTrack.webp"), // 7x3 -> 21x9
  sliderTrackLeft: require("./SliderTrackLeft.webp"), // L=6x9
  sliderTrackMid: require("./SliderTrackMid.webp"), // mid=6x9
  sliderTrackRight: require("./SliderTrackRight.webp"), // R=9x9
  staminaVertical: require("./StaminaVertical.webp"), // 6x2 -> 18x6
  staminaVerticalBody: require("./StaminaVerticalBody.webp"), // 18x3
  staminaVerticalHighlight: require("./StaminaVerticalHighlight.webp"), // 18x3
  yellowResourceVertical: require("./YellowResourceVertical.webp"), // 6x2 -> 18x6
  yellowResourceVerticalBody: require("./YellowResourceVerticalBody.webp"), // 18x3
  yellowResourceVerticalHighlight: require("./YellowResourceVerticalHighlight.webp"), // 18x3

  // ── Buttons ──────────────────────────────────────────────────
  emeraldButton3x: require("./EmeraldButton3x.webp"), // 40x21 -> 120x63
  emeraldButtonDown3x: require("./EmeraldButtonDown3x.webp"), // 40x21 -> 120x63
  stoneButton: require("./StoneButton.webp"), // 16x16 -> 48x48
  stoneButtonDown: require("./StoneButtonDown.webp"), // 16x16 -> 48x48
  stoneBtnLeft: require("./StoneBtnLeft.webp"),
  stoneBtnMid: require("./StoneBtnMid.webp"),
  stoneBtnRight: require("./StoneBtnRight.webp"),
  stoneBtnDownLeft: require("./StoneBtnDownLeft.webp"),
  stoneBtnDownMid: require("./StoneBtnDownMid.webp"),
  stoneBtnDownRight: require("./StoneBtnDownRight.webp"),
  tinyButton: require("./TinyButton.webp"), // 9x9 -> 27x27
  tinyButtonDown: require("./TinyButtonDown.webp"), // 9x9 -> 27x27

  // ── Decorations ──────────────────────────────────────────────
  cog: require("./Cog.webp"), // 12x12 -> 36x36
  divider: require("./Divider.webp"), // 65x6 -> 195x18
  dragonheadLeft: require("./DragonheadLeft.webp"), // 46x31 -> 138x93
  dragonheadRight: require("./DragonheadRight.webp"), // 46x31 -> 138x93
  metalBracketLeft: require("./MetalBracketLeft.webp"), // 36x13 -> 108x39
  metalBracketRight: require("./MetalBracketRight.webp"), // 36x13 -> 108x39
  metalKnob: require("./MetalKnob.webp"), // 2x2 -> 6x6
  stoneTablet: require("./StoneTablet.webp"), // 77x24 -> 231x72
  thinDivider: require("./ThinDivider.webp"), // 48x5 -> 144x15
  woodTileDecorated: require("./WoodTileDecorated.webp"), // 31x13 -> 93x39

  // ── Face Buttons ─────────────────────────────────────────────
  faceButtonBlue: require("./FaceButtonBlue.webp"), // 13x14 -> 39x42
  faceButtonBlueDown: require("./FaceButtonBlueDown.webp"), // 13x13 -> 39x39
  faceButtonGreen: require("./FaceButtonGreen.webp"), // 13x14 -> 39x42
  faceButtonGreenDown: require("./FaceButtonGreenDown.webp"), // 13x13 -> 39x39
  faceButtonLetterA: require("./FaceButtonLetterA.webp"), // 7x7 -> 21x21
  faceButtonLetterB: require("./FaceButtonLetterB.webp"), // 7x7 -> 21x21
  faceButtonLetterX: require("./FaceButtonLetterX.webp"), // 7x7 -> 21x21
  faceButtonLetterY: require("./FaceButtonLetterY.webp"), // 7x7 -> 21x21
  faceButtonRed: require("./FaceButtonRed.webp"), // 13x14 -> 39x42
  faceButtonRedDown: require("./FaceButtonRedDown.webp"), // 13x13 -> 39x39
  faceButtonYellow: require("./FaceButtonYellow.webp"), // 13x14 -> 39x42
  faceButtonYellowDown: require("./FaceButtonYellowDown.webp"), // 13x14 -> 39x42

  // ── Frames ───────────────────────────────────────────────────
  basicFrameGrayscale: require("./BasicFrameGrayscale.webp"), // 40x40 -> 120x120
  chunkyFrame: require("./ChunkyFrame.webp"), // 48x24 -> 144x72
  circleFrame24: require("./CircleFrame24.webp"), // 24x24 -> 72x72
  decoratedSquare: require("./DecoratedSquare3x.webp"), // 26x26 -> 78x78
  goldPcircleFrame: require("./GoldPcircleFrame.webp"), // 19x19 -> 57x57
  intricateFrame: require("./IntricateFrame.webp"), // 40x42 -> 120x126
  metalFrame: require("./MetalFrame.webp"), // 44x32 -> 132x96
  parchmentFrameDecoratedA: require("./ParchmentFrameDecoratedA.webp"), // 32x32 -> 96x96
  parchmentFrameDecoratedB: require("./ParchmentFrameDecoratedB.webp"), // 32x32 -> 96x96
  parchmentFrameSmallA: require("./ParchmentFrameSmallA.webp"), // 28x28 -> 84x84
  parchmentFrameSmallB: require("./ParchmentFrameSmallB.webp"), // 28x28 -> 84x84
  roundedCorner: require("./RoundedCorner.webp"), // 16x17 -> 48x51
  smallFrame: require("./SmallFrame.webp"), // 24x24 -> 72x72

  // ── Item Slots ───────────────────────────────────────────────
  itemSlot: require("./ItemSlot.webp"), // 18x18 -> 54x54
  itemSlotCheckeredBG: require("./ItemSlotCheckeredBG.webp"), // 18x18 -> 54x54
  itemSlotStone: require("./ItemSlotStone.webp"), // 18x18 -> 54x54

  // ── Large Stone Borders ──────────────────────────────────────
  largeStoneBottomCenter: require("./LargeStoneBottomCenter.webp"), // 104x32 -> 312x96
  largeStoneTopCenter: require("./LargeStoneTopCenter.webp"), // 104x32 -> 312x96
  stoneWoodBorderBottom320: require("./StoneWoodBorderBottom320.webp"), // 320x32 -> 960x96
  stoneWoodBorderLeft180: require("./StoneWoodBorderLeft180.webp"), // 32x180 -> 96x540
  stoneWoodBorderRight180: require("./StoneWoodBorderRight180.webp"), // 32x180 -> 96x540
  stoneWoodBorderTop320: require("./StoneWoodBorderTop320.webp"), // 320x32 -> 960x96

  // ── Containers ───────────────────────────────────────────────
  actionBox: require("./ActionBox24x24.webp"),
  actionBoxWood: require("./ActionBoxWood24x24.webp"),
  paperBox: require("./PaperBox.webp"), // 59x45 -> 177x135
  tinyBox: require("./TinyBox.webp"), // 12x12 -> 36x36

  // ── Portraits ────────────────────────────────────────────────
  paperdoll: require("./Paperdoll.webp"), // 41x56 -> 123x168
  portrait: require("./Portrait.webp"), // 29x30 -> 87x90
  portraitPlain: require("./PortraitPlain.webp"), // 24x22 -> 72x66

  // ── Scrolls & Banners ────────────────────────────────────────
  bannerLeft: require("./BannerLeft.webp"),
  bannerMid: require("./BannerMid.webp"),
  bannerRight: require("./BannerRight.webp"),
  pergamentHeader: require("./PergamentHeader.webp"), // 61x19 -> 183x57
  scroll: require("./Scroll.webp"), // 96x40 -> 288x120
  scrollHanging: require("./ScrollHanging.webp"), // 84x51 -> 252x153
  scrollLeft: require("./ScrollLeft.webp"),
  scrollMid: require("./ScrollMid.webp"),
  scrollRight: require("./ScrollRight.webp"),
  scrollSmallA: require("./ScrollSmallA.webp"), // 56x25 -> 168x75
  scrollSmallB: require("./ScrollSmallB.webp"), // 56x24 -> 168x72
  scrollSmallC: require("./ScrollSmallC.webp"), // 56x23 -> 168x69

  // ── Sprite Icons (from sheet) ────────────────────────────────
  iconChest: require("./IconChest.webp"), // 15x14 -> 45x42
  iconCompass: require("./IconCompass.webp"), // 16x16 -> 48x48
  iconCross: require("./IconCross.webp"), // 14x14 -> 42x42
  iconEmerald: require("./IconEmerald.webp"), // 9x15 -> 27x45
  iconExclamation: require("./IconExclamation.webp"), // 6x14 -> 18x42
  iconGoldCoin: require("./IconGoldCoin.webp"), // 10x10 -> 30x30
  iconGoldPile: require("./IconGoldPile.webp"), // 12x9 -> 36x27
  iconMapmarker: require("./IconMapmarker.webp"), // 10x15 -> 30x45
  iconMedallion: require("./IconMedallion.webp"), // 15x16 -> 45x48
  iconQuestion: require("./IconQuestion.webp"), // 10x14 -> 30x42
  iconSkull: require("./IconSkull.webp"), // 13x14 -> 39x42
  skullTile: require("./SkullTile.webp"), // 16x16 -> 48x48
  skullTileDark: require("./SkullTileDark.webp"), // 16x16 -> 48x48
  spellIconFireball: require("./SpellIconFireball.webp"), // 16x16 -> 48x48
  spellIconHeal: require("./SpellIconHeal.webp"), // 16x16 -> 48x48

  // ── Symbols ──────────────────────────────────────────────────
  symbolCheckmark: require("./SymbolCheckmark.webp"), // 9x8 -> 27x24
  symbolCross: require("./SymbolCross.webp"), // 7x7 -> 21x21
  symbolMagic: require("./SymbolMagic.webp"), // 10x10 -> 30x30
  symbolShield: require("./SymbolShield.webp"), // 10x10 -> 30x30
  symbolSword: require("./SymbolSword.webp"), // 10x10 -> 30x30

  // ── Tiles ────────────────────────────────────────────────────
  stoneTileHorizontalBottom: require("./StoneTileHorizontalBottom.webp"), // 16x16 -> 48x48
  stoneTileHorizontalTop: require("./StoneTileHorizontalTop.webp"), // 16x14 -> 48x42
  stoneTileVerticalLeft: require("./StoneTileVerticalLeft.webp"), // 16x16 -> 48x48
  stoneTileVerticalRight: require("./StoneTileVerticalRight.webp"), // 16x16 -> 48x48
  woodTileHorizontalBottom: require("./WoodTileHorizontalBottom.webp"), // 13x13 -> 39x39
  woodTileHorizontalTop: require("./WoodTileHorizontalTop.webp"), // 13x13 -> 39x39
  woodTileVerticalLeft: require("./WoodTileVerticalLeft.webp"), // 15x11 -> 45x33
  woodTileVerticalRight: require("./WoodTileVerticalRight.webp"), // 15x11 -> 45x33

  // ── Toggles ──────────────────────────────────────────────────
  toggleButton: require("./ToggleButton.webp"), // 7x10 -> 21x30
  toggleButtonFrame: require("./ToggleButtonFrame.webp"), // 18x10 -> 54x30
} as const;

export type UiAssetName = keyof typeof UI;

export const UI_ASSET_NAMES = Object.keys(UI) as UiAssetName[];

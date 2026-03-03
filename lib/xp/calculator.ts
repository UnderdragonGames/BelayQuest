/**
 * Universal XP system — 3.17x absolute-difficulty scaling.
 *
 * Every grade has a fixed XP value regardless of the climber's level.
 * Harder grades are worth exponentially more XP.
 * Leveling uses a 2x cumulative curve.
 */

// ─── Pre-computed XP by grade (3.17x per V-grade step) ──────────
// V-Scale: 3.17x per step starting from VB=10
// YDS: 3.17x per full grade, 1.33x per letter within a grade
const GRADE_XP: Record<string, number> = {
  // V-Scale
  VB: 10,
  V0: 32,
  V1: 101,
  V2: 319,
  V3: 1012,
  V4: 3207,
  V5: 10167,
  V6: 32228,
  V7: 102163,
  V8: 323857,
  V9: 1026606,
  V10: 3254341,
  V11: 10316261,
  V12: 32702547,
  V13: 103667075,
  V14: 328624548,
  V15: 1041739817,
  V16: 3302275220,
  V17: 10468192448,

  // YDS (3.17x per full grade, 1.33x per letter)
  "5.5": 3,
  "5.6": 10,
  "5.7": 32,
  "5.8": 101,
  "5.9": 319,
  "5.10a": 1012,
  "5.10b": 1347,
  "5.10c": 1793,
  "5.10d": 2387,
  "5.11a": 3207,
  "5.11b": 4268,
  "5.11c": 5681,
  "5.11d": 7561,
  "5.12a": 10167,
  "5.12b": 13532,
  "5.12c": 18013,
  "5.12d": 23978,
  "5.13a": 32228,
  "5.13b": 42903,
  "5.13c": 57106,
  "5.13d": 76011,
  "5.14a": 102163,
  "5.14b": 135977,
  "5.14c": 181050,
  "5.14d": 240997,
  "5.15a": 323857,
  "5.15b": 431051,
  "5.15c": 573738,
};

const ATTEMPT_MULTIPLIER = 0.25;
const PARTY_BONUS_MULTIPLIER = 0.15;

export interface XpCalculation {
  baseXp: number;
  partyBonus: number;
  totalXp: number;
}

/**
 * Look up the absolute XP value for a grade.
 * Throws on unknown grade — no fallbacks.
 */
export function xpForGrade(grade: string): number {
  const xp = GRADE_XP[grade];
  if (xp === undefined) {
    throw new Error(`Unknown grade: ${grade}`);
  }
  return xp;
}

/**
 * Calculate XP for a single climb.
 */
export function calculateXp(
  grade: string,
  type: "send" | "attempt",
  inParty: boolean
): XpCalculation {
  const raw = xpForGrade(grade);
  const baseXp =
    type === "attempt" ? Math.round(raw * ATTEMPT_MULTIPLIER) : raw;
  const partyBonus = inParty ? Math.round(baseXp * PARTY_BONUS_MULTIPLIER) : 0;
  return {
    baseXp,
    partyBonus,
    totalXp: baseXp + partyBonus,
  };
}

/**
 * Calculate level from total XP.
 * 2x cumulative curve: Level N threshold = 10 * 2^(N-2).
 * Level 1 = 0 XP, Level 2 = 10 XP, Level 3 = 20 XP, Level 4 = 40 XP, etc.
 */
export function levelFromXp(totalXp: number): number {
  if (totalXp < 10) return 1;
  return Math.floor(Math.log2(totalXp / 10) + 2);
}

/**
 * XP required to reach a specific level.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 10 * Math.pow(2, level - 2);
}

/**
 * XP progress within current level (0-1).
 */
export function levelProgress(totalXp: number): number {
  const currentLevel = levelFromXp(totalXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const range = nextLevelXp - currentLevelXp;
  if (range === 0) return 0;
  return (totalXp - currentLevelXp) / range;
}

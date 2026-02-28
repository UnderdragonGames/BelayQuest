import { gradeDelta, detectSystem } from "../grades/parser";

/**
 * XP calculation based on grade relative to personal max.
 *
 * The harder the route relative to YOUR max, the more XP.
 * This mirrors real climbing — a 5.10 stops being hard once you climb 5.12.
 *
 * All values are initial tuning — expect adjustment after playtesting.
 */

// Base XP by grade delta (route grade - personal max grade)
const XP_BY_DELTA: Record<number, number> = {
  3: 200, // 3+ above max (exceptional breakthrough)
  2: 175, // 2 above max
  1: 150, // 1 above max (breakthrough)
  0: 90, //  at max
  [-1]: 50, // 1 below
  [-2]: 25, // 2 below
  [-3]: 10, // 3 below
  // anything further below: 0
};

const BREAKTHROUGH_BONUS = 100; // Extra XP for surpassing your max
const ATTEMPT_MULTIPLIER = 0.25; // Attempts earn 25% of send XP
const PARTY_BONUS_MULTIPLIER = 0.15; // +15% XP when climbing with others

interface XpCalculation {
  baseXp: number;
  breakthroughBonus: number;
  partyBonus: number;
  totalXp: number;
  isBreakthrough: boolean;
}

/**
 * Calculate XP for a single route.
 *
 * @param routeGrade - The grade of the route climbed (e.g., "5.11a" or "V6")
 * @param maxGrade - The user's current max grade in the same system
 * @param isSend - true if completed, false if attempt
 * @param inParty - true if climbing in a session with others
 */
export function calculateXp(
  routeGrade: string,
  maxGrade: string | undefined,
  isSend: boolean,
  inParty: boolean
): XpCalculation {
  // If no max grade set yet, treat any send as a breakthrough
  if (!maxGrade) {
    const baseXp = isSend ? 100 : 25;
    const partyBonus = inParty ? Math.round(baseXp * PARTY_BONUS_MULTIPLIER) : 0;
    return {
      baseXp,
      breakthroughBonus: isSend ? BREAKTHROUGH_BONUS : 0,
      partyBonus,
      totalXp: baseXp + (isSend ? BREAKTHROUGH_BONUS : 0) + partyBonus,
      isBreakthrough: isSend,
    };
  }

  // Both grades must be the same system
  const routeSystem = detectSystem(routeGrade);
  const maxSystem = detectSystem(maxGrade);
  if (routeSystem !== maxSystem) {
    // Cross-system comparison not supported — give base XP
    return {
      baseXp: isSend ? 50 : 12,
      breakthroughBonus: 0,
      partyBonus: 0,
      totalXp: isSend ? 50 : 12,
      isBreakthrough: false,
    };
  }

  const delta = gradeDelta(routeGrade, maxGrade);

  // Look up base XP, clamping delta to known range
  const clampedDelta = Math.max(-3, Math.min(3, delta));
  const rawBaseXp = XP_BY_DELTA[clampedDelta] ?? 0;

  // Anything more than 3 below max: 0 XP
  const baseXp = delta < -3 ? 0 : rawBaseXp;

  // Apply attempt multiplier
  const adjustedBase = isSend
    ? baseXp
    : Math.round(baseXp * ATTEMPT_MULTIPLIER);

  // Breakthrough bonus (only on sends above current max)
  const isBreakthrough = isSend && delta > 0;
  const breakthroughBonus = isBreakthrough ? BREAKTHROUGH_BONUS : 0;

  // Party bonus
  const subtotal = adjustedBase + breakthroughBonus;
  const partyBonus = inParty
    ? Math.round(subtotal * PARTY_BONUS_MULTIPLIER)
    : 0;

  return {
    baseXp: adjustedBase,
    breakthroughBonus,
    partyBonus,
    totalXp: subtotal + partyBonus,
    isBreakthrough,
  };
}

/**
 * Calculate level from total XP.
 * Level curve: each level requires progressively more XP.
 * Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 250 XP, etc.
 *
 * Formula: XP needed for level N = 50 * N * (N - 1)
 * This means: Level 5 = 1000 XP, Level 10 = 4500 XP, Level 20 = 19000 XP
 */
export function levelFromXp(totalXp: number): number {
  // Solve: 50 * N * (N-1) <= totalXp
  // Quadratic: N^2 - N - totalXp/50 <= 0
  // N = (1 + sqrt(1 + 4*totalXp/50)) / 2
  const level = Math.floor((1 + Math.sqrt(1 + (4 * totalXp) / 50)) / 2);
  return Math.max(1, level);
}

/**
 * XP required to reach a specific level.
 */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
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

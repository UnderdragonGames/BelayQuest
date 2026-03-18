import { describe, it, expect } from "vitest";
import {
  xpForGrade,
  calculateXp,
  levelFromXp,
  xpForLevel,
  levelProgress,
} from "../../../lib/xp/calculator";

// ─── xpForGrade ─────────────────────────────────────────────────────────────

describe("xpForGrade", () => {
  it.each([
    ["VB", 10],
    ["V0", 32],
    ["V1", 101],
    ["V2", 319],
    ["V3", 1012],
    ["V4", 3207],
    ["V5", 10167],
    ["V6", 32228],
    ["V7", 102163],
    ["V8", 323857],
    ["V9", 1026606],
    ["V10", 3254341],
    ["V11", 10316261],
    ["V12", 32702547],
    ["V13", 103667075],
    ["V14", 328624548],
    ["V15", 1041739817],
    ["V16", 3302275220],
    ["V17", 10468192448],
  ])("%s returns %i XP", (grade, expected) => {
    expect(xpForGrade(grade)).toBe(expected);
  });

  it.each([
    ["5.5", 3],
    ["5.6", 10],
    ["5.7", 32],
    ["5.8", 101],
    ["5.9", 319],
    ["5.10a", 1012],
    ["5.10b", 1347],
    ["5.10c", 1793],
    ["5.10d", 2387],
    ["5.11a", 3207],
    ["5.12a", 10167],
    ["5.13a", 32228],
    ["5.14a", 102163],
    ["5.15a", 323857],
    ["5.15b", 431051],
    ["5.15c", 573738],
  ])("%s returns %i XP", (grade, expected) => {
    expect(xpForGrade(grade)).toBe(expected);
  });

  it("throws on unknown grade", () => {
    expect(() => xpForGrade("V99")).toThrow("Unknown grade: V99");
  });

  it("throws on empty string", () => {
    expect(() => xpForGrade("")).toThrow();
  });

  it("throws on invalid YDS grade", () => {
    expect(() => xpForGrade("5.20a")).toThrow();
  });
});

// ─── calculateXp ────────────────────────────────────────────────────────────

describe("calculateXp", () => {
  it("V0 send solo returns full XP with no party bonus", () => {
    expect(calculateXp("V0", "send", false)).toEqual({
      baseXp: 32,
      partyBonus: 0,
      totalXp: 32,
    });
  });

  it("V0 send in party adds 0.15x bonus", () => {
    // 32 * 0.15 = 4.8 → Math.round = 5
    expect(calculateXp("V0", "send", true)).toEqual({
      baseXp: 32,
      partyBonus: 5,
      totalXp: 37,
    });
  });

  it("V0 attempt solo returns 0.25x XP", () => {
    // 32 * 0.25 = 8
    expect(calculateXp("V0", "attempt", false)).toEqual({
      baseXp: 8,
      partyBonus: 0,
      totalXp: 8,
    });
  });

  it("VB send solo — lowest grade baseline", () => {
    expect(calculateXp("VB", "send", false)).toEqual({
      baseXp: 10,
      partyBonus: 0,
      totalXp: 10,
    });
  });

  it("VB attempt solo — rounds 2.5 up to 3", () => {
    // 10 * 0.25 = 2.5 → Math.round = 3
    expect(calculateXp("VB", "attempt", false)).toEqual({
      baseXp: 3,
      partyBonus: 0,
      totalXp: 3,
    });
  });

  it("V10 attempt in party — large grade with both modifiers", () => {
    const base = Math.round(3254341 * 0.25); // 813585
    const bonus = Math.round(base * 0.15); // 122038
    expect(calculateXp("V10", "attempt", true)).toEqual({
      baseXp: base,
      partyBonus: bonus,
      totalXp: base + bonus,
    });
  });

  it("5.10a send solo", () => {
    expect(calculateXp("5.10a", "send", false)).toEqual({
      baseXp: 1012,
      partyBonus: 0,
      totalXp: 1012,
    });
  });

  it("5.10a send in party", () => {
    // 1012 * 0.15 = 151.8 → 152
    expect(calculateXp("5.10a", "send", true)).toEqual({
      baseXp: 1012,
      partyBonus: 152,
      totalXp: 1164,
    });
  });
});

// ─── levelFromXp ────────────────────────────────────────────────────────────

describe("levelFromXp", () => {
  it.each([
    [0, 1],
    [1, 1],
    [9, 1],
    [10, 2],
    [15, 2],
    [19, 2],
    [20, 3],
    [39, 3],
    [40, 4],
    [79, 4],
    [80, 5],
  ])("%i XP → level %i", (xp, level) => {
    expect(levelFromXp(xp)).toBe(level);
  });

  it("large XP value returns correct level", () => {
    // 10 * 2^(10-2) = 2560, so xp=2560 → level 10
    expect(levelFromXp(2560)).toBe(10);
  });
});

// ─── xpForLevel ─────────────────────────────────────────────────────────────

describe("xpForLevel", () => {
  it.each([
    [1, 0],
    [2, 10],
    [3, 20],
    [4, 40],
    [5, 80],
    [6, 160],
    [7, 320],
    [8, 640],
    [9, 1280],
    [10, 2560],
  ])("level %i requires %i XP", (level, xp) => {
    expect(xpForLevel(level)).toBe(xp);
  });

  it("level 0 and below return 0", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-1)).toBe(0);
  });
});

// ─── levelProgress ──────────────────────────────────────────────────────────

describe("levelProgress", () => {
  it("0 XP → 0 progress (start of level 1)", () => {
    expect(levelProgress(0)).toBe(0);
  });

  it("at level boundary is exactly 0", () => {
    // xp=10 is start of level 2 → progress = 0
    expect(levelProgress(10)).toBe(0);
  });

  it("mid-level returns ~0.5", () => {
    // level 2: 10→20, midpoint=15 → (15-10)/10 = 0.5
    expect(levelProgress(15)).toBe(0.5);
  });

  it("near top of level approaches 1", () => {
    // level 2: 10→20, xp=19 → (19-10)/10 = 0.9
    expect(levelProgress(19)).toBeCloseTo(0.9);
  });

  it("progress is in [0, 1) range for in-level XP", () => {
    const p = levelProgress(25);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThan(1);
  });
});

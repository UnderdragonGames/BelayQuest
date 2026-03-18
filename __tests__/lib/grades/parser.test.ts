import { describe, it, expect } from "vitest";
import {
  detectSystem,
  gradeIndex,
  gradeDelta,
  isValidGrade,
  allGrades,
} from "../../../lib/grades/parser";

// ─── detectSystem ────────────────────────────────────────────────────────────

describe("detectSystem", () => {
  it.each([
    ["VB", "v_scale"],
    ["V0", "v_scale"],
    ["V10", "v_scale"],
    ["V17", "v_scale"],
  ])("%s → v_scale", (grade, expected) => {
    expect(detectSystem(grade)).toBe(expected);
  });

  it.each([
    ["5.5", "yds"],
    ["5.9", "yds"],
    ["5.10a", "yds"],
    ["5.14d", "yds"],
    ["5.15c", "yds"],
  ])("%s → yds", (grade, expected) => {
    expect(detectSystem(grade)).toBe(expected);
  });
});

// ─── gradeIndex ──────────────────────────────────────────────────────────────

describe("gradeIndex", () => {
  it("V-scale ordering is monotonically increasing", () => {
    const grades = ["VB", "V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8",
      "V9", "V10", "V11", "V12", "V13", "V14", "V15", "V16", "V17"];
    for (let i = 0; i < grades.length - 1; i++) {
      expect(gradeIndex(grades[i]!)).toBeLessThan(gradeIndex(grades[i + 1]!));
    }
  });

  it.each([
    ["VB", 0],
    ["V0", 1],
    ["V1", 2],
    ["V10", 11],
    ["V17", 18],
  ])("%s has index %i", (grade, expected) => {
    expect(gradeIndex(grade)).toBe(expected);
  });

  it("YDS ordering is monotonically increasing", () => {
    const grades = ["5.5", "5.6", "5.7", "5.8", "5.9", "5.10a", "5.10b",
      "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d",
      "5.12a", "5.12b", "5.12c", "5.12d", "5.13a", "5.13b",
      "5.13c", "5.13d", "5.14a", "5.14b", "5.14c", "5.14d",
      "5.15a", "5.15b", "5.15c"];
    for (let i = 0; i < grades.length - 1; i++) {
      expect(gradeIndex(grades[i]!)).toBeLessThan(gradeIndex(grades[i + 1]!));
    }
  });

  it.each([
    ["5.5", 0],
    ["5.9", 4],
    ["5.10a", 5],
    ["5.15c", 27],
  ])("%s has index %i", (grade, expected) => {
    expect(gradeIndex(grade)).toBe(expected);
  });

  it("5.10- resolves to same index as 5.10a", () => {
    expect(gradeIndex("5.10-")).toBe(gradeIndex("5.10a"));
  });

  it("5.10 resolves to same index as 5.10b", () => {
    expect(gradeIndex("5.10")).toBe(gradeIndex("5.10b"));
  });

  it("5.10+ resolves to same index as 5.10d", () => {
    expect(gradeIndex("5.10+")).toBe(gradeIndex("5.10d"));
  });

  it("5.11- resolves to same index as 5.11a", () => {
    expect(gradeIndex("5.11-")).toBe(gradeIndex("5.11a"));
  });

  it("5.12 resolves to same index as 5.12b", () => {
    expect(gradeIndex("5.12")).toBe(gradeIndex("5.12b"));
  });

  it("returns -1 for unrecognized grade", () => {
    expect(gradeIndex("V99")).toBe(-1);
    expect(gradeIndex("5.20a")).toBe(-1);
    expect(gradeIndex("")).toBe(-1);
  });
});

// ─── gradeDelta ──────────────────────────────────────────────────────────────

describe("gradeDelta", () => {
  it("returns positive when routeGrade is harder than maxGrade", () => {
    expect(gradeDelta("V5", "V3")).toBeGreaterThan(0);
    expect(gradeDelta("5.12a", "5.10a")).toBeGreaterThan(0);
  });

  it("returns negative when routeGrade is easier than maxGrade", () => {
    expect(gradeDelta("V1", "V3")).toBeLessThan(0);
    expect(gradeDelta("5.9", "5.12a")).toBeLessThan(0);
  });

  it("returns zero when grades are equal", () => {
    expect(gradeDelta("V5", "V5")).toBe(0);
    expect(gradeDelta("5.11a", "5.11a")).toBe(0);
  });

  it("V5 is exactly 2 grades harder than V3", () => {
    expect(gradeDelta("V5", "V3")).toBe(2);
  });

  it("5.10c is 1 step harder than 5.10b", () => {
    expect(gradeDelta("5.10c", "5.10b")).toBe(1);
  });
});

// ─── isValidGrade ────────────────────────────────────────────────────────────

describe("isValidGrade", () => {
  it.each([
    ["VB"],
    ["V0"],
    ["V10"],
    ["V17"],
    ["5.5"],
    ["5.10a"],
    ["5.15c"],
  ])("%s is valid", (grade) => {
    expect(isValidGrade(grade)).toBe(true);
  });

  it.each([
    ["V99"],
    ["5.20a"],
    [""],
    ["V-1"],
    ["invalid"],
  ])("%s is not valid", (grade) => {
    expect(isValidGrade(grade)).toBe(false);
  });
});

// ─── allGrades ───────────────────────────────────────────────────────────────

describe("allGrades", () => {
  it("yds returns YDS grades array starting with 5.5", () => {
    const grades = allGrades("yds");
    expect(grades[0]).toBe("5.5");
    expect(grades[grades.length - 1]).toBe("5.15c");
  });

  it("v_scale returns V grades array starting with VB", () => {
    const grades = allGrades("v_scale");
    expect(grades[0]).toBe("VB");
    expect(grades[grades.length - 1]).toBe("V17");
  });

  it("yds array has 28 grades", () => {
    expect(allGrades("yds").length).toBe(28);
  });

  it("v_scale array has 19 grades", () => {
    expect(allGrades("v_scale").length).toBe(19);
  });
});

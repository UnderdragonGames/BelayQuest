/**
 * Climbing grade utilities.
 * Supports YDS (5.x) for routes and V-scale for boulders.
 */

// YDS grades in order of difficulty
const YDS_GRADES = [
  "5.5",
  "5.6",
  "5.7",
  "5.8",
  "5.9",
  "5.10a",
  "5.10b",
  "5.10c",
  "5.10d",
  "5.11a",
  "5.11b",
  "5.11c",
  "5.11d",
  "5.12a",
  "5.12b",
  "5.12c",
  "5.12d",
  "5.13a",
  "5.13b",
  "5.13c",
  "5.13d",
  "5.14a",
  "5.14b",
  "5.14c",
  "5.14d",
  "5.15a",
  "5.15b",
  "5.15c",
] as const;

// Also support shorthand like "5.10-", "5.10", "5.10+"
const YDS_SHORTHAND: Record<string, string> = {
  "5.10-": "5.10a",
  "5.10": "5.10b",
  "5.10+": "5.10d",
  "5.11-": "5.11a",
  "5.11": "5.11b",
  "5.11+": "5.11d",
  "5.12-": "5.12a",
  "5.12": "5.12b",
  "5.12+": "5.12d",
  "5.13-": "5.13a",
  "5.13": "5.13b",
  "5.13+": "5.13d",
  "5.14-": "5.14a",
  "5.14": "5.14b",
  "5.14+": "5.14d",
};

// V-scale grades in order
const V_GRADES = [
  "VB",
  "V0",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
  "V7",
  "V8",
  "V9",
  "V10",
  "V11",
  "V12",
  "V13",
  "V14",
  "V15",
  "V16",
  "V17",
] as const;

// font, french, and gym_color validation deferred to v1
export type GradeSystem = "yds" | "v_scale" | "font" | "french" | "gym_color";

/**
 * Detect the grading system from a grade string.
 */
export function detectSystem(grade: string): GradeSystem {
  if (grade.startsWith("V") || grade === "VB") return "v_scale";
  return "yds";
}

/**
 * Get the numeric index of a grade within its system (higher = harder).
 * Returns -1 if grade is not recognized.
 */
export function gradeIndex(grade: string): number {
  const system = detectSystem(grade);

  if (system === "v_scale") {
    return V_GRADES.indexOf(grade as (typeof V_GRADES)[number]);
  }

  // Check shorthand first
  const normalized = YDS_SHORTHAND[grade] ?? grade;
  return YDS_GRADES.indexOf(normalized as (typeof YDS_GRADES)[number]);
}

/**
 * Calculate the grade delta between two grades in the same system.
 * Positive = routeGrade is harder than maxGrade.
 * Negative = routeGrade is easier than maxGrade.
 */
export function gradeDelta(routeGrade: string, maxGrade: string): number {
  return gradeIndex(routeGrade) - gradeIndex(maxGrade);
}

/**
 * Check if a grade is valid.
 */
export function isValidGrade(grade: string): boolean {
  return gradeIndex(grade) >= 0;
}

/**
 * Get all grades for a system (for picker UI).
 */
export function allGrades(system: GradeSystem): readonly string[] {
  return system === "yds" ? YDS_GRADES : V_GRADES;
}

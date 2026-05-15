import type { FormulaReference } from "@/types/bbs";

export const STANDARD_REBAR_DIAMETERS = [6, 8, 10, 12, 16, 20, 25, 28, 32, 36, 40] as const;

export const FORMULA_REFERENCES: FormulaReference[] = [
  { id: "weight-d2-162", label: "Reinforcement unit weight", expression: "weight kg = length(m) × d² / 162", source: "IS 1786 practice", variables: { d: "nominal bar diameter in mm" } },
  { id: "spacing-count", label: "Spacing based bar quantity", expression: "number = floor(run length / spacing) + 1", source: "Site BBS practice", variables: { spacing: "centre-to-centre spacing in mm" } },
  { id: "dev-length-factor", label: "Development length by explicit project factor", expression: "Ld = factor × d", source: "Project input", variables: { factor: "user-entered Ld multiplier because bond stress/design stress are not inferred" } },
  { id: "lap-length-factor", label: "Lap length by explicit project factor", expression: "lap = factor × d", source: "Project input", variables: { factor: "user-entered lap multiplier" } },
  { id: "hook-length", label: "Standard hook allowance", expression: "hook = hook factor × d per hook", source: "IS 2502 concept", variables: { hookFactor: "user-configurable, default 9d" } },
  { id: "bend-deduction-is2502", label: "Bend deduction", expression: "90° bend deduction = 2d, 135° = 3d, 180° = 4d", source: "IS 2502 concept", variables: { d: "bar diameter in mm" } },
  { id: "stirrup-cutting", label: "Closed stirrup cutting length", expression: "2(A+B) + hooks - bend deductions", source: "IS 2502 concept", variables: { A: "inside width", B: "inside depth" } },
  { id: "crank-extra", label: "Crank extra length", expression: "extra = crank offset × (1/sin θ - 1)", source: "Site BBS practice", variables: { theta: "selected crank angle" } },
];

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Standard Indian BBS steel weight shortcut: kg = length(m) × d² / 162. */
export function calculateWeight(lengthM: number, diameterMm: number): number {
  return round(lengthM * ((diameterMm * diameterMm) / 162), 3);
}

export function unitWeightKgPerM(diameterMm: number): number {
  return round((diameterMm * diameterMm) / 162, 3);
}

/** Number of bars placed over a clear run at a given c/c spacing, with bars at both ends. */
export function calculateBarQuantityBySpacing(runLengthMm: number, spacingMm: number): number {
  if (spacingMm <= 0) throw new Error("Spacing must be greater than zero");
  if (runLengthMm < 0) throw new Error("Run length cannot be negative");
  return Math.floor(runLengthMm / spacingMm) + 1;
}

export function calculateDevelopmentLength(diameterMm: number, factor: number): number {
  if (factor <= 0) throw new Error("Development length factor must be positive");
  return round(diameterMm * factor, 1);
}

export function calculateLapLength(diameterMm: number, factor: number): number {
  if (factor <= 0) throw new Error("Lap length factor must be positive");
  return round(diameterMm * factor, 1);
}

export function calculateHookLength(diameterMm: number, hookFactor: number, hookCount: number): number {
  return round(diameterMm * hookFactor * hookCount, 1);
}

/** IS 2502-style bend deduction values commonly used in Indian BBS takeoff. */
export function calculateBendAllowance(angleDeg: 45 | 90 | 135 | 180, diameterMm: number, rule: "is2502" | "site-conservative" = "is2502"): number {
  const base = angleDeg === 45 ? 1 : angleDeg === 90 ? 2 : angleDeg === 135 ? 3 : 4;
  return round(diameterMm * base * (rule === "site-conservative" ? 0.9 : 1), 1);
}

export function calculateCrankExtraLength(offsetMm: number, angleDeg: 45 | 60): number {
  const radians = (angleDeg * Math.PI) / 180;
  return round(offsetMm * (1 / Math.sin(radians) - 1), 1);
}

export function calculateCuttingLengthStirrups(widthMm: number, depthMm: number, coverMm: number, stirrupDiaMm: number, hookFactor: number, rule: "is2502" | "site-conservative"): number {
  const insideWidth = widthMm - 2 * (coverMm + stirrupDiaMm / 2);
  const insideDepth = depthMm - 2 * (coverMm + stirrupDiaMm / 2);
  if (insideWidth <= 0 || insideDepth <= 0) throw new Error("Cover/stirrup diameter leaves no internal stirrup dimension");
  const hooks = calculateHookLength(stirrupDiaMm, hookFactor, 2);
  const bends = 2 * calculateBendAllowance(135, stirrupDiaMm, rule) + 2 * calculateBendAllowance(90, stirrupDiaMm, rule);
  return round(2 * (insideWidth + insideDepth) + hooks - bends, 1);
}

export function effectiveStraightLength(memberLengthMm: number, coverMm: number, anchorageEachEndMm = 0): number {
  return round(memberLengthMm - 2 * coverMm + 2 * anchorageEachEndMm, 1);
}

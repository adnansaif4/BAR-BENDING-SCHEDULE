import { describe, expect, it } from "vitest";
import { calculateBarQuantityBySpacing, calculateBendAllowance, calculateCuttingLengthStirrups, calculateWeight, calculateCrankExtraLength } from "@/lib/formulas/core";
import { calculateBbs } from "@/lib/calculations/engine";
import { demoInput } from "@/lib/calculations/demo";

describe("core BBS formulas", () => {
  it("calculates steel weight with d squared over 162", () => { expect(calculateWeight(10, 12)).toBe(8.889); });
  it("calculates spacing quantity with bars at both ends", () => { expect(calculateBarQuantityBySpacing(1000, 200)).toBe(6); });
  it("rejects zero spacing", () => { expect(() => calculateBarQuantityBySpacing(1000, 0)).toThrow("Spacing"); });
  it("applies bend deductions", () => { expect(calculateBendAllowance(90, 8)).toBe(16); expect(calculateBendAllowance(135, 8)).toBe(24); });
  it("calculates stirrup length for small cover edge case", () => { expect(calculateCuttingLengthStirrups(230, 450, 25, 8, 9, "is2502")).toBeGreaterThan(1000); });
  it("calculates crank extra for bent-up bars", () => { expect(calculateCrankExtraLength(350, 45)).toBeGreaterThan(140); });
});

describe("element engine", () => {
  it("generates beam rows including multiple stirrup zones", () => { const result = calculateBbs(demoInput("beam")); expect(result.rows.filter((r) => r.mark.startsWith("B-S"))).toHaveLength(3); expect(result.totalSteelWeightKg).toBeGreaterThan(0); });
  it("generates schedules for all element types", () => { for (const type of ["beam", "slab", "column", "footing", "wall"] as const) expect(calculateBbs(demoInput(type)).rows.length).toBeGreaterThan(0); });
});

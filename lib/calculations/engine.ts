import type { BarScheduleRow, CalculationResult, DiagramSpec, ElementInput, ElementType } from "@/types/bbs";
import { calculateBarQuantityBySpacing, calculateBendAllowance, calculateCrankExtraLength, calculateCuttingLengthStirrups, calculateDevelopmentLength, calculateHookLength, calculateLapLength, calculateWeight, effectiveStraightLength, FORMULA_REFERENCES, round, unitWeightKgPerM } from "@/lib/formulas/core";

function makeRow(args: Omit<BarScheduleRow, "unitWeightKgPerM" | "totalLengthM" | "totalWeightKg">): BarScheduleRow {
  const totalLengthM = round((args.cuttingLengthMm * args.numberOfBars) / 1000, 3);
  return { ...args, unitWeightKgPerM: unitWeightKgPerM(args.barDiameterMm), totalLengthM, totalWeightKg: calculateWeight(totalLengthM, args.barDiameterMm) };
}

function diagram(id: string, title: string, shape: DiagramSpec["shape"], shapeCode: DiagramSpec["shapeCode"], dimensions: DiagramSpec["dimensions"], notes: string[] = []): DiagramSpec {
  return { id, title, shape, shapeCode, dimensions, notes };
}

export function calculateBbs(input: ElementInput): CalculationResult {
  const rows = input.elementType === "beam" ? calculateBeam(input) : input.elementType === "slab" ? calculateSlab(input) : input.elementType === "column" ? calculateColumn(input) : input.elementType === "footing" ? calculateFooting(input) : calculateWall(input);
  const warnings = engineeringWarnings(input);
  const totalSteelWeightKg = round(rows.reduce((sum, row) => sum + row.totalWeightKg, 0), 3);
  const totalBars = rows.reduce((sum, row) => sum + row.numberOfBars, 0);
  const summaryByDiameter = rows.reduce<CalculationResult["summaryByDiameter"]>((acc, row) => {
    const key = `${row.barDiameterMm} mm`;
    acc[key] ??= { totalLengthM: 0, totalWeightKg: 0, bars: 0 };
    acc[key].totalLengthM = round(acc[key].totalLengthM + row.totalLengthM, 3);
    acc[key].totalWeightKg = round(acc[key].totalWeightKg + row.totalWeightKg, 3);
    acc[key].bars += row.numberOfBars;
    return acc;
  }, {});
  return { rows, totalSteelWeightKg, totalBars, summaryByDiameter, warnings, assumptions: commonAssumptions(input), formulaReferences: FORMULA_REFERENCES };
}

function calculateBeam(input: Extract<ElementInput, { elementType: "beam" }>): BarScheduleRow[] {
  const ld = calculateDevelopmentLength(input.mainBarDiameterMm, input.developmentLengthFactor);
  const straight = effectiveStraightLength(input.lengthMm, input.clearCoverMm, ld);
  const rows: BarScheduleRow[] = [
    makeRow({ mark: "B1", memberType: "beam", barShapeCode: "00", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.bottomBars} bottom`, numberOfBars: input.bottomBars, cuttingLengthMm: straight, remarks: "Bottom main bars with explicit Ld each end", formulaIds: ["dev-length-factor", "weight-d2-162"], diagram: diagram("beam-bottom", "Bottom main bar", "straight", "00", [{ label: "CL", valueMm: straight }, { label: "Ld each end", valueMm: ld }]) }),
    makeRow({ mark: "B2", memberType: "beam", barShapeCode: "00", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.topBars} top`, numberOfBars: input.topBars, cuttingLengthMm: straight, remarks: "Top main bars with explicit Ld each end", formulaIds: ["dev-length-factor", "weight-d2-162"], diagram: diagram("beam-top", "Top main bar", "straight", "00", [{ label: "CL", valueMm: straight }, { label: "Ld each end", valueMm: ld }]) }),
  ];
  input.stirrupZones.forEach((zone, index) => {
    const qty = calculateBarQuantityBySpacing(zone.lengthMm, zone.spacingMm);
    const cl = calculateCuttingLengthStirrups(input.widthMm, input.overallDepthMm, input.clearCoverMm, input.stirrupDiameterMm, input.hookLengthFactor, input.bendDeductionRule);
    rows.push(makeRow({ mark: `B-S${index + 1}`, memberType: "beam", barShapeCode: "51", barDiameterMm: input.stirrupDiameterMm, spacingOrQuantity: `${zone.spacingMm} mm c/c in ${zone.label}`, numberOfBars: qty, cuttingLengthMm: cl, remarks: "Closed stirrups with two 135° hooks; quantity per zone", formulaIds: ["spacing-count", "stirrup-cutting", "hook-length", "bend-deduction-is2502"], diagram: diagram(`beam-stirrup-${index}`, `Stirrup ${zone.label}`, "stirrup", "51", [{ label: "A", valueMm: input.widthMm - 2 * input.clearCoverMm }, { label: "B", valueMm: input.overallDepthMm - 2 * input.clearCoverMm }, { label: "Hook", valueMm: input.hookLengthFactor * input.stirrupDiameterMm }]) }));
  });
  input.extraBars.forEach((bar, index) => rows.push(makeRow({ mark: `B-E${index + 1}`, memberType: "beam", barShapeCode: "00", barDiameterMm: bar.diameterMm, spacingOrQuantity: `${bar.quantity} nos`, numberOfBars: bar.quantity, cuttingLengthMm: bar.lengthMm + 2 * bar.anchorageEachEndMm, remarks: `${bar.label}; explicit length and anchorage`, formulaIds: ["weight-d2-162"], diagram: diagram(`beam-extra-${index}`, bar.label, "straight", "00", [{ label: "Length", valueMm: bar.lengthMm }, { label: "Anchorage", valueMm: bar.anchorageEachEndMm }]) })));
  if (input.includeCrankedBars && input.crankedBars > 0) {
    const offset = Math.max(input.effectiveDepthMm - input.clearCoverMm, 0);
    const cl = straight + 2 * calculateCrankExtraLength(offset, input.crankAngleDeg) - 2 * calculateBendAllowance(45, input.mainBarDiameterMm, input.bendDeductionRule);
    rows.push(makeRow({ mark: "B-C1", memberType: "beam", barShapeCode: "37", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.crankedBars} cranked`, numberOfBars: input.crankedBars, cuttingLengthMm: round(cl, 1), remarks: `${input.crankAngleDeg}° bent-up bars with user-selected crank option`, formulaIds: ["crank-extra", "bend-deduction-is2502"], diagram: diagram("beam-crank", "Cranked bar", "cranked", "37", [{ label: "Straight", valueMm: straight }, { label: "Offset", valueMm: offset }]) }));
  }
  return rows;
}

function calculateSlab(input: Extract<ElementInput, { elementType: "slab" }>): BarScheduleRow[] {
  const mainQty = calculateBarQuantityBySpacing(input.longSpanMm - 2 * input.clearCoverMm, input.mainSpacingMm);
  const distQty = calculateBarQuantityBySpacing(input.shortSpanMm - 2 * input.clearCoverMm, input.distributionSpacingMm);
  const hook = input.supportCondition === "continuous" ? calculateHookLength(input.mainBarDiameterMm, input.hookLengthFactor, 2) : 0;
  const openingBarsDeduction = input.openings.reduce((sum, op) => sum + op.count * Math.ceil(op.widthMm / input.mainSpacingMm), 0);
  return [
    makeRow({ mark: "S-M1", memberType: "slab", barShapeCode: hook ? "11" : "00", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.mainSpacingMm} mm c/c`, numberOfBars: Math.max(mainQty - openingBarsDeduction, 0), cuttingLengthMm: input.shortSpanMm - 2 * input.clearCoverMm + hook, remarks: "Main bars along short span; opening deduction by declared openings", formulaIds: ["spacing-count", "hook-length"], diagram: diagram("slab-main", "Slab main reinforcement", hook ? "l-bar" : "straight", hook ? "11" : "00", [{ label: "Short span", valueMm: input.shortSpanMm }, { label: "Hook allowance", valueMm: hook }]) }),
    makeRow({ mark: "S-D1", memberType: "slab", barShapeCode: "00", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.distributionSpacingMm} mm c/c`, numberOfBars: distQty, cuttingLengthMm: input.longSpanMm - 2 * input.clearCoverMm, remarks: "Distribution bars along long span", formulaIds: ["spacing-count"], diagram: diagram("slab-dist", "Distribution reinforcement", "straight", "00", [{ label: "Long span", valueMm: input.longSpanMm }]) }),
  ];
}

function calculateColumn(input: Extract<ElementInput, { elementType: "column" }>): BarScheduleRow[] {
  const lap = calculateLapLength(input.mainBarDiameterMm, input.lapLengthFactor);
  const longCl = input.clearHeightMm + lap + input.starterDowelLengthMm;
  const tieQty = calculateBarQuantityBySpacing(input.clearHeightMm, input.tieSpacingMm);
  const tieCl = calculateCuttingLengthStirrups(input.widthMm, input.depthMm, input.clearCoverMm, input.stirrupDiameterMm, input.hookLengthFactor, input.bendDeductionRule);
  return [
    makeRow({ mark: "C-L1", memberType: "column", barShapeCode: "00", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.longitudinalBars} vertical`, numberOfBars: input.longitudinalBars, cuttingLengthMm: longCl, remarks: "Longitudinal bars include explicit lap and starter/dowel length", formulaIds: ["lap-length-factor"], diagram: diagram("column-long", "Column longitudinal bar", "straight", "00", [{ label: "Clear height", valueMm: input.clearHeightMm }, { label: "Lap", valueMm: lap }, { label: "Starter", valueMm: input.starterDowelLengthMm }]) }),
    makeRow({ mark: "C-T1", memberType: "column", barShapeCode: "51", barDiameterMm: input.stirrupDiameterMm, spacingOrQuantity: `${input.tieSpacingMm} mm c/c`, numberOfBars: tieQty, cuttingLengthMm: tieCl, remarks: "Closed ties with hooks", formulaIds: ["spacing-count", "stirrup-cutting"], diagram: diagram("column-tie", "Column tie", "stirrup", "51", [{ label: "A", valueMm: input.widthMm - 2 * input.clearCoverMm }, { label: "B", valueMm: input.depthMm - 2 * input.clearCoverMm }]) }),
  ];
}

function calculateFooting(input: Extract<ElementInput, { elementType: "footing" }>): BarScheduleRow[] {
  const hook = input.includeHooks ? calculateHookLength(input.mainBarDiameterMm, input.hookLengthFactor, 2) - 2 * calculateBendAllowance(90, input.mainBarDiameterMm, input.bendDeductionRule) : 0;
  const xQty = calculateBarQuantityBySpacing(input.widthMm - 2 * input.clearCoverMm, input.xBarSpacingMm);
  const yQty = calculateBarQuantityBySpacing(input.lengthMm - 2 * input.clearCoverMm, input.yBarSpacingMm);
  return [
    makeRow({ mark: "F-X1", memberType: "footing", barShapeCode: input.includeHooks ? "21" : "00", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.xBarSpacingMm} mm c/c`, numberOfBars: xQty, cuttingLengthMm: input.lengthMm - 2 * input.clearCoverMm + hook, remarks: "Bottom bars in X direction; hooks only if selected", formulaIds: ["spacing-count", "hook-length", "bend-deduction-is2502"], diagram: diagram("footing-x", "Footing X mesh bar", input.includeHooks ? "u-bar" : "mesh", input.includeHooks ? "21" : "00", [{ label: "Length", valueMm: input.lengthMm }, { label: "Hook allowance", valueMm: hook }]) }),
    makeRow({ mark: "F-Y1", memberType: "footing", barShapeCode: input.includeHooks ? "21" : "00", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.yBarSpacingMm} mm c/c`, numberOfBars: yQty, cuttingLengthMm: input.widthMm - 2 * input.clearCoverMm + hook, remarks: "Bottom bars in Y direction; hooks only if selected", formulaIds: ["spacing-count", "hook-length", "bend-deduction-is2502"], diagram: diagram("footing-y", "Footing Y mesh bar", input.includeHooks ? "u-bar" : "mesh", input.includeHooks ? "21" : "00", [{ label: "Width", valueMm: input.widthMm }, { label: "Hook allowance", valueMm: hook }]) }),
  ];
}

function calculateWall(input: Extract<ElementInput, { elementType: "wall" }>): BarScheduleRow[] {
  const vQty = calculateBarQuantityBySpacing(input.lengthMm - 2 * input.clearCoverMm, input.verticalSpacingMm);
  const hQty = calculateBarQuantityBySpacing(input.heightMm - 2 * input.clearCoverMm, input.horizontalSpacingMm);
  const ld = calculateDevelopmentLength(input.mainBarDiameterMm, input.developmentLengthFactor);
  return [
    makeRow({ mark: "W-V1", memberType: "wall", barShapeCode: "00", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.verticalSpacingMm} mm c/c`, numberOfBars: vQty, cuttingLengthMm: input.heightMm - 2 * input.clearCoverMm + 2 * ld, remarks: "Vertical wall bars with explicit development length at top/bottom", formulaIds: ["spacing-count", "dev-length-factor"], diagram: diagram("wall-v", "Wall vertical bar", "wall", "00", [{ label: "Height", valueMm: input.heightMm }, { label: "Ld", valueMm: ld }]) }),
    makeRow({ mark: "W-H1", memberType: "wall", barShapeCode: "00", barDiameterMm: input.mainBarDiameterMm, spacingOrQuantity: `${input.horizontalSpacingMm} mm c/c`, numberOfBars: hQty, cuttingLengthMm: input.lengthMm - 2 * input.clearCoverMm + 2 * ld, remarks: "Horizontal wall bars with explicit end anchorage", formulaIds: ["spacing-count", "dev-length-factor"], diagram: diagram("wall-h", "Wall horizontal bar", "straight", "00", [{ label: "Length", valueMm: input.lengthMm }, { label: "Ld", valueMm: ld }]) }),
    ...(input.boundaryBarsEachEnd > 0 ? [makeRow({ mark: "W-B1", memberType: "wall" as ElementType, barShapeCode: "00", barDiameterMm: input.boundaryBarDiameterMm, spacingOrQuantity: `${input.boundaryBarsEachEnd * 2} boundary`, numberOfBars: input.boundaryBarsEachEnd * 2, cuttingLengthMm: input.heightMm - 2 * input.clearCoverMm + 2 * ld, remarks: "Boundary element bars each end; confinement design not inferred", formulaIds: ["dev-length-factor"], diagram: diagram("wall-boundary", "Boundary vertical bars", "wall", "00", [{ label: "Height", valueMm: input.heightMm }]) })] : []),
  ];
}

function commonAssumptions(input: ElementInput): string[] {
  return [
    "All dimensions are in millimetres and output lengths are converted to metres for weight.",
    "Development length and lap length are not inferred from stress/bond calculations; user-entered multipliers are shown and used explicitly.",
    `Bend deductions use the selected ${input.bendDeductionRule} rule selector.`,
    "Shape codes are descriptive BBS codes for the app and can be mapped to project-specific IS 2502 schedules during audit.",
  ];
}

function engineeringWarnings(input: ElementInput): string[] {
  const warnings: string[] = [];
  if (input.clearCoverMm < 20) warnings.push("Clear cover below 20 mm is unusual for most RCC structural members; verify exposure and drawings.");
  if (input.mainBarDiameterMm > 0 && input.clearCoverMm < input.mainBarDiameterMm) warnings.push("Clear cover is less than main bar diameter; verify detailing feasibility.");
  if (input.developmentLengthFactor < 40) warnings.push("Development length factor below 40d may be unconservative unless justified by design.");
  return warnings;
}

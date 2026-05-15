import { z } from "zod";
import { STANDARD_REBAR_DIAMETERS } from "@/lib/formulas/core";
import type { ElementInput } from "@/types/bbs";

const diameter = z.coerce.number().refine((value) => STANDARD_REBAR_DIAMETERS.includes(value as typeof STANDARD_REBAR_DIAMETERS[number]), "Use a standard reinforcement diameter");
const positive = (label: string) => z.coerce.number().positive(`${label} must be greater than zero`);
const nonNegative = (label: string) => z.coerce.number().nonnegative(`${label} cannot be negative`);
const intPositive = (label: string) => z.coerce.number().int(`${label} must be an integer`).positive(`${label} must be greater than zero`);

const common = {
  projectName: z.string().min(2, "Project name is required"),
  elementName: z.string().min(1, "Element name is required"),
  concreteGrade: z.enum(["M20", "M25", "M30", "M35", "M40"]),
  steelGrade: z.enum(["Fe250", "Fe415", "Fe500", "Fe550"]),
  clearCoverMm: positive("Clear cover"),
  mainBarDiameterMm: diameter,
  stirrupDiameterMm: diameter,
  developmentLengthFactor: positive("Development length factor"),
  lapLengthFactor: positive("Lap length factor"),
  hookLengthFactor: positive("Hook length factor"),
  bendDeductionRule: z.enum(["is2502", "site-conservative"]),
};

const stirrupZoneSchema = z.object({ label: z.string().min(1), lengthMm: positive("Zone length"), spacingMm: positive("Zone spacing") });
const extraBarSchema = z.object({ label: z.string().min(1), quantity: intPositive("Extra bar quantity"), lengthMm: positive("Extra bar length"), diameterMm: diameter, anchorageEachEndMm: nonNegative("Anchorage") });
const openingSchema = z.object({ label: z.string().min(1), widthMm: positive("Opening width"), heightMm: positive("Opening height"), count: z.coerce.number().int().nonnegative() });

export const beamSchema = z.object({
  ...common,
  elementType: z.literal("beam"),
  lengthMm: positive("Beam length"), widthMm: positive("Beam width"), overallDepthMm: positive("Overall depth"), effectiveDepthMm: positive("Effective depth"),
  topBars: intPositive("Top bars"), bottomBars: intPositive("Bottom bars"), stirrupZones: z.array(stirrupZoneSchema).min(1), extraBars: z.array(extraBarSchema),
  includeCrankedBars: z.boolean(), crankedBars: z.coerce.number().int().nonnegative(), crankAngleDeg: z.union([z.literal(45), z.literal(60)]),
}).superRefine((v, ctx) => {
  if (v.clearCoverMm * 2 >= Math.min(v.widthMm, v.overallDepthMm)) ctx.addIssue({ code: "custom", path: ["clearCoverMm"], message: "Cover cannot exceed member dimensions" });
  if (v.effectiveDepthMm >= v.overallDepthMm) ctx.addIssue({ code: "custom", path: ["effectiveDepthMm"], message: "Effective depth must be less than overall depth" });
});

export const slabSchema = z.object({ ...common, elementType: z.literal("slab"), shortSpanMm: positive("Short span"), longSpanMm: positive("Long span"), thicknessMm: positive("Thickness"), mainSpacingMm: positive("Main spacing"), distributionSpacingMm: positive("Distribution spacing"), supportCondition: z.enum(["simply-supported", "continuous"]), openings: z.array(openingSchema) }).superRefine((v, ctx) => { if (v.clearCoverMm * 2 >= v.thicknessMm) ctx.addIssue({ code: "custom", path: ["clearCoverMm"], message: "Cover cannot exceed slab thickness" }); });
export const columnSchema = z.object({ ...common, elementType: z.literal("column"), widthMm: positive("Column width"), depthMm: positive("Column depth"), clearHeightMm: positive("Clear height"), longitudinalBars: intPositive("Longitudinal bars"), tieSpacingMm: positive("Tie spacing"), lapZoneLengthMm: nonNegative("Lap zone"), starterDowelLengthMm: nonNegative("Starter dowel") }).superRefine((v, ctx) => { if (v.clearCoverMm * 2 >= Math.min(v.widthMm, v.depthMm)) ctx.addIssue({ code: "custom", path: ["clearCoverMm"], message: "Cover cannot exceed column dimensions" }); });
export const footingSchema = z.object({ ...common, elementType: z.literal("footing"), lengthMm: positive("Footing length"), widthMm: positive("Footing width"), thicknessMm: positive("Thickness"), pedestalLengthMm: positive("Pedestal length"), pedestalWidthMm: positive("Pedestal width"), xBarSpacingMm: positive("X spacing"), yBarSpacingMm: positive("Y spacing"), includeHooks: z.boolean() }).superRefine((v, ctx) => { if (v.clearCoverMm * 2 >= Math.min(v.lengthMm, v.widthMm, v.thicknessMm)) ctx.addIssue({ code: "custom", path: ["clearCoverMm"], message: "Cover cannot exceed footing dimensions" }); });
export const wallSchema = z.object({ ...common, elementType: z.literal("wall"), lengthMm: positive("Wall length"), thicknessMm: positive("Thickness"), heightMm: positive("Height"), verticalSpacingMm: positive("Vertical spacing"), horizontalSpacingMm: positive("Horizontal spacing"), boundaryBarsEachEnd: z.coerce.number().int().nonnegative(), boundaryBarDiameterMm: diameter, openings: z.array(openingSchema) }).superRefine((v, ctx) => { if (v.clearCoverMm * 2 >= v.thicknessMm) ctx.addIssue({ code: "custom", path: ["clearCoverMm"], message: "Cover cannot exceed wall thickness" }); });

export const elementSchema = z.discriminatedUnion("elementType", [beamSchema, slabSchema, columnSchema, footingSchema, wallSchema]);
export function validateElementInput(input: ElementInput) { return elementSchema.safeParse(input); }

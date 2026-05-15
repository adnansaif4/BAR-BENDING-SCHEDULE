export type ElementType = "beam" | "slab" | "column" | "footing" | "wall";
export type SteelGrade = "Fe250" | "Fe415" | "Fe500" | "Fe550";
export type ConcreteGrade = "M20" | "M25" | "M30" | "M35" | "M40";
export type ShapeCode = "00" | "11" | "21" | "37" | "51" | "67" | "99";
export type DiagramShape = "straight" | "l-bar" | "u-bar" | "cranked" | "stirrup" | "mesh" | "wall";

export interface Project {
  id: string;
  projectName: string;
  elementName: string;
  elementType: ElementType;
  createdAt: string;
  updatedAt: string;
  input: ElementInput;
  result: CalculationResult;
}

export interface CommonInput {
  projectName: string;
  elementName: string;
  elementType: ElementType;
  concreteGrade: ConcreteGrade;
  steelGrade: SteelGrade;
  clearCoverMm: number;
  mainBarDiameterMm: number;
  stirrupDiameterMm: number;
  developmentLengthFactor: number;
  lapLengthFactor: number;
  hookLengthFactor: number;
  bendDeductionRule: "is2502" | "site-conservative";
}

export interface StirrupZoneInput { label: string; lengthMm: number; spacingMm: number; }
export interface ExtraBarInput { label: string; quantity: number; lengthMm: number; diameterMm: number; anchorageEachEndMm: number; }
export interface OpeningInput { label: string; widthMm: number; heightMm: number; count: number; }

export interface BeamInput extends CommonInput {
  elementType: "beam";
  lengthMm: number;
  widthMm: number;
  overallDepthMm: number;
  effectiveDepthMm: number;
  topBars: number;
  bottomBars: number;
  stirrupZones: StirrupZoneInput[];
  extraBars: ExtraBarInput[];
  includeCrankedBars: boolean;
  crankedBars: number;
  crankAngleDeg: 45 | 60;
}

export interface SlabInput extends CommonInput {
  elementType: "slab";
  shortSpanMm: number;
  longSpanMm: number;
  thicknessMm: number;
  mainSpacingMm: number;
  distributionSpacingMm: number;
  supportCondition: "simply-supported" | "continuous";
  openings: OpeningInput[];
}

export interface ColumnInput extends CommonInput {
  elementType: "column";
  widthMm: number;
  depthMm: number;
  clearHeightMm: number;
  longitudinalBars: number;
  tieSpacingMm: number;
  lapZoneLengthMm: number;
  starterDowelLengthMm: number;
}

export interface FootingInput extends CommonInput {
  elementType: "footing";
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  pedestalLengthMm: number;
  pedestalWidthMm: number;
  xBarSpacingMm: number;
  yBarSpacingMm: number;
  includeHooks: boolean;
}

export interface WallInput extends CommonInput {
  elementType: "wall";
  lengthMm: number;
  thicknessMm: number;
  heightMm: number;
  verticalSpacingMm: number;
  horizontalSpacingMm: number;
  boundaryBarsEachEnd: number;
  boundaryBarDiameterMm: number;
  openings: OpeningInput[];
}

export type ElementInput = BeamInput | SlabInput | ColumnInput | FootingInput | WallInput;

export interface FormulaReference {
  id: string;
  label: string;
  expression: string;
  source: "IS 2502 concept" | "IS 456 concept" | "IS 1786 practice" | "Project input" | "Site BBS practice";
  variables: Record<string, string>;
}

export interface DiagramSpec {
  id: string;
  title: string;
  shape: DiagramShape;
  shapeCode: ShapeCode;
  dimensions: { label: string; valueMm: number }[];
  notes: string[];
}

export interface BarScheduleRow {
  mark: string;
  memberType: ElementType;
  barShapeCode: ShapeCode;
  barDiameterMm: number;
  spacingOrQuantity: string;
  numberOfBars: number;
  cuttingLengthMm: number;
  unitWeightKgPerM: number;
  totalLengthM: number;
  totalWeightKg: number;
  remarks: string;
  formulaIds: string[];
  diagram: DiagramSpec;
}

export interface CalculationResult {
  rows: BarScheduleRow[];
  totalSteelWeightKg: number;
  totalBars: number;
  summaryByDiameter: Record<string, { totalLengthM: number; totalWeightKg: number; bars: number }>;
  assumptions: string[];
  warnings: string[];
  formulaReferences: FormulaReference[];
}

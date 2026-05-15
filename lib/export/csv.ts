import type { CalculationResult } from "@/types/bbs";
export function scheduleToCsv(result: CalculationResult): string {
  const header = ["Mark", "Member type", "Shape code", "Dia mm", "Spacing / quantity", "No. bars", "Cutting length mm", "Unit wt kg/m", "Total length m", "Total wt kg", "Remarks"];
  const rows = result.rows.map((row) => [row.mark, row.memberType, row.barShapeCode, row.barDiameterMm, row.spacingOrQuantity, row.numberOfBars, row.cuttingLengthMm, row.unitWeightKgPerM, row.totalLengthM, row.totalWeightKg, row.remarks]);
  return [header, ...rows].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}
export function downloadText(filename: string, text: string, mime = "text/csv") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

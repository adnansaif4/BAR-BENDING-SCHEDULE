import type { CalculationResult, ElementInput } from "@/types/bbs";

export async function downloadPdf(input: ElementInput, result: CalculationResult) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.text("Indian BBS Generator", 14, 12);
  doc.text(`${input.projectName} - ${input.elementName}`, 14, 20);
  doc.text(`Total steel: ${result.totalSteelWeightKg} kg | Total bars: ${result.totalBars}`, 14, 28);
  autoTable(doc, { head: [["Mark", "Member", "Shape", "Dia", "Spacing/Qty", "Nos", "CL mm", "Unit kg/m", "Total m", "Total kg", "Remarks"]], body: result.rows.map((r) => [r.mark, r.memberType, r.barShapeCode, r.barDiameterMm, r.spacingOrQuantity, r.numberOfBars, r.cuttingLengthMm, r.unitWeightKgPerM, r.totalLengthM, r.totalWeightKg, r.remarks]), startY: 36, styles: { fontSize: 8 } });
  doc.save(`${input.projectName.replaceAll(" ", "-")}-bbs.pdf`);
}

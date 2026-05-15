import type { CalculationResult } from "@/types/bbs";
import { ShapeDiagram } from "@/components/ShapeDiagram";

export function BbsTable({ result }: { result: CalculationResult }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200 print-landscape">
        <table className="min-w-[1100px] w-full border-collapse bg-white text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>{["Mark", "Member", "Shape", "Dia", "Spacing / qty", "Nos", "CL mm", "Unit kg/m", "Total m", "Total kg", "Remarks"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>{result.rows.map((row) => <tr key={row.mark} className="border-b border-slate-100"><td className="p-2 font-semibold">{row.mark}</td><td className="p-2 capitalize">{row.memberType}</td><td className="p-2">{row.barShapeCode}</td><td className="p-2">{row.barDiameterMm}</td><td className="p-2">{row.spacingOrQuantity}</td><td className="p-2">{row.numberOfBars}</td><td className="p-2">{row.cuttingLengthMm}</td><td className="p-2">{row.unitWeightKgPerM}</td><td className="p-2">{row.totalLengthM}</td><td className="p-2 font-semibold">{row.totalWeightKg}</td><td className="p-2">{row.remarks}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{result.rows.map((row) => <ShapeDiagram key={row.diagram.id} spec={row.diagram} />)}</div>
    </div>
  );
}

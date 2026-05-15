import type { DiagramSpec } from "@/types/bbs";

export function ShapeDiagram({ spec }: { spec: DiagramSpec }) {
  const labels = spec.dimensions.map((dim, index) => <text key={dim.label} x={24} y={142 + index * 16} className="fill-slate-700 text-[11px]">{dim.label}: {dim.valueMm} mm</text>);
  const stroke = "stroke-blue-700";
  const common = `fill-none ${stroke} stroke-[6] stroke-linecap-round stroke-linejoin-round`;
  return (
    <svg viewBox="0 0 280 190" role="img" aria-label={spec.title} className="h-48 w-full rounded-lg border border-slate-200 bg-white">
      <text x="16" y="22" className="fill-slate-900 text-[14px] font-bold">{spec.title}</text>
      <text x="220" y="22" className="fill-blue-700 text-[12px] font-bold">Code {spec.shapeCode}</text>
      {spec.shape === "straight" && <path d="M35 82 H245" className={common} />}
      {spec.shape === "l-bar" && <path d="M55 112 V58 H230" className={common} />}
      {spec.shape === "u-bar" && <path d="M55 58 V112 H225 V58" className={common} />}
      {spec.shape === "cranked" && <path d="M30 112 H90 L125 62 H160 L195 112 H250" className={common} />}
      {spec.shape === "stirrup" && <rect x="70" y="48" width="140" height="78" rx="8" className={common} />}
      {spec.shape === "mesh" && <g className={stroke}><path d="M45 65 H235M45 92H235M45 119H235" className="stroke-[4]"/><path d="M75 45 V140M135 45V140M195 45V140" className="stroke-[4]"/></g>}
      {spec.shape === "wall" && <g className={stroke}><path d="M80 45 V128M120 45V128M160 45V128M200 45V128" className="stroke-[5] stroke-linecap-round"/><path d="M60 66 H220M60 100H220" className="stroke-[4]"/></g>}
      <circle cx="35" cy="82" r="4" className="fill-orange-500" />
      {labels}
      {spec.notes.slice(0, 2).map((note, index) => <text key={note} x="24" y={176 + index * 12} className="fill-slate-500 text-[10px]">{note}</text>)}
    </svg>
  );
}

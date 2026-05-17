import type { ElementType, Project } from "@/types/bbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const types: { key: ElementType; label: string; desc: string }[] = [
  { key: "beam", label: "Beam", desc: "Main bars, stirrup zones, extra support bars, cranked bars" },
  { key: "slab", label: "Slab", desc: "Main/distribution steel, supports and opening deductions" },
  { key: "column", label: "Column", desc: "Longitudinal bars, ties, laps and dowels" },
  { key: "footing", label: "Footing", desc: "Bottom mesh in both directions with hook rules" },
  { key: "wall", label: "Wall / NS wall", desc: "Vertical/horizontal steel and boundary bars" },
];
export function Dashboard({ selected, onSelect, saved, onLoad, search, onSearch }: { selected: ElementType; onSelect: (type: ElementType) => void; saved: Project[]; onLoad: (project: Project) => void; search: string; onSearch: (value: string) => void }) {
  const filtered = saved.filter((p) => `${p.projectName} ${p.elementName} ${p.elementType}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-5">{types.map((type) => <button key={type.key} onClick={() => onSelect(type.key)} className={`rounded-xl border p-4 text-left shadow-sm transition ${selected === type.key ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}><div className="font-bold">{type.label}</div><div className="mt-2 text-xs text-slate-600">{type.desc}</div></button>)}</div><Card><CardHeader><CardTitle>Saved calculations</CardTitle></CardHeader><CardContent><input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search previous projects" className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2" />{filtered.length === 0 ? <p className="text-sm text-slate-500">No saved projects yet. Generate a schedule and click Save project.</p> : <div className="grid gap-2 md:grid-cols-2">{filtered.map((project) => <div key={project.id} className="rounded-lg border border-slate-200 p-3"><div className="font-semibold">{project.projectName}</div><div className="text-sm text-slate-600">{project.elementName} · {project.elementType} · {new Date(project.updatedAt).toLocaleString()}</div><Button size="sm" variant="outline" className="mt-2" onClick={() => onLoad(project)}>Open</Button></div>)}</div>}</CardContent></Card></div>;
}

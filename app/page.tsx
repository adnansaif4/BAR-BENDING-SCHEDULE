"use client";
import { useEffect, useMemo, useState } from "react";
import { Calculator, Copy, Download, FileText, Printer, Save } from "lucide-react";
import type { CalculationResult, ElementInput, ElementType, Project } from "@/types/bbs";
import { calculateBbs } from "@/lib/calculations/engine";
import { demoInput } from "@/lib/calculations/demo";
import { duplicateProject, loadProjects, saveProject } from "@/lib/storage/projects";
import { scheduleToCsv, downloadText } from "@/lib/export/csv";
import { downloadPdf } from "@/lib/export/pdf";
import { Dashboard } from "@/components/Dashboard";
import { InputForm } from "@/components/InputForm";
import { BbsTable } from "@/components/BbsTable";
import { FormulaReferencePanel } from "@/components/FormulaReferencePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [elementType, setElementType] = useState<ElementType>("beam");
  const [input, setInput] = useState<ElementInput>(demoInput("beam"));
  const [result, setResult] = useState<CalculationResult>(() => calculateBbs(demoInput("beam")));
  const [saved, setSaved] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const currentProject = useMemo<Project>(() => ({ id: `${input.projectName}-${input.elementName}-${input.elementType}`, projectName: input.projectName, elementName: input.elementName, elementType: input.elementType, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), input, result }), [input, result]);
  useEffect(() => setSaved(loadProjects()), []);
  function changeType(type: ElementType) { const next = demoInput(type); setElementType(type); setInput(next); setResult(calculateBbs(next)); }
  function calculate(next: ElementInput) { setInput(next); setElementType(next.elementType); setResult(calculateBbs(next)); }
  function doSave(project = currentProject) { setSaved(saveProject(project)); }
  async function copyTable() { await navigator.clipboard.writeText(scheduleToCsv(result)); }
  return <main className="min-h-screen"><header className="no-print border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><Calculator className="h-8 w-8 text-blue-700" /><h1 className="text-3xl font-black tracking-tight">Indian BBS Generator</h1></div><p className="mt-2 max-w-3xl text-sm text-slate-600">Production-oriented Bar Bending Schedule calculator for beam, slab, column, footing and wall reinforcement. Formula assumptions are visible and rule selectors are user configurable; this app does not silently infer design-dependent values.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button><Button variant="outline" onClick={() => downloadText(`${input.projectName}-bbs.csv`, scheduleToCsv(result))}><Download className="mr-2 h-4 w-4" />CSV</Button><Button variant="outline" onClick={() => downloadPdf(input, result)}><FileText className="mr-2 h-4 w-4" />PDF</Button></div></div></header><div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]"><div className="space-y-6"><Dashboard selected={elementType} onSelect={changeType} saved={saved} onLoad={(project) => { setInput(project.input); setResult(project.result); setElementType(project.elementType); }} search={search} onSearch={setSearch} /><InputForm elementType={elementType} initialInput={input} onCalculate={calculate} /><Card className="print-card"><CardHeader><CardTitle>Bar Bending Schedule Output</CardTitle></CardHeader><CardContent><BbsTable result={result} /></CardContent></Card><FormulaReferencePanel result={result} /></div><aside className="no-print lg:sticky lg:top-4 lg:self-start"><Card><CardHeader><CardTitle>Sticky calculation summary</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3"><Metric label="Total steel" value={`${result.totalSteelWeightKg} kg`} /><Metric label="Total bars" value={`${result.totalBars}`} /></div><div><h3 className="mb-2 font-semibold">Summary by diameter</h3><div className="space-y-2">{Object.entries(result.summaryByDiameter).map(([dia, summary]) => <div key={dia} className="rounded-lg bg-slate-50 p-2 text-sm"><b>{dia}</b>: {summary.bars} bars · {summary.totalLengthM} m · {summary.totalWeightKg} kg</div>)}</div></div><div className="grid gap-2"><Button onClick={() => doSave()}><Save className="mr-2 h-4 w-4" />Save project</Button><Button variant="outline" onClick={() => doSave(duplicateProject(currentProject))}>Duplicate schedule</Button><Button variant="outline" onClick={copyTable}><Copy className="mr-2 h-4 w-4" />Copy schedule table</Button></div><div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">Audit note: IS 456/13920 design checks such as required steel area, seismic confinement and bond stress are intentionally not inferred from geometry alone. Enter drawing/design values as explicit inputs.</div></CardContent></Card></aside></div></main>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-900 p-3 text-white"><div className="text-xs text-slate-300">{label}</div><div className="text-xl font-black">{value}</div></div>; }

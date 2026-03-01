"use client";

import { useState } from "react";
import { Export, Heart, Brain, Dna, FirstAid, Spinner, CheckCircle, Warning, FilePdf } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ── Types ────────────────────────────────────────────────────────────────

type Range = "4weeks" | "3months" | "custom";
type ReportType = "cardiology" | "neurology" | "genetics" | "pediatrics";
type GenerateState = "idle" | "generating" | "done" | "error";

interface Specialist {
  id: ReportType;
  label: string;
  Icon: typeof Heart;
  enabled: boolean;
}

const SPECIALISTS: Specialist[] = [
  { id: "cardiology",  label: "Cardiologist",       Icon: Heart,    enabled: true  },
  { id: "neurology",   label: "Neurologist",         Icon: Brain,    enabled: false },
  { id: "genetics",    label: "Geneticist",          Icon: Dna,      enabled: false },
  { id: "pediatrics",  label: "General Pediatrician", Icon: FirstAid, enabled: false },
];

const SECTIONS = [
  { key: "episode_library",            label: "Episode Library" },
  { key: "pharmacokinetic_analysis",   label: "Pharmacokinetic Analysis" },
  { key: "autonomic_trends",           label: "Autonomic Trends" },
  { key: "trigger_analysis",           label: "Trigger Analysis" },
  { key: "supporting_context",         label: "Supporting Context" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Component ────────────────────────────────────────────────────────────

export function ExportTab() {
  const [range, setRange] = useState<Range>("3months");
  const [specialist, setSpecialist] = useState<ReportType>("cardiology");
  const [sections, setSections] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s.key, true]))
  );
  const [state, setState] = useState<GenerateState>("idle");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>("");

  const toggleSection = (key: string) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const computeDateRange = (): { start: string; end: string } => {
    const end = new Date();
    const start = new Date();
    if (range === "4weeks") start.setDate(end.getDate() - 28);
    else if (range === "3months") start.setMonth(end.getMonth() - 3);
    else start.setMonth(end.getMonth() - 3);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const generate = async () => {
    setState("generating");
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);

    try {
      const { start, end } = computeDateRange();
      const activeSections = SECTIONS.filter((s) => sections[s.key]).map((s) => s.key).join(",");
      const url = `${API_BASE}/report?type=${specialist}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&sections=${activeSections}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);

      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      setPdfFilename(match?.[1] ?? `guardrail_${specialist}_report_${new Date().toISOString().slice(0, 10)}.pdf`);

      setState("done");
    } catch {
      setState("error");
    }
  };

  const downloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = pdfFilename;
    a.click();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-800">
        <Export size={28} weight="duotone" className="text-sky-500" />
        Export
      </h1>
      <p className="mt-1 text-zinc-500">Generate a structured report for your care team.</p>

      {/* ── Specialist selector ──────────────────────────────────────── */}
      <div className="mt-8">
        <p className="text-sm font-medium text-zinc-600">Physician specialty</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SPECIALISTS.map((spec) => {
            const Icon = spec.Icon;
            const selected = specialist === spec.id;
            const disabled = !spec.enabled;
            return (
              <Button
                key={spec.id}
                variant={selected ? "secondary" : "outline"}
                disabled={disabled}
                onClick={() => spec.enabled && setSpecialist(spec.id)}
                className={`relative flex h-auto flex-col items-center gap-1.5 rounded-2xl px-3 py-3 ${
                  selected
                    ? "border-sky-400 bg-sky-50 text-sky-700 shadow-[0_2px_12px_rgba(56,189,248,0.15)]"
                    : disabled
                      ? "cursor-not-allowed"
                      : ""
                }`}
              >
                <Icon size={22} weight={selected ? "fill" : "duotone"} />
                <span className="text-sm">{spec.label}</span>
                {disabled && (
                  <Badge variant="secondary" className="text-[10px]">Coming soon</Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator className="my-8" />

      {/* ── Date range ───────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-zinc-600">Date range</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {([
            { value: "4weeks" as Range, label: "Last 4 weeks" },
            { value: "3months" as Range, label: "Last 3 months" },
            { value: "custom" as Range, label: "Custom" },
          ]).map((opt) => (
            <Button
              key={opt.value}
              variant={range === opt.value ? "secondary" : "outline"}
              size="sm"
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="my-8" />

      {/* ── Report sections ──────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-zinc-600">Report sections</p>

        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox checked disabled />
            <Label className="text-zinc-700">Executive Summary</Label>
            <span className="text-[10px] text-zinc-400">(always included)</span>
          </div>

          {SECTIONS.map((s) => (
            <div key={s.key} className="flex items-center gap-3">
              <Checkbox
                id={s.key}
                checked={sections[s.key]}
                onCheckedChange={() => toggleSection(s.key)}
              />
              <Label htmlFor={s.key} className="cursor-pointer text-zinc-700">{s.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* ── Generate button ──────────────────────────────────────────── */}
      <Button
        size="lg"
        onClick={generate}
        disabled={state === "generating"}
        className="mt-8 w-full gap-2 rounded-2xl py-6 text-base"
      >
        {state === "generating" ? (
          <>
            <Spinner size={22} className="animate-spin" />
            Generating Report…
          </>
        ) : (
          <>
            <Export size={22} weight="duotone" />
            Generate Cardiology Report
          </>
        )}
      </Button>

      {/* ── Status / result ──────────────────────────────────────────── */}
      {state === "done" && pdfUrl && (
        <Card className="mt-6 border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle size={18} weight="fill" />
              Report generated
            </div>

            <div className="mt-3 flex gap-2">
              <Button onClick={downloadPdf} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <FilePdf size={18} weight="fill" />
                Download PDF
              </Button>
            </div>

            <div className="mt-4">
              <iframe
                src={pdfUrl}
                title="Report preview"
                className="h-[600px] w-full rounded-xl border border-emerald-100 bg-white"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {state === "error" && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <Warning size={18} weight="fill" />
              Could not reach backend
            </div>
            <p className="mt-1 text-sm text-amber-600">
              Make sure the backend server is running on {API_BASE}. The report endpoint
              needs to be wired up to serve the cardiology report JSON.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

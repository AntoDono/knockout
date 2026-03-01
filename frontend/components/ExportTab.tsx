"use client";

import { useState } from "react";
import { Export, Heart, Brain, Dna, FirstAid, Spinner, CheckCircle, Warning, FilePdf } from "@phosphor-icons/react";

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

// Report sections that map to the schema (executive summary is always included)
const SECTIONS = [
  { key: "episode_library",            label: "Episode Library",            alwaysOn: false },
  { key: "pharmacokinetic_analysis",   label: "Pharmacokinetic Analysis",   alwaysOn: false },
  { key: "autonomic_trends",           label: "Autonomic Trends",           alwaysOn: false },
  { key: "trigger_analysis",           label: "Trigger Analysis",           alwaysOn: false },
  { key: "supporting_context",         label: "Supporting Context",         alwaysOn: false },
];

// ── API config ───────────────────────────────────────────────────────────

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
    // custom: default to 3 months for now
    else start.setMonth(end.getMonth() - 3);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const generate = async () => {
    setState("generating");
    // Revoke previous blob URL to avoid memory leaks
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);

    try {
      const { start, end } = computeDateRange();

      // Build sections param from checked sections
      const activeSections = SECTIONS.filter((s) => sections[s.key]).map((s) => s.key).join(",");
      const url = `${API_BASE}/report?type=${specialist}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&sections=${activeSections}`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);

      // Extract filename from Content-Disposition header or use a default
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
              <button
                key={spec.id}
                type="button"
                disabled={disabled}
                onClick={() => spec.enabled && setSpecialist(spec.id)}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-3 text-center text-sm font-medium transition ${
                  disabled
                    ? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300"
                    : selected
                      ? "border-sky-400 bg-sky-50 text-sky-700 shadow-[0_2px_12px_rgba(56,189,248,0.15)]"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-sky-200 hover:bg-sky-50/50"
                }`}
              >
                <Icon size={22} weight={selected ? "fill" : "duotone"} />
                <span>{spec.label}</span>
                {disabled && (
                  <span className="text-[10px] font-normal text-zinc-400">Coming soon</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Date range ───────────────────────────────────────────────── */}
      <div className="mt-8">
        <p className="text-sm font-medium text-zinc-600">Date range</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {([
            { value: "4weeks" as Range, label: "Last 4 weeks" },
            { value: "3months" as Range, label: "Last 3 months" },
            { value: "custom" as Range, label: "Custom" },
          ]).map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="range"
                checked={range === opt.value}
                onChange={() => setRange(opt.value)}
                className="h-4 w-4 accent-sky-500"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Report sections ──────────────────────────────────────────── */}
      <div className="mt-8">
        <p className="text-sm font-medium text-zinc-600">Report sections</p>

        {/* Executive summary — always on */}
        <div className="mt-3">
          <label className="flex items-center gap-3 rounded-xl py-2 text-zinc-400">
            <input type="checkbox" checked disabled className="h-4 w-4 rounded accent-sky-500" />
            <span className="text-zinc-700">Executive Summary</span>
            <span className="text-[10px] text-zinc-400">(always included)</span>
          </label>
        </div>

        <ul className="space-y-1">
          {SECTIONS.map((s) => (
            <li key={s.key}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl py-2">
                <input
                  type="checkbox"
                  checked={sections[s.key]}
                  onChange={() => toggleSection(s.key)}
                  className="h-4 w-4 rounded accent-sky-500"
                />
                <span className="text-zinc-700">{s.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Generate button ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={generate}
        disabled={state === "generating"}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-[22px] bg-sky-400 py-4 font-semibold text-white shadow-[0_4px_20px_rgba(56,189,248,0.25)] transition hover:bg-sky-500 disabled:opacity-60"
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
      </button>

      {/* ── Status / result ──────────────────────────────────────────── */}
      {state === "done" && pdfUrl && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle size={18} weight="fill" />
            Report generated
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={downloadPdf}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <FilePdf size={18} weight="fill" />
              Download PDF
            </button>
          </div>

          {/* Inline PDF preview */}
          <div className="mt-4">
            <iframe
              src={pdfUrl}
              title="Report preview"
              className="h-[600px] w-full rounded-xl border border-emerald-100 bg-white"
            />
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <Warning size={18} weight="fill" />
            Could not reach backend
          </div>
          <p className="mt-1 text-sm text-amber-600">
            Make sure the backend server is running on {API_BASE}. The report endpoint
            needs to be wired up to serve the cardiology report JSON.
          </p>
        </div>
      )}
    </div>
  );
}

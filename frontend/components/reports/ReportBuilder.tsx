"use client";
import { useState } from "react";
import { FileText, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchBlob } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SPECIALISTS = [
  { id: "cardiology", label: "Cardiology", available: true },
  { id: "neurology", label: "Neurology", available: false },
  { id: "genetics", label: "Genetics", available: false },
  { id: "pediatrics", label: "Pediatrics", available: false },
];

const SECTIONS = [
  { id: "executive", label: "Executive Summary", locked: true },
  { id: "episode_library", label: "Episode Library", locked: false },
  { id: "pharmacokinetic_analysis", label: "Pharmacokinetic Analysis", locked: false },
  { id: "autonomic_trends", label: "Autonomic Trends", locked: false },
  { id: "trigger_analysis", label: "Trigger Analysis", locked: false },
  { id: "supporting_context", label: "Supporting Context", locked: false },
];

const DATE_RANGES = [
  { label: "4 weeks", value: "4w" },
  { label: "3 months", value: "3m" },
  { label: "6 months", value: "6m" },
];

export function ReportBuilder() {
  const [specialist, setSpecialist] = useState("cardiology");
  const [dateRange, setDateRange] = useState("4w");
  const [selectedSections, setSelectedSections] = useState(new Set(SECTIONS.map((s) => s.id)));
  const [generating, setGenerating] = useState(false);

  const toggleSection = (id: string) => {
    const section = SECTIONS.find((s) => s.id === id);
    if (section?.locked) return;
    const next = new Set(selectedSections);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedSections(next);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const optionalSections = [...selectedSections].filter((s) => s !== "executive");
      const query = optionalSections.length > 0
        ? `?type=${specialist}&sections=${optionalSections.join(",")}`
        : `?type=${specialist}`;

      const blob = await fetchBlob(`/report${query}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `knockout_${specialist}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Specialist</h2>
        <div className="flex flex-wrap gap-2">
          {SPECIALISTS.map((s) => (
            <button key={s.id} onClick={() => s.available && setSpecialist(s.id)} disabled={!s.available}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                s.id === specialist ? "bg-primary text-white" :
                s.available ? "bg-muted text-foreground hover:bg-muted/80" :
                "bg-muted/50 text-muted-foreground cursor-not-allowed"
              )}>
              {s.label}{!s.available && <span className="text-xs ml-1">(Coming soon)</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Date Range</h2>
        <div className="flex gap-2">
          {DATE_RANGES.map((dr) => (
            <button key={dr.value} onClick={() => setDateRange(dr.value)}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                dateRange === dr.value ? "bg-primary text-white" : "bg-muted text-foreground hover:bg-muted/80"
              )}>
              {dr.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Report Sections</h2>
        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => toggleSection(s.id)}
              className={cn("flex items-center gap-3 w-full p-3 rounded-xl text-left transition-colors",
                selectedSections.has(s.id) ? "bg-primary/10 text-foreground" : "bg-muted/50 text-muted-foreground"
              )}>
              <div className={cn("h-4 w-4 rounded border flex items-center justify-center",
                selectedSections.has(s.id) ? "bg-primary border-primary" : "border-border"
              )}>
                {selectedSections.has(s.id) && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">{s.label}</span>
              {s.locked && <Lock className="h-3 w-3 text-muted-foreground ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" className="w-full rounded-xl h-12 text-base" onClick={handleGenerate} disabled={generating}>
        {generating ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</>
        ) : (
          <><FileText className="h-5 w-5 mr-2" />Generate Report</>
        )}
      </Button>
    </div>
  );
}

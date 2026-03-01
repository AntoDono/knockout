"use client";

import { useState, useMemo } from "react";
import { DRUG_OPTIONS } from "@/lib/drugs";
import type { QtRisk } from "@/lib/types";

function riskColor(risk: QtRisk): string {
  if (risk === "none") return "bg-emerald-100 border-emerald-200 text-emerald-800";
  if (risk === "moderate") return "bg-amber-100 border-amber-200 text-amber-800";
  return "bg-red-100 border-red-200 text-red-800";
}

function riskLabel(risk: QtRisk): string {
  if (risk === "none") return "Safe";
  if (risk === "moderate") return "Moderate QT risk";
  return "High QT risk";
}

export function DrugCheckerTab() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return DRUG_OPTIONS.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 5);
  }, [query]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-800">Drug Checker</h1>
      <p className="mt-1 text-zinc-500">Check QT risk before taking a medication.</p>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search medication name..."
        className="mt-6 w-full rounded-[22px] border border-zinc-200 px-5 py-4 text-lg focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
        autoFocus
      />
      <div className="mt-6">
        {query.trim() && results.length === 0 && (
          <p className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-6 text-center text-zinc-500">
            No matches. Try another name.
          </p>
        )}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((drug) => (
              <div
                key={drug.name}
                className={`rounded-[22px] border-2 p-5 ${riskColor(drug.qtRisk)}`}
              >
                <p className="text-lg font-semibold">{drug.name}</p>
                <p className="mt-1 text-sm opacity-90">t½ {drug.tHalfHours}h</p>
                <p className="mt-2 font-medium">{riskLabel(drug.qtRisk)}</p>
                {drug.qtRisk === "high" && (
                  <div className="mt-4 rounded-xl bg-white/80 p-4 text-sm">
                    <p className="font-medium text-red-900">Clinician card</p>
                    <p className="mt-2 text-red-800">
                      I have Triadin Knockout Syndrome (TKOS). This medication may be dangerous for me. Please contact my cardiologist before administering.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

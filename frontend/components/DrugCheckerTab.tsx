"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DRUG_OPTIONS } from "@/lib/drugs";
import type { QtRisk } from "@/lib/types";

function riskColor(risk: QtRisk): string {
  if (risk === "none") return "border-emerald-200 bg-emerald-50";
  if (risk === "moderate") return "border-amber-200 bg-amber-50";
  return "border-red-200 bg-red-50";
}

function riskBadgeVariant(risk: QtRisk) {
  if (risk === "high") return "destructive" as const;
  return "outline" as const;
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
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search medication name..."
        className="mt-6 h-14 rounded-2xl text-lg px-5"
        autoFocus
      />
      <div className="mt-6">
        {query.trim() && results.length === 0 && (
          <Card className="bg-zinc-50">
            <CardContent className="p-6 text-center text-zinc-500">
              No matches. Try another name.
            </CardContent>
          </Card>
        )}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((drug) => (
              <Card key={drug.name} className={`border-2 ${riskColor(drug.qtRisk)}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold">{drug.name}</p>
                      <p className="mt-1 text-sm opacity-90">t½ {drug.tHalfHours}h</p>
                    </div>
                    <Badge variant={riskBadgeVariant(drug.qtRisk)}>
                      {riskLabel(drug.qtRisk)}
                    </Badge>
                  </div>
                  {drug.qtRisk === "high" && (
                    <Card className="mt-4 bg-white/80">
                      <CardContent className="p-4 text-sm">
                        <p className="font-medium text-red-900">Clinician card</p>
                        <p className="mt-2 text-red-800">
                          I have Triadin Knockout Syndrome (TKOS). This medication may be dangerous for me. Please contact my cardiologist before administering.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

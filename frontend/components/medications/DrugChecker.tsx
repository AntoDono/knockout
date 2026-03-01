"use client";
import { useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DRUG_OPTIONS } from "@/lib/data/synthetic";
import { cn } from "@/lib/utils";

export function DrugChecker() {
  const [query, setQuery] = useState("");
  const results = query.length >= 2
    ? DRUG_OPTIONS.filter((d) => d.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Drug Checker</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search medications..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>
      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((drug) => (
            <div key={drug.name} className={cn("flex items-start justify-between p-3 rounded-xl border",
              drug.qtRisk === "high" ? "border-red-200 bg-red-50/50" :
              drug.qtRisk === "moderate" ? "border-amber-200 bg-amber-50/50" : "border-border"
            )}>
              <div className="flex-1 mr-3">
                <p className="text-sm font-medium">{drug.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{drug.description}</p>
                <p className="text-[10px] text-muted-foreground mt-1">t½ {drug.tHalfHours}h</p>
              </div>
              <Badge variant={drug.qtRisk === "high" ? "destructive" : drug.qtRisk === "moderate" ? "outline" : "secondary"}>
                {drug.qtRisk === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}QT: {drug.qtRisk}
              </Badge>
            </div>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && <p className="text-sm text-muted-foreground mt-3">No medications found.</p>}
    </div>
  );
}

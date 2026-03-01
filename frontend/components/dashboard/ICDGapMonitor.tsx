"use client";
import { useFetch } from "@/lib/api";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaticThreshold, Baselines } from "@/lib/types";

interface ICDGapMonitorProps {
  currentHr?: number;
}

export function ICDGapMonitor({ currentHr: liveHr }: ICDGapMonitorProps) {
  const { data: thresholds } = useFetch<StaticThreshold>("/patient/thresholds");
  const { data: baselines } = useFetch<Baselines>("/baselines");

  const lower = thresholds?.icdGapLowerBpm ?? 70;
  const upper = thresholds?.icdGapUpperBpm ?? 190;
  const currentHr = liveHr ?? Math.round(baselines?.hr?.mean ?? 70);
  const pct = ((currentHr - lower) / (upper - lower)) * 100;
  const inGap = currentHr > lower && currentHr < upper;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          ICD Gap Monitor
        </h2>
        {liveHr != null && (
          <span className="ml-auto text-[10px] text-green-500 font-medium uppercase tracking-wider">Live</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {lower} – {upper} bpm blind zone
      </p>
      <div className="relative h-2 w-full rounded-full bg-amber-100 overflow-visible">
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-white shadow-sm transition-all duration-300",
            inGap ? "bg-amber-500" : "bg-primary"
          )}
          style={{ left: `${Math.max(0, Math.min(100, pct))}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{lower} bpm</span>
        <span className="text-sm font-semibold text-foreground">{currentHr} bpm</span>
        <span>{upper} bpm</span>
      </div>
      <p className={cn("text-xs mt-2", inGap ? "text-amber-600" : "text-green-600")}>
        {inGap ? "In ICD blind zone" : "Within paced range"}
      </p>
    </div>
  );
}

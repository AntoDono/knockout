import { THRESHOLDS, BASELINES } from "@/lib/data/synthetic";
import { ShieldAlert } from "lucide-react";

export function ICDGapMonitor() {
  const lower = THRESHOLDS.icdGapLowerBpm;
  const upper = THRESHOLDS.icdGapUpperBpm;
  const currentHr = Math.round(BASELINES.hr.mean);
  const pct = ((currentHr - lower) / (upper - lower)) * 100;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          ICD Gap Monitor
        </h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {lower} – {upper} bpm blind zone
      </p>
      <div className="relative h-2 w-full rounded-full bg-amber-100 overflow-visible">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary border-2 border-white shadow-sm"
          style={{ left: `${Math.max(0, Math.min(100, pct))}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{lower} bpm</span>
        <span className="text-sm font-semibold text-foreground">{currentHr} bpm</span>
        <span>{upper} bpm</span>
      </div>
      <p className="text-xs text-green-600 mt-2">Within paced range</p>
    </div>
  );
}

"use client";
import { TrendingUp, Moon, Pill, ShieldAlert, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { EPISODE_SUMMARY } from "@/lib/data/synthetic";

function PatternChip({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border", color)}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xs font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function EpisodeSummaryPanel() {
  const s = EPISODE_SUMMARY;
  const freqTrend = s.frequencyPerDay > s.baselineFrequencyPerDay ? "up" : "down";

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Pattern Analysis
        </h2>
        <span className="text-[10px] text-muted-foreground ml-auto">Past {s.periodDays} days</span>
      </div>

      {/* Pattern Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <PatternChip
          icon={Pill}
          label="Trough Link"
          value={`${s.troughCorrelationPct}% of episodes`}
          color="border-red-200 bg-red-50/50 text-red-700"
        />
        <PatternChip
          icon={Moon}
          label="Sleep Link"
          value={`${s.sleepCorrelationPct}% of episodes`}
          color="border-amber-200 bg-amber-50/50 text-amber-700"
        />
        <PatternChip
          icon={TrendingUp}
          label="Frequency"
          value={`${s.frequencyPerDay}/day (${freqTrend === "up" ? "\u2191" : "\u2193"} from ${s.baselineFrequencyPerDay})`}
          color={freqTrend === "up" ? "border-red-200 bg-red-50/50 text-red-700" : "border-green-200 bg-green-50/50 text-green-700"}
        />
        <PatternChip
          icon={ShieldAlert}
          label="ICD Gap"
          value={`${s.icdGapPct}% in blind zone`}
          color="border-amber-200 bg-amber-50/50 text-amber-700"
        />
      </div>

      {/* Contributing Factors */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Contributing Factors</p>
        {s.contributingFactors.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground min-w-[140px] truncate">{f.label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  f.color === "red" ? "bg-red-400" : f.color === "amber" ? "bg-amber-400" : "bg-green-400"
                )}
                style={{ width: `${f.correlationPct}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums w-[36px] text-right">{f.correlationPct}%</span>
          </div>
        ))}
      </div>

      {/* AI Narrative */}
      <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
          <Brain className="h-3 w-3" /> AI Summary
        </p>
        <p className="text-sm text-foreground leading-relaxed">{s.narrative}</p>
      </div>
    </div>
  );
}

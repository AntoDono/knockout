"use client";
import { useState } from "react";
import { Heart, Activity, Clock, ChevronDown, Brain } from "lucide-react";
import type { Episode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EPISODE_INSIGHTS } from "@/lib/data/synthetic";
import { EpisodeContext } from "./EpisodeContext";
import { DeviationTag } from "./DeviationTag";
import { TriggerTag } from "./TriggerTag";
import { DrugLevelStack } from "./DrugLevelStack";

interface EpisodeCardProps {
  episode: Episode;
}

export function EpisodeCard({ episode: ep }: EpisodeCardProps) {
  const [now] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const insight = EPISODE_INSIGHTS.find((i) => i.id === ep.id);
  const date = new Date(ep.recordedAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const hoursAgo = Math.round((now - date.getTime()) / (1000 * 60 * 60));
  const timeAgo = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;

  // Use nadolol (primary cardiac drug) level for border color
  const primaryDrug = insight?.deviations.drugLevels[0];
  const borderColor = primaryDrug
    ? primaryDrug.status === "trough" ? "border-l-red-500"
      : primaryDrug.status === "declining" ? "border-l-amber-500"
      : "border-l-green-500"
    : ep.drugLevelPct < 30 ? "border-l-red-500"
      : ep.drugLevelPct < 50 ? "border-l-amber-500" : "border-l-green-500";

  return (
    <div className={cn("rounded-2xl bg-card p-5 shadow-sm border-l-4", borderColor)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{dateStr} at {timeStr}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo}
          </p>
        </div>
        {insight && insight.triggerMatches.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {insight.triggerMatches.map((t) => (
              <TriggerTag key={t.triggerType} triggerType={t.triggerType} source={t.source} />
            ))}
          </div>
        )}
      </div>

      {/* HR and HRV with deviation tags */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">HR</p>
            <p className="font-semibold">
              {ep.heartRate} bpm
              {insight && <> <DeviationTag valuePct={insight.deviations.hrPct} /></>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">HRV</p>
            <p className="font-semibold">
              {ep.hrv} ms
              {insight && <> <DeviationTag valuePct={insight.deviations.hrvPct} /></>}
            </p>
          </div>
        </div>
      </div>

      {/* Drug level stack */}
      {insight && <DrugLevelStack drugLevels={insight.deviations.drugLevels} />}

      {/* AI narrative */}
      {insight && (
        <div className="rounded-xl bg-muted/30 p-3 border border-border/50 mt-3">
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Brain className="h-3 w-3" /> AI Insight
          </p>
          <p className="text-xs text-foreground leading-relaxed">{insight.narrative}</p>
        </div>
      )}

      {ep.notes && <p className="text-xs text-muted-foreground mt-3 italic">{ep.notes}</p>}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        {expanded ? "Hide" : "View"} 24h context
      </button>

      {expanded && <EpisodeContext episode={ep} />}
    </div>
  );
}

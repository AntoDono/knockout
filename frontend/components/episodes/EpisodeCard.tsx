"use client";
import { useState } from "react";
import { Heart, Activity, Pill, Clock, ChevronDown } from "lucide-react";
import type { Episode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EpisodeContext } from "./EpisodeContext";

interface EpisodeCardProps {
  episode: Episode;
}

export function EpisodeCard({ episode: ep }: EpisodeCardProps) {
  const [now] = useState(() => Date.now());
  const [expanded, setExpanded] = useState(false);
  const date = new Date(ep.recordedAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const hoursAgo = Math.round((now - date.getTime()) / (1000 * 60 * 60));
  const timeAgo = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;

  return (
    <div className={cn(
      "rounded-2xl bg-card p-5 shadow-sm border-l-4",
      ep.drugLevelPct < 30 ? "border-l-red-500" :
      ep.drugLevelPct < 50 ? "border-l-amber-500" : "border-l-green-500"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{dateStr} at {timeStr}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo}
          </p>
        </div>
        <span className={cn(
          "text-lg font-bold px-2.5 py-0.5 rounded-lg",
          ep.drugLevelPct < 30 ? "bg-red-100 text-red-700" :
          ep.drugLevelPct < 50 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
        )}>{ep.drugLevelPct}%</span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-red-500" />
          <div><p className="text-xs text-muted-foreground">HR</p><p className="font-semibold">{ep.heartRate} bpm</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <div><p className="text-xs text-muted-foreground">HRV</p><p className="font-semibold">{ep.hrv} ms</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Pill className="h-3.5 w-3.5 text-primary" />
          <div><p className="text-xs text-muted-foreground">Drug</p><p className="font-semibold">{ep.drugLevelPct}%</p></div>
        </div>
      </div>

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

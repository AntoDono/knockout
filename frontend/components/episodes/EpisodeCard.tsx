"use client";
import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
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
    <div className="rounded-2xl bg-card p-5 shadow-sm border-l-4 border-l-primary">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{dateStr} at {timeStr}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo}
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-muted text-muted-foreground capitalize">
          {ep.source?.replace("_", " ") ?? "patient tap"}
        </span>
      </div>

      {ep.notes && <p className="text-xs text-muted-foreground italic">{ep.notes}</p>}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        {expanded ? "Hide" : "View"} 24h context
      </button>

      {expanded && <EpisodeContext episodeId={ep.id} />}
    </div>
  );
}

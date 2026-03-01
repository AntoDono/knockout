"use client";

import { Lightning } from "@phosphor-icons/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Episode } from "@/lib/types";

function levelAccent(level: number) {
  if (level < 30) return { border: "border-l-red-400", bg: "bg-red-50/60", tag: "destructive" as const };
  if (level < 50) return { border: "border-l-amber-400", bg: "bg-amber-50/40", tag: "outline" as const };
  return { border: "border-l-sky-400", bg: "bg-sky-50/40", tag: "secondary" as const };
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function timeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  episodes: Episode[];
  highlightId: string | null;
  onSelect: (id: string) => void;
}

export function EpisodeLog({ episodes, highlightId, onSelect }: Props) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-row items-center gap-2 space-y-0">
        <Lightning size={14} weight="bold" className="text-amber-500" />
        <CardTitle className="text-xs uppercase tracking-wide text-slate-400">Episodes</CardTitle>
        <Badge variant="secondary" className="ml-auto tabular-nums">
          {episodes.length}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {episodes.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No episodes logged yet.</p>
          ) : (
            <div className="space-y-1.5">
              {episodes.map((ep) => {
                const accent = levelAccent(ep.drugLevel);
                const selected = highlightId === ep.id;
                return (
                  <button
                    type="button"
                    key={ep.id}
                    onClick={() => onSelect(ep.id)}
                    className={`w-full rounded-xl border-l-[3px] px-3 py-2.5 text-left transition-all ${accent.border} ${accent.bg} ${
                      selected ? "ring-2 ring-amber-300 ring-offset-1" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{formatTime(ep.timestamp)}</span>
                      <span className="text-[11px] text-slate-400">{timeAgo(ep.timestamp)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-600 tabular-nums">HR {ep.heartRate}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-600 tabular-nums">HRV {ep.hrv}ms</span>
                      <Badge variant={accent.tag} className="ml-auto text-[10px] px-1.5 py-0.5">
                        {ep.drugLevel}%
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

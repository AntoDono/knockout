"use client";

import type { Episode } from "@/lib/types";

function drugLevelColor(level: number): string {
  if (level < 30) return "bg-red-100 text-red-800 border-red-200";
  if (level < 50) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-sky-100 text-sky-800 border-sky-200";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

interface Props {
  episodes: Episode[];
  highlightId: string | null;
  onSelect: (id: string) => void;
}

export function EpisodeLog({ episodes, highlightId, onSelect }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-[22px] bg-white p-3 shadow-[0_4px_20px_rgba(56,189,248,0.08)]">
      <p className="mb-2 shrink-0 text-sm font-medium text-zinc-500">Episode log</p>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {episodes.length === 0 ? (
          <p className="text-sm text-zinc-400">No episodes logged yet.</p>
        ) : (
          episodes.map((ep) => (
            <button
              type="button"
              key={ep.id}
              onClick={() => onSelect(ep.id)}
              className={`w-full rounded-xl border p-2 text-left text-sm transition ${drugLevelColor(ep.drugLevel)} ${highlightId === ep.id ? "ring-2 ring-amber-400" : ""}`}
            >
              <span className="font-medium">{formatTime(ep.timestamp)}</span>
              <span className="mx-2">·</span>
              <span>HR {ep.heartRate}</span>
              <span className="mx-1">·</span>
              <span>HRV {ep.hrv}ms</span>
              <span className="mx-1">·</span>
              <span>Drug {ep.drugLevel}%</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

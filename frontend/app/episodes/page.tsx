"use client";
import { useState } from "react";
import { EPISODES } from "@/lib/data/synthetic";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { cn } from "@/lib/utils";

const FILTERS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "All", days: null },
] as const;

export default function EpisodesPage() {
  const [now] = useState(() => Date.now());
  const [filterDays, setFilterDays] = useState<number | null>(null);

  const filtered = filterDays
    ? EPISODES.filter((ep) => {
        const epTime = new Date(ep.recordedAt).getTime();
        return now - epTime <= filterDays * 24 * 60 * 60 * 1000;
      })
    : EPISODES;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Episodes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} episode{filtered.length !== 1 ? "s" : ""} · Sorted by most recent
          </p>
        </div>
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilterDays(f.days)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filterDays === f.days
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((ep) => <EpisodeCard key={ep.id} episode={ep} />)
        ) : (
          <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
            <p className="text-sm text-muted-foreground">No episodes in this time range.</p>
          </div>
        )}
      </div>
    </div>
  );
}

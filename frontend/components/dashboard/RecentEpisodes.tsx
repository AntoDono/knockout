"use client";
import { useState } from "react";
import Link from "next/link";
import { EPISODES } from "@/lib/data/synthetic";
import { cn } from "@/lib/utils";

export function RecentEpisodes() {
  const [now] = useState(() => Date.now());
  const recent = EPISODES.slice(0, 4);

  function timeAgo(dateStr: string): string {
    const diff = now - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Recent Episodes
        </h2>
        <Link href="/episodes" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {recent.map((ep) => (
          <div
            key={ep.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border",
              ep.drugLevelPct < 30 ? "border-red-200 bg-red-50/50" :
              ep.drugLevelPct < 50 ? "border-amber-200 bg-amber-50/50" :
              "border-border bg-muted/30"
            )}
          >
            <div className={cn(
              "h-2 w-2 rounded-full flex-shrink-0",
              ep.drugLevelPct < 30 ? "bg-red-500" :
              ep.drugLevelPct < 50 ? "bg-amber-500" :
              "bg-green-500"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{timeAgo(ep.recordedAt)}</p>
              <p className="text-xs text-muted-foreground">
                HR {ep.heartRate} · HRV {ep.hrv} ms
              </p>
            </div>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              ep.drugLevelPct < 30 ? "bg-red-100 text-red-700" :
              ep.drugLevelPct < 50 ? "bg-amber-100 text-amber-700" :
              "bg-green-100 text-green-700"
            )}>
              {ep.drugLevelPct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

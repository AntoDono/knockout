"use client";
import { useState } from "react";
import Link from "next/link";
import { useFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Episode } from "@/lib/types";

export function RecentEpisodes() {
  const [now] = useState(() => Date.now());
  const { data: episodes } = useFetch<Episode[]>("/episodes");
  const recent = (episodes ?? []).slice(0, 4);

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
        {recent.length === 0 && (
          <p className="text-sm text-muted-foreground">No episodes recorded yet.</p>
        )}
        {recent.map((ep) => (
          <div
            key={ep.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30"
            )}
          >
            <div className="h-2 w-2 rounded-full shrink-0 bg-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{timeAgo(ep.recordedAt)}</p>
              <p className="text-xs text-muted-foreground">
                {ep.notes ?? ep.source ?? "Patient tap"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

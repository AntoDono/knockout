"use client";
import Link from "next/link";
import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrugLevel } from "@/lib/types";

interface ActiveMedsProps {
  drugLevels: DrugLevel[];
}

export function ActiveMeds({ drugLevels }: ActiveMedsProps) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Active Medications
        </h2>
        <Link href="/medications" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>

      {drugLevels.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Awaiting simulation…
        </p>
      ) : (
        <div className="space-y-3">
          {drugLevels.map((dl) => {
            const level = Math.round(dl.pctRemaining);
            return (
              <div key={dl.drug} className="flex items-center gap-3">
                <Pill className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {dl.drug}
                    </p>
                    <span className={cn(
                      "text-xs font-semibold",
                      level >= 50 ? "text-primary" : level >= 30 ? "text-amber-500" : "text-red-500"
                    )}>
                      {level}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        level >= 50 ? "bg-primary" : level >= 30 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${level}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {dl.remainingMg.toFixed(1)} mg remaining · t½ {dl.halfLifeH}h
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

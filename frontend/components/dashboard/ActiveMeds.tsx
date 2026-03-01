"use client";
import Link from "next/link";
import { MEDICATIONS } from "@/lib/data/synthetic";
import { getCurrentDrugLevel } from "@/lib/simulate";
import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActiveMeds() {
  const cardiacMeds = MEDICATIONS.filter((m) => m.isCardiac && m.halfLifeHours);

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
      <div className="space-y-3">
        {cardiacMeds.map((med) => {
          if (!med.halfLifeHours) return null;
          const level = getCurrentDrugLevel(med.halfLifeHours, med.doseTimes);

          return (
            <div key={med.id} className="flex items-center gap-3">
              <Pill className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground capitalize">
                    {med.drugName} {med.doseMg}mg
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
                  {med.frequency.replace("_", " ")} · t½ {med.halfLifeHours}h
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

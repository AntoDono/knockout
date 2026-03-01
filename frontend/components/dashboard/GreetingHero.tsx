"use client";
import { useState } from "react";
import { PATIENT } from "@/lib/data/synthetic";
import { Badge } from "@/components/ui/badge";

export function GreetingHero() {
  const [now] = useState(() => new Date());
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{dateStr}</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
        Hi, {PATIENT.firstName}.
      </h1>
      <p className="text-base text-muted-foreground">
        Let&apos;s check your heart today.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Badge variant="secondary" className="text-xs">Stable</Badge>
        <Badge variant="secondary" className="text-xs">Medicated</Badge>
        <Badge variant="secondary" className="text-xs">Resting</Badge>
      </div>
    </div>
  );
}

"use client";
import { useMemo, useState } from "react";
import { MEDICATIONS } from "@/lib/data/synthetic";
import { decayConcentration } from "@/lib/simulate";

export interface PKDataPoint {
  time: number;
  label: string;
  drugLevel: number;
  hrv: number;
}

export function usePKData(windowHours = 48) {
  const [mountTime] = useState(() => Date.now());

  return useMemo(() => {
    const nadolol = MEDICATIONS.find((m) => m.drugName === "nadolol");
    if (!nadolol?.halfLifeHours) return { data: [], nowTime: mountTime, troughZones: [] };

    const halfWindow = (windowHours / 2) * 60 * 60 * 1000;
    const start = mountTime - halfWindow;
    const end = mountTime + halfWindow;
    const points: PKDataPoint[] = [];

    for (let t = start; t <= end; t += 30 * 60 * 1000) {
      const d = new Date(t);
      const doseHours = [9, 20];
      let minHours = Infinity;
      let lastDose = new Date(d);

      for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
        for (const dh of doseHours) {
          const dose = new Date(d);
          dose.setDate(dose.getDate() - dayOffset);
          dose.setHours(dh, 0, 0, 0);
          if (dose <= d) {
            const hoursSince = (d.getTime() - dose.getTime()) / (1000 * 60 * 60);
            if (hoursSince < minHours) {
              minHours = hoursSince;
              lastDose = dose;
            }
          }
        }
      }

      const drugLevel = decayConcentration(lastDose, nadolol.halfLifeHours, d);
      const hrvBase = 44;
      const hrvDelta = drugLevel < 30 ? -14 : drugLevel < 50 ? -6 : 0;
      const hrv = hrvBase + hrvDelta + Math.sin(t / 3600000) * 3;

      points.push({
        time: t,
        label: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        drugLevel: Math.round(drugLevel * 10) / 10,
        hrv: Math.round(hrv * 10) / 10,
      });
    }

    // Compute trough zones
    const troughZones: { start: number; end: number }[] = [];
    let troughStart: number | null = null;
    for (const p of points) {
      if (p.drugLevel < 30 && troughStart === null) {
        troughStart = p.time;
      } else if (p.drugLevel >= 30 && troughStart !== null) {
        troughZones.push({ start: troughStart, end: p.time });
        troughStart = null;
      }
    }
    if (troughStart !== null && points.length > 0) {
      troughZones.push({ start: troughStart, end: points[points.length - 1].time });
    }

    return { data: points, nowTime: mountTime, troughZones };
  }, [mountTime, windowHours]);
}

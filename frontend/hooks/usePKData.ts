"use client";

import { useMemo } from "react";
import type { Medication } from "@/lib/types";
import { decayConcentration } from "@/lib/simulate";

const HOUR_MS = 60 * 60 * 1000;
const WINDOW_HOURS = 48;
const POINTS_PER_HOUR = 2;

export function usePKData(
  medications: Medication[],
  episodes: { timestamp: number }[]
) {
  const now = Date.now();
  const windowStart = now - 24 * HOUR_MS;
  const windowEnd = now + 24 * HOUR_MS;

  return useMemo(() => {
    const primaryDrug = medications.find((m) => m.visibleOnChart && m.name === "Nadolol") ?? medications[0];
    if (!primaryDrug) {
      return {
        pkPoints: [] as { t: number; concentration: number }[],
        hrvPoints: [] as { t: number; hrv: number }[],
        troughZones: [] as { start: number; end: number }[],
        doseTimes: [] as number[],
        episodeTimes: [] as number[],
        now,
        windowStart,
        windowEnd,
      };
    }

    const pkPoints: { t: number; concentration: number }[] = [];
    const hrvPoints: { t: number; hrv: number }[] = [];
    const step = HOUR_MS / POINTS_PER_HOUR;
    const TROUGH_THRESHOLD = 30;
    const troughZones: { start: number; end: number }[] = [];
    let zoneStart: number | null = null;

    for (let t = windowStart; t <= windowEnd; t += step) {
      const conc = decayConcentration(
        primaryDrug.lastDoseAt || t - 24 * HOUR_MS,
        primaryDrug.tHalfHours,
        t
      );
      pkPoints.push({ t, concentration: conc });

      const inTrough = conc < TROUGH_THRESHOLD;
      const hrvBase = inTrough ? 44 - 18 : 44;
      const hrvNoise = 2 + Math.sin(t / (2 * HOUR_MS)) * 4;
      hrvPoints.push({ t, hrv: Math.max(18, Math.min(80, hrvBase + hrvNoise)) });

      if (inTrough && zoneStart === null) zoneStart = t;
      if (!inTrough && zoneStart !== null) {
        troughZones.push({ start: zoneStart, end: t });
        zoneStart = null;
      }
    }
    if (zoneStart !== null) {
      troughZones.push({ start: zoneStart, end: windowEnd });
    }

    const doseTimes = medications.flatMap((m) =>
      m.lastDoseAt > 0 ? [m.lastDoseAt] : []
    );
    const episodeTimes = episodes.map((e) => e.timestamp);

    return {
      pkPoints,
      hrvPoints,
      troughZones,
      doseTimes,
      episodeTimes,
      now,
      windowStart,
      windowEnd,
    };
  }, [medications, episodes, now]);
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Vitals } from "@/lib/types";
import { nextVitals } from "@/lib/simulate";

const INTERVAL_MS = 1500;

const HR_BASELINE = 78;
const HRV_BASELINE = 44;

/** Deterministic initial vitals so server and client render the same (avoids hydration mismatch). */
const INITIAL_VITALS: Vitals = {
  heartRate: HR_BASELINE,
  hrv: HRV_BASELINE,
  activity: "Resting",
  barometer: 1013,
  barometerStability: "stable",
};

const INITIAL_HISTORY = {
  hr: [HR_BASELINE, HR_BASELINE],
  hrv: [HRV_BASELINE, HRV_BASELINE],
};

export function useVitals(getDrugLevel: () => number) {
  const [vitals, setVitals] = useState<Vitals>(INITIAL_VITALS);
  const [history, setHistory] = useState<{ hr: number[]; hrv: number[] }>(INITIAL_HISTORY);

  const tick = useCallback(() => {
    const level = getDrugLevel();
    const next = nextVitals(level);
    setVitals(next);
    setHistory((h) => ({
      hr: [...h.hr.slice(-29), next.heartRate].slice(-30),
      hrv: [...h.hrv.slice(-29), next.hrv].slice(-30),
    }));
  }, [getDrugLevel]);

  useEffect(() => {
    tick();
    const id = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(id);
  }, [tick]);

  return { vitals, history };
}

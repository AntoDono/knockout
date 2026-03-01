"use client";
import { useState, useEffect } from "react";
import { BASELINES, MEDICATIONS } from "@/lib/data/synthetic";
import { getCurrentDrugLevel } from "@/lib/simulate";

interface Vitals {
  hr: number;
  hrv: number;
  drugLevel: number;
}

export function useVitals(intervalMs = 5000): Vitals {
  const [vitals, setVitals] = useState<Vitals>(() => {
    const nadolol = MEDICATIONS.find((m) => m.drugName === "nadolol");
    const drugLevel = nadolol?.halfLifeHours
      ? getCurrentDrugLevel(nadolol.halfLifeHours, nadolol.doseTimes)
      : 0;
    return {
      hr: BASELINES.hr.mean,
      hrv: BASELINES.hrv.mean,
      drugLevel,
    };
  });

  useEffect(() => {
    const tick = () => {
      const nadolol = MEDICATIONS.find((m) => m.drugName === "nadolol");
      const drugLevel = nadolol?.halfLifeHours
        ? getCurrentDrugLevel(nadolol.halfLifeHours, nadolol.doseTimes)
        : 0;

      // Simulate small natural variation around baselines
      const hrJitter = (Math.random() - 0.5) * 4;
      const hrvJitter = (Math.random() - 0.5) * 6;
      // Trough effect: HR rises, HRV drops when drug is low
      const troughHrBoost = drugLevel < 30 ? 8 : drugLevel < 50 ? 3 : 0;
      const troughHrvDrop = drugLevel < 30 ? -10 : drugLevel < 50 ? -4 : 0;

      setVitals({
        hr: Math.round(BASELINES.hr.mean + hrJitter + troughHrBoost),
        hrv: Math.round(BASELINES.hrv.mean + hrvJitter + troughHrvDrop),
        drugLevel,
      });
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return vitals;
}

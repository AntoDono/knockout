"use client";
import { useState, useEffect } from "react";
import { useFetch } from "@/lib/api";
import { useHeartSocket } from "@/hooks/useHeartSocket";
import type { Baselines } from "@/lib/types";

const FALLBACK_HR = 74;
const FALLBACK_HRV = 42;

interface Vitals {
  hr: number;
  hrv: number;
  drugLevel: number;
}

export function useVitals(intervalMs = 5000): Vitals {
  const socket = useHeartSocket();
  const { data: baselines } = useFetch<Baselines>("/baselines");

  const meanHrv = baselines?.hrv?.mean ?? FALLBACK_HRV;

  const [fallbackVitals, setFallbackVitals] = useState<Vitals>({
    hr: FALLBACK_HR,
    hrv: FALLBACK_HRV,
    drugLevel: 0,
  });

  // Fallback jitter simulation when WebSocket has no BPM data
  const hasLiveBpm = socket.connected && socket.latestBpm !== null;

  useEffect(() => {
    if (hasLiveBpm) return;

    const meanHr = baselines?.hr?.mean ?? FALLBACK_HR;
    const tick = () => {
      const hrJitter = (Math.random() - 0.5) * 4;
      const hrvJitter = (Math.random() - 0.5) * 6;
      setFallbackVitals({
        hr: Math.round(meanHr + hrJitter),
        hrv: Math.round(meanHrv + hrvJitter),
        drugLevel: 0,
      });
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, hasLiveBpm, baselines?.hr?.mean, meanHrv]);

  if (hasLiveBpm) {
    const drugPct = socket.drugLevels?.[0]?.pctRemaining ?? 0;
    const hrvFromAfib = socket.afib?.rmssdMs;
    return {
      hr: Math.round(socket.latestBpm!),
      hrv: hrvFromAfib != null ? Math.round(hrvFromAfib) : Math.round(meanHrv),
      drugLevel: Math.round(drugPct),
    };
  }

  return fallbackVitals;
}

export { useHeartSocket };

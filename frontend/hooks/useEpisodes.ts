"use client";

import { useState, useCallback } from "react";
import type { Episode } from "@/lib/types";

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;

function makeEpisode(
  id: string,
  ts: number,
  hr: number,
  hrv: number,
  drug: number
): Episode {
  return { id, timestamp: ts, heartRate: hr, hrv, drugLevel: drug };
}

const PRESEED: Episode[] = [
  makeEpisode("e1", NOW - 20 * HOUR, 92, 26, 28),
  makeEpisode("e2", NOW - 14 * HOUR, 88, 24, 25),
  makeEpisode("e3", NOW - 8 * HOUR, 95, 22, 27),
  makeEpisode("e4", NOW - 2 * HOUR, 90, 28, 29),
];

export function useEpisodes() {
  const [episodes, setEpisodes] = useState<Episode[]>(PRESEED);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const addEpisode = useCallback(
    (hr: number, hrv: number, drugLevel: number) => {
      const ts = Date.now();
      const id = `ep-${ts}`;
      setEpisodes((prev) => [
        { id, timestamp: ts, heartRate: hr, hrv, drugLevel },
        ...prev,
      ]);
      return id;
    },
    []
  );

  return {
    episodes,
    highlightId,
    setHighlightId,
    addEpisode,
  };
}

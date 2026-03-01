"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { camelizeKeys } from "@/lib/api";
import type { HeartUpdate, AfibData, DrugLevel } from "@/lib/types";

const RECONNECT_MS = 3000;
const MAX_HISTORY = 500;

function getWsUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  return base.replace(/^http/, "ws") + "/ws";
}

export interface BpmPoint {
  time: number;
  bpm: number;
}

export interface DrugLevelPoint {
  time: number;
  drug: string;
  pct: number;
  mg: number;
  halfLifeH: number;
}

interface HeartSocketState {
  connected: boolean;
  latestBpm: number | null;
  afib: AfibData | null;
  drugLevels: DrugLevel[];
  simName: string | null;
  simTimeS: number | null;
  bpmHistory: BpmPoint[];
  drugLevelHistory: DrugLevelPoint[];
}

export function useHeartSocket(): HeartSocketState {
  const [state, setState] = useState<HeartSocketState>({
    connected: false,
    latestBpm: null,
    afib: null,
    drugLevels: [],
    simName: null,
    simTimeS: null,
    bpmHistory: [],
    drugLevelHistory: [],
  });

  const bpmRef = useRef<BpmPoint[]>([]);
  const drugRef = useRef<DrugLevelPoint[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessage = useCallback((msg: HeartUpdate) => {
    const now = Date.now();

    if (msg.latestBpm != null) {
      bpmRef.current.push({ time: now, bpm: msg.latestBpm });
      if (bpmRef.current.length > MAX_HISTORY) {
        bpmRef.current = bpmRef.current.slice(-MAX_HISTORY);
      }
    }

    if (Array.isArray(msg.drugLevels)) {
      for (const dl of msg.drugLevels) {
        drugRef.current.push({ time: now, drug: dl.drug, pct: dl.pctRemaining, mg: dl.remainingMg, halfLifeH: dl.halfLifeH });
      }
      if (drugRef.current.length > MAX_HISTORY) {
        drugRef.current = drugRef.current.slice(-MAX_HISTORY);
      }
    }

    setState({
      connected: true,
      latestBpm: msg.latestBpm,
      afib: msg.afib,
      drugLevels: msg.drugLevels ?? [],
      simName: msg.simName ?? null,
      simTimeS: msg.simTimeS ?? null,
      bpmHistory: [...bpmRef.current],
      drugLevelHistory: [...drugRef.current],
    });
  }, []);

  useEffect(() => {
    let alive = true;

    function connect() {
      if (!alive) return;
      if (retryRef.current) clearTimeout(retryRef.current);

      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (alive) setState((s) => ({ ...s, connected: true }));
      };

      ws.onmessage = (e) => {
        if (!alive) return;
        try {
          const parsed = camelizeKeys(JSON.parse(e.data)) as HeartUpdate;
          handleMessage(parsed);
        } catch { /* ignore malformed messages */ }
      };

      ws.onclose = () => {
        if (alive) {
          setState((s) => ({ ...s, connected: false }));
          retryRef.current = setTimeout(connect, RECONNECT_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      alive = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [handleMessage]);

  return state;
}

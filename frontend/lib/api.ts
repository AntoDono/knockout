"use client";
import { useState, useEffect, useCallback } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function camelizeKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function camelizeKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(camelizeKeys);
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [camelizeKey(k), camelizeKeys(v)])
    );
  }
  return obj;
}

function snakeizeKey(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function snakeizeKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(snakeizeKeys);
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [snakeizeKey(k), snakeizeKeys(v)])
    );
  }
  return obj;
}

export async function fetchAPI<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const json = await res.json();
  return camelizeKeys(json) as T;
}

export async function mutate<T>(
  path: string,
  body: Record<string, unknown>,
  method: "POST" | "DELETE" = "POST"
): Promise<T> {
  return fetchAPI<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snakeizeKeys(body)),
  });
}

export async function fetchBlob(path: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.blob();
}

interface UseFetchResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
}

export function useFetch<T>(path: string | null): UseFetchResult<T> {
  const [state, setState] = useState<{
    data: T | null;
    error: Error | null;
    loading: boolean;
  }>({ data: null, error: null, loading: !!path });
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;

    fetchAPI<T>(path)
      .then((d) => {
        if (!cancelled) setState({ data: d, error: null, loading: false });
      })
      .catch((e) => {
        if (!cancelled) setState((s) => ({ ...s, error: e, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  return { ...state, refetch };
}

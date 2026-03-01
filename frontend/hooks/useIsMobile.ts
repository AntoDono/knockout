"use client";
import { useSyncExternalStore } from "react";

export function useIsMobile(breakpoint = 640) {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches,
    () => false,
  );
}

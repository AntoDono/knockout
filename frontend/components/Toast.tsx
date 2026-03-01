"use client";

import { useEffect } from "react";

interface Props {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 4000 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div
      role="alert"
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-zinc-800 px-5 py-3 text-sm font-medium text-white shadow-lg md:bottom-6"
    >
      {message}
    </div>
  );
}

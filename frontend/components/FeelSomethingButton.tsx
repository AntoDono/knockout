"use client";

import { Heart } from "@phosphor-icons/react";

interface Props {
  onClick: () => void;
  mobile?: boolean;
}

export function FeelSomethingButton({ onClick, mobile }: Props) {
  const base = "flex items-center justify-center gap-2 rounded-[22px] font-semibold transition shadow-[0_4px_20px_rgba(56,189,248,0.2)] bg-sky-400 text-white hover:bg-sky-500 active:scale-[0.98]";
  const size = mobile
    ? "fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,320px)] py-4 text-lg"
    : "w-full py-3 text-base";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${size}`}
      aria-label="I feel something - log episode"
    >
      <Heart size={22} weight="duotone" />
      I feel something
    </button>
  );
}

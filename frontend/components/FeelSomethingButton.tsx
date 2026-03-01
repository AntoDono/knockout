"use client";

import { Heart } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface Props {
  onClick: () => void;
  mobile?: boolean;
}

export function FeelSomethingButton({ onClick, mobile }: Props) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      className={`gap-2 rounded-2xl font-bold bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 active:scale-[0.97] active:shadow-sm ${
        mobile
          ? "fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,320px)] py-4 text-base h-auto"
          : "w-full py-3 text-sm h-auto"
      }`}
      aria-label="I feel something - log episode"
    >
      <Heart size={20} weight="fill" className="animate-pulse-live" />
      I feel something
    </Button>
  );
}

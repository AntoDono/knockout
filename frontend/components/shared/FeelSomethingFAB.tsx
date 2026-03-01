"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "@/lib/api";

export function FeelSomethingFAB() {
  const [posting, setPosting] = useState(false);

  const handleTap = async () => {
    if (posting) return;
    setPosting(true);
    try {
      await mutate("/episodes", {});
      toast.success("Episode captured", {
        description: "24-hour context saved automatically.",
      });
    } catch {
      toast.error("Failed to capture episode");
    } finally {
      setPosting(false);
    }
  };

  return (
    <button
      onClick={handleTap}
      disabled={posting}
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-transform hover:scale-105 active:scale-95 disabled:opacity-70"
      aria-label="Feel something — capture episode"
    >
      <Heart className="h-6 w-6 animate-pulse-live" fill="currentColor" />
    </button>
  );
}

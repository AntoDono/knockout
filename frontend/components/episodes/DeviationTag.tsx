"use client";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DeviationTagProps {
  valuePct: number;  // positive = above baseline, negative = below
  thresholds?: { amber: number; red: number };  // absolute % thresholds
}

const DEFAULT_THRESHOLDS = { amber: 15, red: 20 };

export function DeviationTag({ valuePct, thresholds = DEFAULT_THRESHOLDS }: DeviationTagProps) {
  const abs = Math.abs(valuePct);
  const color = abs >= thresholds.red ? "text-red-600 bg-red-50"
    : abs >= thresholds.amber ? "text-amber-600 bg-amber-50"
    : "text-green-600 bg-green-50";
  const Icon = valuePct > 2 ? TrendingUp : valuePct < -2 ? TrendingDown : Minus;
  const sign = valuePct > 0 ? "+" : "";

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md", color)}>
      <Icon className="h-2.5 w-2.5" />
      {sign}{valuePct}%
    </span>
  );
}

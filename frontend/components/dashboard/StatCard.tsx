import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  subtitle?: string;
  progress?: number;
  accentColor?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  deltaDirection,
  subtitle,
  progress,
  accentColor = "text-primary",
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm min-w-[160px] flex-1">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("h-4 w-4", accentColor)} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {delta && (
        <p className={cn(
          "text-xs mt-1",
          deltaDirection === "up" ? "text-red-500" :
          deltaDirection === "down" ? "text-amber-500" :
          "text-muted-foreground"
        )}>
          {deltaDirection === "up" ? "\u25B2" : deltaDirection === "down" ? "\u25BC" : ""} {delta}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progress >= 50 ? "bg-primary" : progress >= 30 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

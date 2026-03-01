import { Pill, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrugLevelSnapshot } from "@/lib/types";

interface DrugLevelStackProps {
  drugLevels: DrugLevelSnapshot[];
}

function statusLabel(status: DrugLevelSnapshot["status"]): string {
  switch (status) {
    case "therapeutic": return "Therapeutic";
    case "declining": return "Declining";
    case "trough": return "Trough";
    case "taken": return "Taken";
    case "not_taken": return "Not taken";
  }
}

function statusColor(status: DrugLevelSnapshot["status"]): string {
  switch (status) {
    case "therapeutic": return "text-green-700 bg-green-50";
    case "declining": return "text-amber-700 bg-amber-50";
    case "trough": return "text-red-700 bg-red-50";
    case "taken": return "text-green-700 bg-green-50";
    case "not_taken": return "text-muted-foreground bg-muted/50";
  }
}

export function DrugLevelStack({ drugLevels }: DrugLevelStackProps) {
  return (
    <div className="space-y-1.5">
      {drugLevels.map((drug) => (
        <div key={drug.drugName} className="flex items-center gap-2 text-xs">
          <Pill className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground min-w-[90px] truncate">
            {drug.brandName ?? drug.drugName}
          </span>
          {drug.levelPct !== null ? (
            <span className={cn("font-semibold tabular-nums", drug.status === "trough" ? "text-red-600" : drug.status === "declining" ? "text-amber-600" : "text-foreground")}>
              {drug.levelPct}%
            </span>
          ) : (
            drug.status === "taken" ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", statusColor(drug.status))}>
            {statusLabel(drug.status)}
          </span>
        </div>
      ))}
    </div>
  );
}

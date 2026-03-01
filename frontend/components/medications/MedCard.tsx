"use client";
import { useState } from "react";
import { Pill, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Medication, DrugLevel } from "@/lib/types";
import { useFetch, mutate } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DRUG_OPTIONS } from "@/lib/data/synthetic";

interface MedCardProps {
  medication: Medication;
}

export function MedCard({ medication: med }: MedCardProps) {
  const [now] = useState(() => Date.now());
  const { data: levels, refetch } = useFetch<DrugLevel[]>("/levels");

  const lvl = levels?.find((l) => l.drug === med.drugName);
  const level = lvl ? Math.round(lvl.pctRemaining) : 0;
  const drugInfo = DRUG_OPTIONS.find((d) => d.name.toLowerCase() === med.drugName.toLowerCase());

  const lastDose = lvl?.doses?.length
    ? lvl.doses.reduce((a, b) => (new Date(a.takenAt) > new Date(b.takenAt) ? a : b))
    : null;
  const hoursSinceDose = lastDose
    ? Math.round((now - new Date(lastDose.takenAt).getTime()) / (1000 * 60 * 60))
    : 0;

  const handleTookDose = async () => {
    try {
      await mutate("/doses", { drug: med.drugName, amountMg: med.doseMg });
      toast.success("Dose logged", { description: `${med.drugName} ${med.doseMg}mg recorded.` });
      refetch();
    } catch {
      toast.error("Failed to log dose");
    }
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground capitalize">{med.drugName}</h3>
            {med.brandName && <p className="text-xs text-muted-foreground">{med.brandName}</p>}
          </div>
        </div>
        {med.halfLifeHours && (
          <span className={cn(
            "text-2xl font-bold",
            level >= 50 ? "text-primary" : level >= 30 ? "text-amber-500" : "text-red-500"
          )}>{level}%</span>
        )}
      </div>

      {drugInfo && (
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{drugInfo.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div><p className="text-xs text-muted-foreground">Dose</p><p className="font-medium">{med.doseMg} {med.doseUnit}</p></div>
        <div><p className="text-xs text-muted-foreground">Frequency</p><p className="font-medium">{med.frequency.replace(/_/g, " ")}</p></div>
        {med.halfLifeHours && <div><p className="text-xs text-muted-foreground">Half-life</p><p className="font-medium">{med.halfLifeHours}h</p></div>}
        <div><p className="text-xs text-muted-foreground">Schedule</p><p className="font-medium">{med.doseTimes.join(", ")}</p></div>
      </div>

      {med.halfLifeHours && (
        <div className="mb-4">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", level >= 50 ? "bg-primary" : level >= 30 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${level}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>{lastDose ? `Last dose: ${hoursSinceDose}h ago` : "No doses logged"}</span>
            <span>t½ {med.halfLifeHours}h</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {med.qtRisk !== "none" && (
          <Badge variant={med.qtRisk === "high" ? "destructive" : "outline"} className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />QT Risk: {med.qtRisk}
          </Badge>
        )}
        {med.isCardiac && <Badge variant="secondary" className="text-xs">Cardiac</Badge>}
      </div>

      {med.halfLifeHours && (
        <Button variant="outline" size="sm" className="w-full mt-4" onClick={handleTookDose}>
          <Clock className="h-3.5 w-3.5 mr-1.5" />Took dose
        </Button>
      )}
    </div>
  );
}

"use client";

import { Eye, EyeSlash, Pill, Plus } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Medication } from "@/lib/types";
import { decayConcentration } from "@/lib/simulate";

function progressColor(pct: number): string {
  if (pct >= 50) return "[&>div]:bg-sky-500";
  if (pct >= 30) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

function timeSince(ms: number): string {
  if (ms <= 0) return "No dose logged";
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (h > 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

interface MedicationRowProps {
  medications: Medication[];
  onTookDose: (id: string) => void;
  onToggleChart: (id: string) => void;
  onAdd: () => void;
  now: number;
}

export function MedicationRow({ medications, onTookDose, onToggleChart, onAdd, now }: MedicationRowProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
      {medications.map((m) => {
        const pct = m.lastDoseAt ? decayConcentration(m.lastDoseAt, m.tHalfHours, now) : m.concentrationPercent;
        const since = m.lastDoseAt ? now - m.lastDoseAt : 0;

        return (
          <Card key={m.id} className="min-w-[200px] max-w-[220px] flex-shrink-0">
            <CardContent className="p-3.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50">
                    <Pill size={14} weight="bold" className="text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.name}</p>
                    <p className="text-[11px] text-slate-500">{m.dose} · {m.frequency}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleChart(m.id)}
                  className={`h-7 w-7 p-0 ${m.visibleOnChart ? "bg-sky-50 text-sky-600" : "bg-slate-50 text-slate-400"}`}
                  aria-label={m.visibleOnChart ? "Hide from chart" : "Show on chart"}
                >
                  {m.visibleOnChart ? <Eye size={14} weight="bold" /> : <EyeSlash size={14} weight="bold" />}
                </Button>
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">t½ {m.tHalfHours}h</p>

              <div className="mt-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Level</span>
                  <span className="font-semibold tabular-nums text-slate-700">{Math.round(pct)}%</span>
                </div>
                <Progress value={Math.min(100, pct)} className={`mt-1 h-1.5 ${progressColor(pct)}`} />
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">{timeSince(since)}</p>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {m.qtRisk !== "none" && (
                  <Badge variant={m.qtRisk === "high" ? "destructive" : "outline"} className="text-[10px]">
                    QT {m.qtRisk}
                  </Badge>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onTookDose(m.id)}
                  className="gap-1 text-xs"
                >
                  <Pill size={12} weight="bold" />
                  Took dose
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="flex min-w-[180px] flex-shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-500 transition hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50/30"
        aria-label="Add medication"
      >
        <Plus size={22} weight="bold" />
        <span className="text-xs font-semibold">Add medication</span>
      </button>
    </div>
  );
}

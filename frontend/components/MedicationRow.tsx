"use client";

import { Eye, EyeSlash, Pill, Plus } from "@phosphor-icons/react";
import type { Medication } from "@/lib/types";
import { decayConcentration } from "@/lib/simulate";

function barColor(pct: number): string {
  if (pct >= 50) return "from-sky-400 to-sky-300";
  if (pct >= 30) return "from-amber-400 to-amber-300";
  return "from-red-400 to-red-300";
}

function qtBadge(qt: string): React.ReactNode {
  if (qt === "none") return null;
  return (
    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${qt === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
      QT {qt}
    </span>
  );
}

function timeSince(ms: number): string {
  if (ms <= 0) return "—";
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

export function MedicationRow({
  medications,
  onTookDose,
  onToggleChart,
  onAdd,
  now,
}: MedicationRowProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 pt-2 scrollbar-thin">
      {medications.map((m) => {
        const pct = m.lastDoseAt
          ? decayConcentration(m.lastDoseAt, m.tHalfHours, now)
          : m.concentrationPercent;
        const since = m.lastDoseAt ? now - m.lastDoseAt : 0;

        return (
          <div
            key={m.id}
            className="min-w-[200px] max-w-[220px] flex-shrink-0 rounded-[22px] bg-white p-4 shadow-[0_4px_20px_rgba(56,189,248,0.08)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Pill size={18} weight="duotone" className="shrink-0 text-sky-500" />
                <div>
                  <p className="font-semibold text-zinc-800">{m.name}</p>
                  <p className="text-sm text-zinc-500">{m.dose} · {m.frequency}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleChart(m.id)}
                className={`rounded-lg p-1.5 ${m.visibleOnChart ? "bg-sky-100 text-sky-600" : "bg-zinc-100 text-zinc-400"}`}
                aria-label={m.visibleOnChart ? "Hide from chart" : "Show on chart"}
              >
                {m.visibleOnChart ? <Eye size={18} weight="duotone" /> : <EyeSlash size={18} weight="duotone" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">t½ {m.tHalfHours}h</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs">
                <span>Concentration</span>
                <span className="font-medium">{Math.round(pct)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barColor(pct)} transition-all duration-500`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">{timeSince(since)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {qtBadge(m.qtRisk)}
              <button
                type="button"
                onClick={() => onTookDose(m.id)}
                className="flex items-center gap-1.5 rounded-xl bg-sky-100 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-200"
              >
                <Pill size={16} weight="duotone" />
                Took dose
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="flex min-w-[200px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-[22px] border-2 border-dashed border-sky-200 bg-sky-50/50 text-sky-600 transition hover:border-sky-400 hover:bg-sky-50"
        aria-label="Add medication"
      >
        <Plus size={28} weight="duotone" />
        <span className="text-sm font-medium">Add medication</span>
      </button>
    </div>
  );
}

"use client";

import { ChartLine, Pill, Export } from "@phosphor-icons/react";

interface Props {
  activeTab: string;
  onTab: (tab: string) => void;
  mobile?: boolean;
  onDrugCheckerClick?: () => void;
}

const TABS = [
  { id: "overview", label: "Overview", Icon: ChartLine },
  { id: "drugchecker", label: "Drug Checker", Icon: Pill },
  { id: "export", label: "Export", Icon: Export },
];

export function Header({ activeTab, onTab, mobile, onDrugCheckerClick }: Props) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 rounded-b-[22px] bg-white/95 px-4 py-3 shadow-[0_4px_20px_rgba(56,189,248,0.06)] backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-sky-600">Guardrail</span>
        <span className="flex items-center gap-1.5 text-sm text-zinc-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Live · Dishita&apos;s Watch
        </span>
      </div>
      {!mobile && (
        <nav className="flex gap-1">
          {TABS.map((t) => {
            const Icon = t.Icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTab(t.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === t.id ? "bg-sky-100 text-sky-700" : "text-zinc-600 hover:bg-zinc-100"}`}
              >
                <Icon size={18} weight="duotone" />
                {t.label}
              </button>
            );
          })}
        </nav>
      )}
      {mobile && onDrugCheckerClick && (
        <button
          type="button"
          onClick={onDrugCheckerClick}
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-sky-600 hover:bg-sky-50"
        >
          <Pill size={18} weight="duotone" />
          Drug Checker
        </button>
      )}
    </header>
  );
}

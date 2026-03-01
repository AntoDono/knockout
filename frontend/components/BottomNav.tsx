"use client";

import { ChartLine, Heart, Pill, Export } from "@phosphor-icons/react";

const TABS = [
  { id: "overview", label: "Overview", Icon: ChartLine },
  { id: "episodes", label: "Episodes", Icon: Heart },
  { id: "drugs", label: "Drugs", Icon: Pill },
  { id: "export", label: "Export", Icon: Export },
];

interface Props {
  activeTab: string;
  onTab: (tab: string) => void;
}

export function BottomNav({ activeTab, onTab }: Props) {
  return (
    <nav className="flex shrink-0 items-center justify-around border-t border-zinc-100 bg-white py-2 safe-area-pb">
      {TABS.map((t) => {
        const Icon = t.Icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs font-medium transition ${activeTab === t.id ? "text-sky-600" : "text-zinc-500"}`}
          >
            <Icon size={22} weight="duotone" className="shrink-0" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

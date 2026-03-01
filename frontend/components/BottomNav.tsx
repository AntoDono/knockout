"use client";

import { ChartLine, Heart, Pill, Export } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

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
    <nav className="flex shrink-0 items-center justify-around border-t border-slate-100 bg-white/95 py-1.5 backdrop-blur-lg safe-area-pb">
      {TABS.map((t) => {
        const Icon = t.Icon;
        const active = activeTab === t.id;
        return (
          <Button
            key={t.id}
            variant="ghost"
            size="sm"
            onClick={() => onTab(t.id)}
            className={`flex flex-col items-center gap-0.5 h-auto rounded-xl px-4 py-1.5 text-[10px] font-semibold ${
              active ? "text-sky-600" : "text-slate-400"
            }`}
          >
            <Icon size={20} weight={active ? "fill" : "regular"} className="shrink-0" />
            <span>{t.label}</span>
            {active && <span className="mt-0.5 h-0.5 w-4 rounded-full bg-sky-500" />}
          </Button>
        );
      })}
    </nav>
  );
}

"use client";

import { ChartLine, Pill, Export } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-lg sm:px-6">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-tight text-slate-900">Guardrail</span>
        <Badge variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-live" />
          Live
        </Badge>
      </div>

      {!mobile && (
        <nav className="flex gap-0.5">
          {TABS.map((t) => {
            const Icon = t.Icon;
            const active = activeTab === t.id;
            return (
              <Button
                key={t.id}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onTab(t.id)}
                className={`relative gap-2 ${
                  active
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon size={16} weight={active ? "fill" : "duotone"} />
                {t.label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-sky-500" />
                )}
              </Button>
            );
          })}
        </nav>
      )}

      {mobile && onDrugCheckerClick && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDrugCheckerClick}
          className="gap-1.5 text-xs font-semibold"
        >
          <Pill size={14} weight="duotone" />
          Drug Checker
        </Button>
      )}
    </header>
  );
}

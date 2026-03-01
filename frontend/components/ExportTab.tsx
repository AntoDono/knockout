"use client";

import { useState } from "react";
import { Export } from "@phosphor-icons/react";

type Range = "4weeks" | "3months" | "custom";

const CHECKLIST = [
  "PK & HRV chart",
  "Episode log",
  "Vitals summary",
  "Medication list & doses",
  "Drug concentration timeline",
];

export function ExportTab() {
  const [range, setRange] = useState<Range>("4weeks");
  const [checked, setChecked] = useState<Record<number, boolean>>(
    Object.fromEntries(CHECKLIST.map((_, i) => [i, true]))
  );

  const toggle = (i: number) => {
    setChecked((c) => ({ ...c, [i]: !c[i] }));
  };

  const generate = () => {
    // Placeholder: in a real app would generate PDF
    alert("PDF summary would be generated for the selected range and contents.");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-800">
        <Export size={28} weight="duotone" className="text-sky-500" />
        Export
      </h1>
      <p className="mt-1 text-zinc-500">Generate a PDF summary for your care team.</p>

      <div className="mt-8">
        <p className="text-sm font-medium text-zinc-600">Date range</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {[
            { value: "4weeks" as Range, label: "Last 4 weeks" },
            { value: "3months" as Range, label: "Last 3 months" },
            { value: "custom" as Range, label: "Custom" },
          ].map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="range"
                checked={range === opt.value}
                onChange={() => setRange(opt.value)}
                className="h-4 w-4 accent-sky-500"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-zinc-600">Report contents</p>
        <ul className="mt-3 space-y-2">
          {CHECKLIST.map((item, i) => (
            <li key={item}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl py-2">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggle(i)}
                  className="h-4 w-4 rounded accent-sky-500"
                />
                <span className="text-zinc-700">{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={generate}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-[22px] bg-sky-400 py-4 font-semibold text-white shadow-[0_4px_20px_rgba(56,189,248,0.25)] hover:bg-sky-500"
      >
        <Export size={22} weight="duotone" />
        Generate PDF Summary
      </button>
    </div>
  );
}

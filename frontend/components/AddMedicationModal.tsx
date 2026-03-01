"use client";

import { useState, useMemo } from "react";
import type { DrugOption } from "@/lib/types";
import { DRUG_OPTIONS } from "@/lib/drugs";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (drug: DrugOption, dose: string, frequency: string) => void;
}

export function AddMedicationModal({ isOpen, onClose, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DrugOption | null>(null);
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("once daily");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return DRUG_OPTIONS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        q.split(" ").every((w) => d.name.toLowerCase().includes(w))
    ).slice(0, 10);
  }, [query]);

  const handleSubmit = () => {
    if (!selected) return;
    onAdd(selected, dose || "—", frequency);
    setQuery("");
    setSelected(null);
    setDose("");
    setFrequency("once daily");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-800">Add medication</h2>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="Search drug name..."
          className="mt-4 w-full rounded-xl border border-zinc-200 px-4 py-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          autoFocus
        />
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-zinc-100">
          {filtered.map((d) => (
            <li key={d.name}>
              <button
                type="button"
                onClick={() => setSelected(d)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-sky-50 ${selected?.name === d.name ? "bg-sky-50" : ""}`}
              >
                <span className="font-medium">{d.name}</span>
                <span className="text-xs text-zinc-500">t½ {d.tHalfHours}h · QT {d.qtRisk}</span>
              </button>
            </li>
          ))}
        </ul>
        {selected && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Dose</label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 40mg"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              >
                <option value="once daily">Once daily</option>
                <option value="twice daily">Twice daily</option>
                <option value="three times daily">Three times daily</option>
                <option value="as needed">As needed</option>
              </select>
            </div>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected}
            className="flex-1 rounded-xl bg-sky-400 py-2.5 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

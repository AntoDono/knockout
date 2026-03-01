"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add medication</DialogTitle>
        </DialogHeader>

        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="Search drug name..."
          autoFocus
        />

        <ScrollArea className="max-h-48">
          <ul className="rounded-xl border border-zinc-100">
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
        </ScrollArea>

        {selected && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Dose</Label>
              <Input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 40mg"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once daily">Once daily</SelectItem>
                  <SelectItem value="twice daily">Twice daily</SelectItem>
                  <SelectItem value="three times daily">Three times daily</SelectItem>
                  <SelectItem value="as needed">As needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selected}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

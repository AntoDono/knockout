"use client";
import { useState } from "react";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DRUG_OPTIONS } from "@/lib/data/synthetic";
import { cn } from "@/lib/utils";
import type { DrugOption } from "@/lib/types";

export function AddMedModal() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DrugOption | null>(null);
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("once_daily");

  const results = search.length >= 2
    ? DRUG_OPTIONS.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];

  const handleSelect = (drug: DrugOption) => {
    setSelected(drug);
    setSearch(drug.name);
  };

  const handleAdd = () => {
    // Demo only — would POST to backend in production
    setOpen(false);
    setSearch("");
    setSelected(null);
    setDose("");
    setFrequency("once_daily");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Medication
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Medication</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Medication</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medications..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
                className="pl-9"
              />
            </div>
            {results.length > 0 && !selected && (
              <div className="border rounded-xl overflow-hidden">
                {results.map((drug) => (
                  <button
                    key={drug.name}
                    onClick={() => handleSelect(drug)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0",
                      drug.qtRisk === "high" && "bg-red-50/50"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">{drug.name}</p>
                      <p className="text-xs text-muted-foreground">t½ {drug.tHalfHours}h</p>
                    </div>
                    {drug.qtRisk !== "none" && (
                      <Badge variant={drug.qtRisk === "high" ? "destructive" : "outline"} className="text-xs">
                        {drug.qtRisk === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        QT: {drug.qtRisk}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <>
              <div className="space-y-2">
                <Label>Dose (mg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 40"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <div className="flex gap-2">
                  {[
                    { value: "once_daily", label: "Once daily" },
                    { value: "twice_daily", label: "Twice daily" },
                    { value: "three_daily", label: "3× daily" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFrequency(opt.value)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-colors",
                        frequency === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {selected.qtRisk === "high" && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">
                    This medication has <strong>high QT prolongation risk</strong>. Consult your cardiologist before combining with current medications.
                  </p>
                </div>
              )}

              <Button onClick={handleAdd} className="w-full" disabled={!dose}>
                Add {selected.name}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

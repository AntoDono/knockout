"use client";
import { useFetch } from "@/lib/api";
import { MedCard } from "@/components/medications/MedCard";
import { DrugChecker } from "@/components/medications/DrugChecker";
import { AddMedModal } from "@/components/medications/AddMedModal";
import type { Medication } from "@/lib/types";

export default function MedicationsPage() {
  const { data: meds, refetch } = useFetch<Medication[]>("/patient/medications");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medications</h1>
          <p className="text-sm text-muted-foreground mt-1">Active medications and drug safety checker</p>
        </div>
        <AddMedModal onAdded={refetch} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(meds ?? []).map((med) => <MedCard key={med.id} medication={med} />)}
      </div>
      <DrugChecker />
    </div>
  );
}

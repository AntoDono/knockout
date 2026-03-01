import { MEDICATIONS } from "@/lib/data/synthetic";
import { MedCard } from "@/components/medications/MedCard";
import { DrugChecker } from "@/components/medications/DrugChecker";
import { AddMedModal } from "@/components/medications/AddMedModal";

export default function MedicationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medications</h1>
          <p className="text-sm text-muted-foreground mt-1">Active medications and drug safety checker</p>
        </div>
        <AddMedModal />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MEDICATIONS.map((med) => <MedCard key={med.id} medication={med} />)}
      </div>
      <DrugChecker />
    </div>
  );
}

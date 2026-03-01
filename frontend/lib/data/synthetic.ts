import type { DrugOption } from "../types";

export const DRUG_OPTIONS: DrugOption[] = [
  { name: "Nadolol", tHalfHours: 22, qtRisk: "none" },
  { name: "Flecainide", tHalfHours: 14, qtRisk: "moderate" },
  { name: "Metoprolol", tHalfHours: 6, qtRisk: "none" },
  { name: "Propranolol", tHalfHours: 5, qtRisk: "none" },
  { name: "Atenolol", tHalfHours: 7, qtRisk: "none" },
  { name: "Verapamil", tHalfHours: 8, qtRisk: "moderate" },
  { name: "Mexiletine", tHalfHours: 12, qtRisk: "none" },
  { name: "Amiodarone", tHalfHours: 2400, qtRisk: "high" },
  { name: "Sotalol", tHalfHours: 12, qtRisk: "high" },
  { name: "Dofetilide", tHalfHours: 10, qtRisk: "high" },
  { name: "Ondansetron", tHalfHours: 4, qtRisk: "high" },
  { name: "Azithromycin", tHalfHours: 68, qtRisk: "high" },
  { name: "Ciprofloxacin", tHalfHours: 4, qtRisk: "moderate" },
  { name: "Fluconazole", tHalfHours: 30, qtRisk: "moderate" },
  { name: "Escitalopram", tHalfHours: 32, qtRisk: "moderate" },
];

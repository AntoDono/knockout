import type { DrugOption } from "./types";

export const DRUG_OPTIONS: DrugOption[] = [
  { name: "Nadolol", tHalfHours: 22, qtRisk: "none" },
  { name: "Flecainide", tHalfHours: 14, qtRisk: "moderate" },
  { name: "Metoprolol", tHalfHours: 6, qtRisk: "none" },
  { name: "Propranolol", tHalfHours: 4, qtRisk: "none" },
  { name: "Atenolol", tHalfHours: 9, qtRisk: "none" },
  { name: "Amiodarone", tHalfHours: 2400, qtRisk: "high" },
  { name: "Sotalol", tHalfHours: 12, qtRisk: "high" },
  { name: "Mexiletine", tHalfHours: 12, qtRisk: "moderate" },
  { name: "Digoxin", tHalfHours: 36, qtRisk: "none" },
  { name: "Ondansetron", tHalfHours: 4, qtRisk: "high" },
  { name: "Azithromycin", tHalfHours: 68, qtRisk: "high" },
  { name: "Ciprofloxacin", tHalfHours: 4, qtRisk: "moderate" },
  { name: "Ibuprofen", tHalfHours: 2, qtRisk: "none" },
  { name: "Amoxicillin", tHalfHours: 1, qtRisk: "none" },
  { name: "Metronidazole", tHalfHours: 8, qtRisk: "moderate" },
];

const baseTime = typeof Date !== "undefined" ? Date.now() - 8 * 60 * 60 * 1000 : 0;

export const INITIAL_MEDICATIONS = [
  {
    id: "nadolol-1",
    name: "Nadolol",
    dose: "40mg",
    frequency: "once daily",
    tHalfHours: 22,
    qtRisk: "none" as const,
    concentrationPercent: 72,
    lastDoseAt: baseTime,
    visibleOnChart: true,
  },
  {
    id: "flecainide-1",
    name: "Flecainide",
    dose: "50mg",
    frequency: "twice daily",
    tHalfHours: 14,
    qtRisk: "moderate" as const,
    concentrationPercent: 45,
    lastDoseAt: baseTime - 6 * 60 * 60 * 1000,
    visibleOnChart: true,
  },
];

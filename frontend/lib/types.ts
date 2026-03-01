export type QtRisk = "none" | "moderate" | "high";

export interface DrugOption {
  name: string;
  tHalfHours: number;
  qtRisk: QtRisk;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  tHalfHours: number;
  qtRisk: QtRisk;
  concentrationPercent: number;
  lastDoseAt: number;
  visibleOnChart: boolean;
}

export type ActivityState = "Resting" | "Walking" | "Active";

export interface Vitals {
  heartRate: number;
  hrv: number;
  activity: ActivityState;
  barometer: number;
  barometerStability: "stable" | "rising" | "falling";
}

export interface Episode {
  id: string;
  timestamp: number;
  heartRate: number;
  hrv: number;
  drugLevel: number;
  label?: string;
}

export interface PKPoint {
  t: number;
  concentration: number;
}

export interface HRVPoint {
  t: number;
  hrv: number;
}

export type QtRisk = "none" | "moderate" | "high";
export type ActivityState = "resting" | "walking" | "active";
export type SleepQuality = "poor" | "fair" | "good" | "excellent";

export interface Patient {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  primaryDiagnosis: string;
  geneVariant: string | null;
  diagnosisDate: string;
  hasMyopathy: boolean;
  hasSickSinus: boolean;
  cardiacArrestHistory: string;
  sympatheticDenervation: boolean;
}

export interface Diagnosis {
  diagnosis: string;
  notedDate: string | null;
  notes: string | null;
}

export interface Allergy {
  allergen: string;
  reaction: string | null;
}

export interface KnownTrigger {
  triggerType: string;
  source: string;
  confidence: "documented" | "patient_reported" | "suspected";
  notes: string;
}

export interface Medication {
  id: string;
  drugName: string;
  brandName: string | null;
  drugClass: string;
  isCardiac: boolean;
  doseMg: number;
  doseUnit: string;
  frequency: string;
  doseTimes: string[];
  halfLifeHours: number | null;
  dosePerKg: number | null;
  isActive: boolean;
  qtRisk: QtRisk;
  notes: string | null;
}

export interface ICDDevice {
  manufacturer: string;
  model: string;
  implantDate: string;
  leadConfig: string;
  pacingMode: string;
  lowerRateLimitBpm: number;
  batteryLifeYears: number;
  batteryStatus: string;
  atrialPacingPct: number;
  ventricularPacingPct: number;
  shockImpedanceOhms: number;
  lastInterrogationDate: string;
  lastShockDate: string;
  notes: string;
}

export interface ICDZone {
  zoneName: string;
  zoneType: string;
  rateCutoffBpm: number;
  therapies: string[] | null;
  atpEnabled: boolean;
  notes: string;
}

export interface ICDEpisode {
  episodeDatetime: string;
  zoneTriggered: string;
  detectedRateBpm: number;
  avgVRateBpm: number | null;
  durationSeconds: number | null;
  therapyDelivered: string;
  therapyResult: string | null;
  notes: string;
}

export interface ShockEvent {
  eventDate: string;
  eventType: string;
  context: string;
  deviceEra: string;
}

export interface ECGReading {
  readingDate: string;
  hrBpm: number;
  prMs: number;
  qrsMs: number;
  qtMs: number;
  qtcMs: number;
  findings: string | null;
  source: string;
  isAnomalous: boolean;
  notes: string | null;
}

export interface StaticThreshold {
  effectiveDate: string;
  clinician: string;
  restingHrBpm: number;
  qrsBaselineMs: number;
  qtcBaselineMs: number;
  qrsWideningAlertPct: number;
  qrsAbsoluteAlertMs: number;
  qtcUpperLimitMs: number;
  icdGapLowerBpm: number;
  icdGapUpperBpm: number;
  notes: string;
}

export interface HeartRateReading {
  recordedAt: string;
  hrBpm: number;
  activity: ActivityState;
}

export interface HRVReading {
  recordedAt: string;
  hrvMs: number;
}

export interface SleepRecord {
  sleepStart: string;
  sleepEnd: string;
  durationMinutes: number;
  quality: SleepQuality;
  deepMinutes: number;
  remMinutes: number;
  awakenings: number;
}

export interface Episode {
  id: string;
  recordedAt: string;
  heartRate: number;
  hrv: number;
  drugLevelPct: number;
  notes: string | null;
}

export interface WeatherReading {
  recordedAt: string;
  tempC: number;
  humidityPct: number;
}

export interface TemperatureReading {
  recordedAt: string;
  tempC: number;
  deviationC: number;
}

export interface Baselines {
  hr: { mean: number; std: number };
  hrv: { mean: number; std: number };
  sleep: { meanDurationMin: number; meanQualityScore: number };
  temperature: { mean: number; std: number };
  weather: { meanTempC: number; meanHumidityPct: number };
}

export interface DrugOption {
  name: string;
  tHalfHours: number;
  qtRisk: QtRisk;
}

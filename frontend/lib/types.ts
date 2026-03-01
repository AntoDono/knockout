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
  doseMg: number | null;
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
  id: number;
  recordedAt: string;
  notes: string | null;
  source: string;
}

export interface DoseLevel {
  id: number;
  amountMg: number;
  takenAt: string;
  remainingMg: number;
  notes: string;
}

export interface DrugLevel {
  drug: string;
  halfLifeH: number;
  totalDosedMg: number;
  remainingMg: number;
  pctRemaining: number;
  doses: DoseLevel[];
}

export interface EpisodeContextData {
  episode: { id: number; recordedAt: string; notes: string | null };
  contextWindow: { start: string; end: string };
  hr: { recordedAt: string; hrBpm: number; activity: string }[];
  hrv: { recordedAt: string; hrvMs: number; measurementType: string }[];
  sleep: { sleepStart: string; sleepEnd: string; durationMinutes: number; quality: string }[];
  temperature: { recordedAt: string; tempC: number; deviationC: number }[];
  weather: { recordedAt: string; tempC: number; humidityPct: number }[];
  medicationLevels: DrugLevel[];
  baselines: Baselines;
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
  hr: { mean: number | null; std: number | null; count?: number; windowDays?: number };
  hrv: { mean: number | null; std: number | null; count?: number; windowDays?: number };
  sleep: { meanDurationMin: number | null; meanQualityScore: number | null; stdDurationMin?: number | null; count?: number; windowDays?: number };
  temperature: { mean: number | null; std: number | null; count?: number; windowDays?: number };
  weather: { meanTempC: number | null; meanHumidityPct: number | null; stdTempC?: number | null; stdHumidityPct?: number | null; count?: number; windowDays?: number };
  medication?: DrugLevel[];
}

export interface AfibData {
  afibDetected: boolean;
  confidence: number;
  meanBpm: number;
  nSamples: number;
  cv: number;
  rmssdMs: number;
  pnn20: number;
  sd1: number;
  sd2: number;
  sd1Sd2Ratio: number;
  sampleEntropy: number;
  lfHfRatio: number;
  notes: string[];
}

export interface HeartUpdate {
  type: "hello" | "heart_update";
  timestamp: string;
  latestBpm: number | null;
  bpmBufferSize: number;
  afib: AfibData | null;
  afibEventId: string | null;
  drugLevels: DrugLevel[];
  simName?: string;
  simTimeS?: number;
}

export interface DrugOption {
  name: string;
  tHalfHours: number;
  qtRisk: QtRisk;
  description: string;
  category: "first-line" | "alternative" | "reserve" | "qt-risk";
}

export interface DrugLevelSnapshot {
  drugName: string;
  brandName: string | null;
  levelPct: number | null;
  status: "therapeutic" | "declining" | "trough" | "taken" | "not_taken";
  halfLifeHours: number | null;
}

export interface EpisodeInsight {
  id: number;
  deviations: {
    hrPct: number;
    hrvPct: number;
    drugLevels: DrugLevelSnapshot[];
  };
  triggerMatches: {
    triggerType: string;
    source: string;
  }[];
  narrative: string;
  contextNarrative: string;
}

export interface ContributingFactor {
  label: string;
  correlationPct: number;
  color: "red" | "amber" | "green";
}

export interface EpisodeSummary {
  totalEpisodes: number;
  periodDays: number;
  frequencyPerDay: number;
  baselineFrequencyPerDay: number;
  troughCorrelationPct: number;
  sleepCorrelationPct: number;
  icdGapPct: number;
  contributingFactors: ContributingFactor[];
  narrative: string;
}

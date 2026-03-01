import type {
  Patient, Diagnosis, Allergy, KnownTrigger, Medication,
  ICDDevice, ICDZone, ICDEpisode, ShockEvent, ECGReading,
  StaticThreshold, HeartRateReading, HRVReading, SleepRecord,
  Episode, WeatherReading, TemperatureReading, Baselines, DrugOption,
  ActivityState, SleepQuality,
} from "../types";

// ── Patient ──────────────────────────────────────────────

export const PATIENT: Patient = {
  firstName: "Dishita",
  lastName: "Agarwal",
  dateOfBirth: "2006-01-19",
  sex: "female",
  heightCm: 171.6,
  weightKg: 83.0,
  bmi: 28.19,
  primaryDiagnosis: "Triadin Knockout Syndrome (TKOS)",
  geneVariant: null,
  diagnosisDate: "2024-05-30",
  hasMyopathy: true,
  hasSickSinus: true,
  cardiacArrestHistory: "Yes — prior cardiac arrest, ICD shocks 2011/2013/2015",
  sympatheticDenervation: true,
};

export const DIAGNOSES: Diagnosis[] = [
  { diagnosis: "Triadin Knockout Syndrome (TKOS)", notedDate: "2024-05-30", notes: "Genetic confirmation of TRDN variant" },
  { diagnosis: "Long QT Syndrome", notedDate: "2015-06-26", notes: null },
  { diagnosis: "Sick Sinus Syndrome", notedDate: "2018-11-25", notes: "Pacemaker-dependent, atrial pacing 98%" },
  { diagnosis: "Myopathy", notedDate: "2015-08-11", notes: null },
  { diagnosis: "Syncope", notedDate: "2015-06-26", notes: null },
  { diagnosis: "Cardiac Arrest", notedDate: null, notes: "History of cardiac arrest with ICD discharges" },
  { diagnosis: "Atrial Fibrillation", notedDate: "2022-03-27", notes: null },
  { diagnosis: "AF with Rapid Ventricular Response", notedDate: "2024-02-02", notes: "ICD shock delivered (41J)" },
  { diagnosis: "Multiple Concussions", notedDate: "2025-11-20", notes: null },
  { diagnosis: "Polycystic Ovary Syndrome (PCOS)", notedDate: "2024-11-26", notes: null },
];

export const ALLERGIES: Allergy[] = [
  { allergen: "All medications that prolong QT", reaction: null },
];

export const TRIGGERS: KnownTrigger[] = [
  { triggerType: "Swimming", source: "ICD discharge 2011", confidence: "documented", notes: "ICD shock during swimming" },
  { triggerType: "Dancing", source: "ICD discharge 2013", confidence: "documented", notes: "ICD shock during dancing" },
  { triggerType: "Climbing stairs", source: "ICD discharge 2/2015", confidence: "documented", notes: "ICD shock while climbing stairs" },
  { triggerType: "Sleep deprivation", source: "Clinical note", confidence: "patient_reported", notes: "Symptoms more pronounced with poor sleep" },
  { triggerType: "Physical exertion", source: "Clinical note", confidence: "patient_reported", notes: "Symptoms exacerbated by walking and physical exertion" },
];

// ── Medications ──────────────────────────────────────────

export const MEDICATIONS: Medication[] = [
  {
    id: "nadolol-1",
    drugName: "nadolol",
    brandName: "Corgard",
    drugClass: "beta_blocker",
    isCardiac: true,
    doseMg: 40.0,
    doseUnit: "mg",
    frequency: "twice_daily",
    doseTimes: ["09:00", "20:00"],
    halfLifeHours: 22.0,
    dosePerKg: 0.48,
    isActive: true,
    qtRisk: "none",
    notes: "Evening dose typically taken between 8-11pm",
  },
  {
    id: "spironolactone-1",
    drugName: "spironolactone",
    brandName: null,
    drugClass: "potassium_sparing_diuretic",
    isCardiac: false,
    doseMg: 25.0,
    doseUnit: "mg",
    frequency: "once_daily",
    doseTimes: ["09:00"],
    halfLifeHours: null,
    dosePerKg: null,
    isActive: true,
    qtRisk: "none",
    notes: null,
  },
];

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

// ── ICD ──────────────────────────────────────────────────

export const ICD_DEVICE: ICDDevice = {
  manufacturer: "Boston Scientific",
  model: "RESONATE EL ICD D433/657030",
  implantDate: "2023-12-11",
  leadConfig: "dual chamber",
  pacingMode: "DDDR",
  lowerRateLimitBpm: 70,
  batteryLifeYears: 11,
  batteryStatus: "normal",
  atrialPacingPct: 98,
  ventricularPacingPct: 1,
  shockImpedanceOhms: 57,
  lastInterrogationDate: "2025-11-10",
  lastShockDate: "2024-02-02",
  notes: "Current device (3rd generator). Prior: 2011 original, 2018 replacement, 2023-12-11 current.",
};

export const ICD_ZONES: ICDZone[] = [
  { zoneName: "VT", zoneType: "therapy", rateCutoffBpm: 190, therapies: ["31J", "41J", "41J x4"], atpEnabled: false, notes: "Shock-only — ATP is OFF" },
  { zoneName: "VF", zoneType: "therapy", rateCutoffBpm: 220, therapies: ["31J", "41J", "41J x6"], atpEnabled: false, notes: "Shock-only — ATP is OFF" },
  { zoneName: "ATR", zoneType: "mode_switch", rateCutoffBpm: 170, therapies: null, atpEnabled: false, notes: "Atrial rate mode switch threshold" },
];

export const ICD_EPISODES: ICDEpisode[] = [
  { episodeDatetime: "2025-05-05T12:57", zoneTriggered: "VT", detectedRateBpm: 199, avgVRateBpm: null, durationSeconds: null, therapyDelivered: "none", therapyResult: null, notes: "Self-terminated before therapy delivery" },
  { episodeDatetime: "2025-10-17T23:10", zoneTriggered: "ATR", detectedRateBpm: 151, avgVRateBpm: 121, durationSeconds: 3.0, therapyDelivered: "mode_switch", therapyResult: null, notes: "Atrial rate 151 bpm, ventricular rate 121 bpm" },
  { episodeDatetime: "2025-11-08T18:17", zoneTriggered: "ATR", detectedRateBpm: 117, avgVRateBpm: 106, durationSeconds: null, therapyDelivered: "mode_switch", therapyResult: null, notes: "Atrial rate 117 bpm, ventricular rate 106 bpm" },
];

export const SHOCK_HISTORY: ShockEvent[] = [
  { eventDate: "2011", eventType: "ICD discharge", context: "Swimming — triggered ventricular arrhythmia", deviceEra: "1st generator (2011 implant)" },
  { eventDate: "2013", eventType: "ICD discharge", context: "Dancing — triggered ventricular arrhythmia", deviceEra: "1st generator (2011 implant)" },
  { eventDate: "2015-02", eventType: "ICD discharge", context: "Climbing stairs — triggered ventricular arrhythmia", deviceEra: "1st generator" },
  { eventDate: "2024-02-02", eventType: "ICD discharge", context: "AF with RVR — 41J shock delivered. Subdural hematoma.", deviceEra: "3rd generator (2023-12-11)" },
];

// ── ECG ──────────────────────────────────────────────────

export const ECG_READINGS: ECGReading[] = [
  { readingDate: "2022-01-27", hrBpm: 70, prMs: 168, qrsMs: 74, qtMs: 430, qtcMs: 465, findings: null, source: "clinic_ecg", isAnomalous: false, notes: null },
  { readingDate: "2022-03-27", hrBpm: 70, prMs: 166, qrsMs: 70, qtMs: 424, qtcMs: 458, findings: null, source: "clinic_ecg", isAnomalous: false, notes: null },
  { readingDate: "2022-06-30", hrBpm: 70, prMs: 172, qrsMs: 72, qtMs: 414, qtcMs: 447, findings: null, source: "clinic_ecg", isAnomalous: false, notes: null },
  { readingDate: "2022-12-05", hrBpm: 70, prMs: 170, qrsMs: 68, qtMs: 440, qtcMs: 475, findings: null, source: "clinic_ecg", isAnomalous: false, notes: null },
  { readingDate: "2023-03-27", hrBpm: 70, prMs: 174, qrsMs: 72, qtMs: 410, qtcMs: 443, findings: null, source: "clinic_ecg", isAnomalous: false, notes: null },
  { readingDate: "2023-06-16", hrBpm: 70, prMs: 168, qrsMs: 70, qtMs: 418, qtcMs: 451, findings: null, source: "clinic_ecg", isAnomalous: false, notes: null },
  { readingDate: "2023-09-11", hrBpm: 70, prMs: 170, qrsMs: 74, qtMs: 420, qtcMs: 454, findings: null, source: "clinic_ecg", isAnomalous: false, notes: null },
  { readingDate: "2023-12-11", hrBpm: 70, prMs: 166, qrsMs: 70, qtMs: 396, qtcMs: 428, findings: null, source: "clinic_ecg", isAnomalous: false, notes: "Post ICD generator replacement" },
  { readingDate: "2024-02-02", hrBpm: 70, prMs: 170, qrsMs: 72, qtMs: 368, qtcMs: 397, findings: null, source: "clinic_ecg", isAnomalous: false, notes: "Day of AF with RVR event and ICD shock" },
  { readingDate: "2024-05-30", hrBpm: 70, prMs: 172, qrsMs: 70, qtMs: 412, qtcMs: 445, findings: null, source: "clinic_ecg", isAnomalous: false, notes: "TKOS diagnosis confirmed this visit" },
  { readingDate: "2024-07-10", hrBpm: 70, prMs: 246, qrsMs: 152, qtMs: 520, qtcMs: 533, findings: null, source: "clinic_ecg", isAnomalous: true, notes: "Device malfunction — ICD lead fracture and generator migration" },
  { readingDate: "2024-11-26", hrBpm: 70, prMs: 168, qrsMs: 70, qtMs: 408, qtcMs: 441, findings: null, source: "clinic_ecg", isAnomalous: false, notes: "Post emergency lead extraction and ICD reimplant" },
  { readingDate: "2025-05-07", hrBpm: 70, prMs: 170, qrsMs: 72, qtMs: 416, qtcMs: 449, findings: null, source: "clinic_ecg", isAnomalous: false, notes: null },
  { readingDate: "2025-11-20", hrBpm: 70, prMs: 170, qrsMs: 70, qtMs: 402, qtcMs: 434, findings: null, source: "clinic_ecg", isAnomalous: false, notes: "Most recent ECG. Used for current static thresholds." },
];

// ── Thresholds ───────────────────────────────────────────

export const THRESHOLDS: StaticThreshold = {
  effectiveDate: "2025-11-20",
  clinician: "Dr. Salim F Idriss",
  restingHrBpm: 70,
  qrsBaselineMs: 70,
  qtcBaselineMs: 434,
  qrsWideningAlertPct: 0.25,
  qrsAbsoluteAlertMs: 88,
  qtcUpperLimitMs: 500,
  icdGapLowerBpm: 70,
  icdGapUpperBpm: 190,
  notes: "Resting HR is pacemaker-set (lower rate 70, atrial pacing 98%).",
};

// ── Baselines (7-day rolling) ────────────────────────────

export const BASELINES: Baselines = {
  hr: { mean: 74, std: 8 },
  hrv: { mean: 42, std: 9 },
  sleep: { meanDurationMin: 410, meanQualityScore: 2.7 },
  temperature: { mean: 36.15, std: 0.25 },
  weather: { meanTempC: 12.5, meanHumidityPct: 62 },
};

// ── 7-day Vitals History ─────────────────────────────────

function generateVitalsHistory(): { hr: HeartRateReading[]; hrv: HRVReading[] } {
  const hr: HeartRateReading[] = [];
  const hrv: HRVReading[] = [];
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (let t = start.getTime(); t < now.getTime(); t += 5 * 60 * 1000) {
    const d = new Date(t);
    const hour = d.getHours();
    const isSleep = hour < 7 || hour >= 23;
    const hoursSince9am = ((hour - 9) + 24) % 24;
    const hoursSince8pm = ((hour - 20) + 24) % 24;
    const minHoursSinceDose = Math.min(hoursSince9am, hoursSince8pm);
    const inTrough = minHoursSinceDose > 13;

    let baseHr = 70;
    let baseHrv = 44;
    if (inTrough) { baseHr += 10; baseHrv -= 12; }
    if (isSleep) { baseHr -= 5; baseHrv += 8; }

    const activity: ActivityState = isSleep ? "resting" : Math.random() < 0.08 ? "walking" : "resting";
    if (activity === "walking") baseHr += 15;

    hr.push({
      recordedAt: d.toISOString(),
      hrBpm: Math.round(baseHr + (Math.random() - 0.5) * 8),
      activity,
    });
    hrv.push({
      recordedAt: d.toISOString(),
      hrvMs: Math.round((baseHrv + (Math.random() - 0.5) * 10) * 10) / 10,
    });
  }
  return { hr, hrv };
}

const vitalsHistory = generateVitalsHistory();
export const HR_HISTORY: HeartRateReading[] = vitalsHistory.hr;
export const HRV_HISTORY: HRVReading[] = vitalsHistory.hrv;

// ── Sleep History ────────────────────────────────────────

function generateSleepHistory(): SleepRecord[] {
  const records: SleepRecord[] = [];
  const now = new Date();
  const qualities: SleepQuality[] = ["good", "good", "fair", "poor", "good", "poor", "fair"];

  for (let day = 6; day >= 0; day--) {
    const q = qualities[6 - day];
    const dur = q === "poor" ? 310 + Math.random() * 30
      : q === "fair" ? 370 + Math.random() * 30
      : q === "good" ? 420 + Math.random() * 40
      : 460 + Math.random() * 30;
    const sleepStart = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
    sleepStart.setHours(23, Math.floor(Math.random() * 30), 0, 0);
    const sleepEnd = new Date(sleepStart.getTime() + dur * 60 * 1000);

    records.push({
      sleepStart: sleepStart.toISOString(),
      sleepEnd: sleepEnd.toISOString(),
      durationMinutes: Math.round(dur),
      quality: q,
      deepMinutes: Math.round(dur * (q === "poor" ? 0.12 : q === "fair" ? 0.15 : 0.18)),
      remMinutes: Math.round(dur * (q === "poor" ? 0.18 : 0.25)),
      awakenings: q === "poor" ? 4 : q === "fair" ? 2 : 1,
    });
  }
  return records;
}

export const SLEEP_HISTORY: SleepRecord[] = generateSleepHistory();

// ── Episodes ─────────────────────────────────────────────

function generateEpisodes(): Episode[] {
  const now = new Date();
  const episodes: Episode[] = [];
  let id = 1;
  const times = [
    { hoursAgo: 2, hr: 92, hrv: 24, drug: 28 },
    { hoursAgo: 8, hr: 88, hrv: 28, drug: 45 },
    { hoursAgo: 20, hr: 95, hrv: 22, drug: 25 },
    { hoursAgo: 32, hr: 84, hrv: 32, drug: 52 },
    { hoursAgo: 56, hr: 90, hrv: 26, drug: 29 },
    { hoursAgo: 80, hr: 86, hrv: 30, drug: 38 },
  ];

  for (const ep of times) {
    episodes.push({
      id: `ep-${id++}`,
      recordedAt: new Date(now.getTime() - ep.hoursAgo * 60 * 60 * 1000).toISOString(),
      heartRate: ep.hr,
      hrv: ep.hrv,
      drugLevelPct: ep.drug,
      notes: ep.drug < 30 ? "Trough window" : null,
    });
  }
  return episodes;
}

export const EPISODES: Episode[] = generateEpisodes();

// ── Weather ──────────────────────────────────────────────

function generateWeather(): WeatherReading[] {
  const readings: WeatherReading[] = [];
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (let t = start.getTime(); t < now.getTime(); t += 30 * 60 * 1000) {
    const d = new Date(t);
    const hour = d.getHours();
    const dayIndex = Math.floor((t - start.getTime()) / (24 * 60 * 60 * 1000));
    const diurnal = Math.sin(((hour - 6) / 24) * Math.PI * 2) * 4;
    readings.push({
      recordedAt: d.toISOString(),
      tempC: Math.round((12 + dayIndex * 0.5 + diurnal + (Math.random() - 0.5) * 2) * 10) / 10,
      humidityPct: Math.round(62 + (Math.random() - 0.5) * 20),
    });
  }
  return readings;
}

export const WEATHER_HISTORY: WeatherReading[] = generateWeather();

// ── Temperature ──────────────────────────────────────────

function generateTemperature(): TemperatureReading[] {
  const readings: TemperatureReading[] = [];
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (let t = start.getTime(); t < now.getTime(); t += 30 * 60 * 1000) {
    const d = new Date(t);
    const hour = d.getHours();
    const circadian = Math.sin(((hour - 4) / 24) * Math.PI * 2) * 0.3;
    const base = 36.1 + circadian + (Math.random() - 0.5) * 0.2;
    readings.push({
      recordedAt: d.toISOString(),
      tempC: Math.round(base * 100) / 100,
      deviationC: Math.round((base - 36.1) * 100) / 100,
    });
  }
  return readings;
}

export const TEMPERATURE_HISTORY: TemperatureReading[] = generateTemperature();

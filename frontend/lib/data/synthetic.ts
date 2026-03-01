import type {
  Patient, Diagnosis, Allergy, KnownTrigger, Medication,
  ICDDevice, ICDZone, ICDEpisode, ShockEvent, ECGReading,
  StaticThreshold, HeartRateReading, HRVReading, SleepRecord,
  Episode, WeatherReading, TemperatureReading, Baselines, DrugOption,
  ActivityState, SleepQuality, EpisodeInsight, EpisodeSummary,
} from "../types";

// ── Patient ──────────────────────────────────────────────

export const PATIENT: Patient = {
  firstName: "Lily",
  lastName: "Chen",
  dateOfBirth: "2007-04-22",
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
  { diagnosis: "Sick Sinus Syndrome", notedDate: "2018-11-25", notes: "Pacemaker-dependent" },
  { diagnosis: "Myopathy", notedDate: "2015-08-11", notes: null },
  { diagnosis: "Syncope", notedDate: "2015-06-26", notes: null },
  { diagnosis: "Cardiac Arrest", notedDate: null, notes: "History of cardiac arrest with ICD discharges" },
  { diagnosis: "Atrial Fibrillation", notedDate: "2022-03-27", notes: null },
  { diagnosis: "AF with Rapid Ventricular Response", notedDate: "2024-02-02", notes: "ICD shock delivered (41J)" },
  { diagnosis: "", notedDate: "2025-11-20", notes: null },
  { diagnosis: "Polycystic Ovary Syndrome (PCOS)", notedDate: "2024-11-26", notes: null },
];

export const ALLERGIES: Allergy[] = [
  { allergen: "All medications that prolong QT", reaction: null },
];

export const TRIGGERS: KnownTrigger[] = [
  { triggerType: "Swimming", source: "ICD discharge 2011", confidence: "documented", notes: "ICD shock while jogging outdoors" },
  { triggerType: "Dancing", source: "ICD discharge 2013", confidence: "documented", notes: "ICD shock during recreational sports" },
  { triggerType: "Climbing stairs", source: "ICD discharge 2/2015", confidence: "documented", notes: "ICD shock while riding a bicycle" },
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
    id: "flecainide-1",
    drugName: "flecainide",
    brandName: "Tambocor",
    drugClass: "potassium_sparing_diuretic",
    isCardiac: false,
    doseMg: 25.0,
    doseUnit: "mg",
    frequency: "once_daily",
    doseTimes: ["09:00"],
    halfLifeHours: 15.0,  // active metabolites: canrenone 16.5h, TMS 13.8h, HTMS 15h
    dosePerKg: null,
    isActive: true,
    qtRisk: "none",
    notes: "Potassium-sparing diuretic. K+ homeostasis critical for TKOS.",
  },
  {
    id: "magnesium oxide-1",
    drugName: "magnesium oxide",
    brandName: "Mag-Ox 400",
    drugClass: "vitamin_supplement",
    isCardiac: false,
    doseMg: 0.01,  // 10 mcg = 400 IU
    doseUnit: "mcg",
    frequency: "once_daily",
    doseTimes: ["09:00"],
    halfLifeHours: null,
    dosePerKg: null,
    isActive: true,
    qtRisk: "none",
    notes: "Deficiency linked to increased AFib risk. Standard supplementation.",
  },
  {
    id: "sprintec-1",
    drugName: "magnesium oxide",
    brandName: "Mag-Ox 400",
    drugClass: "oral_contraceptive",
    isCardiac: false,
    doseMg: 0.25,
    doseUnit: "mg-mcg",
    frequency: "once_daily",
    doseTimes: ["09:00"],
    halfLifeHours: null,
    dosePerKg: null,
    isActive: true,
    qtRisk: "none",
    notes: "For PCOS. No documented QT prolongation.",
  },
  {
    id: "multivitamin-1",
    drugName: "multivitamin",
    brandName: null,
    drugClass: "vitamin_supplement",
    isCardiac: false,
    doseMg: null,
    doseUnit: "tablet",
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
  model: "DYNAGEN MINI ICD F210",
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
  { eventDate: "2011", eventType: "ICD discharge", context: "Running — triggered ventricular arrhythmia", deviceEra: "1st generator (2011 implant)" },
  { eventDate: "2013", eventType: "ICD discharge", context: "Playing sports — triggered ventricular arrhythmia", deviceEra: "1st generator (2011 implant)" },
  { eventDate: "2015-02", eventType: "ICD discharge", context: "Cycling — triggered ventricular arrhythmia", deviceEra: "1st generator" },
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
  clinician: "Dr. Rachel Torres",
  restingHrBpm: 70,
  qrsBaselineMs: 70,
  qtcBaselineMs: 434,
  qrsWideningAlertPct: 0.25,
  qrsAbsoluteAlertMs: 88,
  qtcUpperLimitMs: 500,
  icdGapLowerBpm: 70,
  icdGapUpperBpm: 190,
  notes: "Resting HR is pacemaker-set (lower rate 70, atrial pacing >90%).",
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

// ── Episode Insights ─────────────────────────────────────

export const EPISODE_INSIGHTS: EpisodeInsight[] = [
  {
    id: "ep-1",
    deviations: {
      hrPct: 24,
      hrvPct: -43,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 28, status: "trough", halfLifeHours: 22 },
        { drugName: "flecainide", brandName: "Tambocor", levelPct: 41, status: "declining", halfLifeHours: 15 },
        { drugName: "magnesium oxide", brandName: "Mag-Ox 400", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [
      { triggerType: "Sleep deprivation", source: "Clinical note" },
    ],
    narrative: "HR 92 bpm is 24% above your 7-day resting average (74 bpm) and inside the ICD gap (70\u2013190 bpm). HRV 24 ms is 43% below baseline (42 ms), indicating autonomic stress. Nadolol at 28% \u2014 deep trough. Flecainide at 41% and declining. Prior night: 5h 10m sleep (poor quality). Two known risk factors converging: medication trough + sleep deficit.",
    contextNarrative: "In the 12 hours before this episode, heart rate trended upward from 74 to 88 bpm while nadolol declined from 52% to 28%. Flecainide was at 41% and declining. HRV dropped steadily from 38 to 24 ms. Sleep the prior night was 5h 10m with only 37 min deep sleep \u2014 significantly below the 6h 50m average. No unusual weather deviations. Primary pattern: medication trough compounded by sleep deficit.",
  },
  {
    id: "ep-2",
    deviations: {
      hrPct: 19,
      hrvPct: -33,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 45, status: "declining", halfLifeHours: 22 },
        { drugName: "flecainide", brandName: "Tambocor", levelPct: 32, status: "declining", halfLifeHours: 15 },
        { drugName: "magnesium oxide", brandName: "Mag-Ox 400", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [],
    narrative: "HR 88 bpm is 19% above your resting average (74 bpm), within the ICD gap. HRV 28 ms is 33% below baseline (42 ms). Nadolol at 45% \u2014 declining but above trough. Flecainide at 32%. Sleep the prior night was adequate (7h 02m, fair quality). No known triggers matched. Drug level decline may be the primary factor.",
    contextNarrative: "Heart rate was elevated but stable in the 6 hours before the episode, averaging 83 bpm. Nadolol declined from 68% to 45% over this window. HRV showed gradual decline from 35 to 28 ms. Body temperature was normal at 36.2\u00b0C. Weather conditions unremarkable at 13\u00b0C, 58% humidity.",
  },
  {
    id: "ep-3",
    deviations: {
      hrPct: 28,
      hrvPct: -48,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 25, status: "trough", halfLifeHours: 22 },
        { drugName: "flecainide", brandName: "Tambocor", levelPct: 18, status: "trough", halfLifeHours: 15 },
        { drugName: "magnesium oxide", brandName: "Mag-Ox 400", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [
      { triggerType: "Sleep deprivation", source: "Clinical note" },
      { triggerType: "Physical exertion", source: "Clinical note" },
    ],
    narrative: "HR 95 bpm is 28% above resting average \u2014 the highest this week \u2014 and deep inside the ICD gap. HRV 22 ms is 48% below baseline, indicating significant autonomic stress. Both nadolol (25%) and flecainide (18%) are in trough. Prior night: 5h 22m sleep (poor). Walking activity detected 20 minutes before tap. Three risk factors converging: dual medication trough + sleep deficit + physical exertion.",
    contextNarrative: "This episode shows the strongest pre-episode signal of the week. Heart rate climbed from 72 to 95 bpm over 8 hours as both nadolol and flecainide declined into trough windows simultaneously. HRV dropped from 40 to 22 ms. Sleep the prior night was poor (5h 22m, 2 awakenings). Activity sensor detected walking 20 minutes before the tap. Body temperature slightly elevated at 36.5\u00b0C.",
  },
  {
    id: "ep-4",
    deviations: {
      hrPct: 14,
      hrvPct: -24,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 52, status: "therapeutic", halfLifeHours: 22 },
        { drugName: "flecainide", brandName: "Tambocor", levelPct: 58, status: "therapeutic", halfLifeHours: 15 },
        { drugName: "magnesium oxide", brandName: "Mag-Ox 400", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [],
    narrative: "HR 84 bpm is 14% above resting average, within normal variation. HRV 32 ms is 24% below baseline but within acceptable range. Both nadolol (52%) and flecainide (58%) are at therapeutic levels. Sleep was adequate (7h 15m, good). No known triggers matched. This episode occurred during therapeutic drug coverage \u2014 context alone does not explain the event.",
    contextNarrative: "An atypical episode \u2014 vitals were near baseline and medication levels were therapeutic. Heart rate was stable around 78\u201384 bpm in the hours before. HRV was slightly depressed at 32 ms but not dramatically. Sleep, temperature, and weather were all within normal ranges. This event may warrant discussion with the care team as it doesn\u2019t fit the usual trough-window pattern.",
  },
  {
    id: "ep-5",
    deviations: {
      hrPct: 22,
      hrvPct: -38,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 29, status: "trough", halfLifeHours: 22 },
        { drugName: "flecainide", brandName: "Tambocor", levelPct: 22, status: "trough", halfLifeHours: 15 },
        { drugName: "magnesium oxide", brandName: "Mag-Ox 400", levelPct: null, status: "not_taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [
      { triggerType: "Sleep deprivation", source: "Clinical note" },
    ],
    narrative: "HR 90 bpm is 22% above resting average, inside the ICD gap. HRV 26 ms is 38% below baseline. Both nadolol (29%) and flecainide (22%) are in trough. Mag-Ox 400 was not taken this day. Prior night: 5h 30m sleep (poor). One known trigger matched: sleep deprivation. Dual drug trough + missed supplement + poor sleep.",
    contextNarrative: "Heart rate rose steadily from 73 to 90 bpm as medication levels declined. Both drugs entered trough simultaneously around hour 16 post-dose. HRV mirrored the decline, dropping from 36 to 26 ms. Sleep deficit from the prior night (5h 30m, poor quality) likely contributed to reduced autonomic resilience. Mag-Ox 400 dose was missed.",
  },
  {
    id: "ep-6",
    deviations: {
      hrPct: 16,
      hrvPct: -29,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 38, status: "declining", halfLifeHours: 22 },
        { drugName: "flecainide", brandName: "Tambocor", levelPct: 45, status: "declining", halfLifeHours: 15 },
        { drugName: "magnesium oxide", brandName: "Mag-Ox 400", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [],
    narrative: "HR 86 bpm is 16% above resting average, inside the ICD gap. HRV 30 ms is 29% below baseline. Nadolol at 38% \u2014 declining but above trough threshold. Flecainide at 45%. Sleep was fair (6h 10m). No known triggers matched. Moderate drug decline may be the primary factor, though overall risk profile is lower than trough-window episodes.",
    contextNarrative: "A moderate episode. Heart rate averaged 80 bpm in the preceding hours, rising gradually to 86 bpm. Drug levels were declining but had not yet reached trough. HRV was mildly depressed. Sleep the prior night was fair at 6h 10m. Weather was mild at 11\u00b0C. This episode sits between the clear trough-pattern events and the unexplained therapeutic-level event.",
  },
];

export const EPISODE_SUMMARY: EpisodeSummary = {
  totalEpisodes: 6,
  periodDays: 7,
  frequencyPerDay: 0.86,
  baselineFrequencyPerDay: 0.43,
  troughCorrelationPct: 67,
  sleepCorrelationPct: 50,
  icdGapPct: 100,
  contributingFactors: [
    { label: "Nadolol trough (<30%)", correlationPct: 67, color: "red" },
    { label: "Below-average sleep", correlationPct: 50, color: "amber" },
    { label: "Flecainide trough", correlationPct: 33, color: "amber" },
    { label: "Dual drug trough", correlationPct: 33, color: "red" },
    { label: "Elevated body temp", correlationPct: 17, color: "green" },
  ],
  narrative: "Over the past 7 days, episodes cluster during nadolol trough windows \u2014 4 of 6 events occurred when drug coverage was below 30%. Sleep quality compounds this: episodes following poor sleep show higher heart rates (avg 92 vs 85 bpm). Notably, all 6 episodes fell within the ICD gap (70\u2013190 bpm), reinforcing that Guardrail is capturing events the ICD deliberately ignores. One episode occurred at therapeutic drug levels and may warrant clinical discussion.",
};

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

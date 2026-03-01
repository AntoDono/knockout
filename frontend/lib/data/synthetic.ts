import type { DrugOption, EpisodeInsight, EpisodeSummary } from "../types";

export const DRUG_OPTIONS: DrugOption[] = [
  // ── First-line for TKOS / CPVT ─────────────────────────
  { name: "Nadolol", tHalfHours: 22, qtRisk: "none", category: "first-line",
    description: "Preferred non-selective beta-blocker for CPVT/TKOS — suppresses catecholamine-triggered arrhythmias with long, stable coverage." },
  { name: "Flecainide", tHalfHours: 14, qtRisk: "moderate", category: "first-line",
    description: "Sodium channel blocker that also inhibits the ryanodine receptor (RyR2), directly targeting the calcium leak underlying CPVT/TKOS." },

  // ── Alternative beta-blockers ──────────────────────────
  { name: "Propranolol", tHalfHours: 5, qtRisk: "none", category: "alternative",
    description: "Non-selective beta-blocker used when nadolol is unavailable — shorter half-life requires more frequent dosing." },
  { name: "Carvedilol", tHalfHours: 8, qtRisk: "none", category: "alternative",
    description: "Non-selective beta-blocker with additional alpha-1 blockade, providing vasodilation alongside heart rate control." },
  { name: "Atenolol", tHalfHours: 7, qtRisk: "none", category: "alternative",
    description: "Selective beta-1 blocker — less preferred for CPVT as studies show higher arrhythmic event rates vs. non-selective agents." },
  { name: "Metoprolol", tHalfHours: 6, qtRisk: "none", category: "alternative",
    description: "Selective beta-1 blocker with variable metabolism (CYP2D6) — inferior outcomes compared to nadolol in CPVT." },

  // ── Reserve / refractory ───────────────────────────────
  { name: "Verapamil", tHalfHours: 8, qtRisk: "moderate", category: "reserve",
    description: "Calcium channel blocker that slows AV conduction — limited role in CPVT but may help manage concurrent atrial fibrillation." },
  { name: "Mexiletine", tHalfHours: 12, qtRisk: "none", category: "reserve",
    description: "Oral lidocaine analog that shortens action potential duration — adjunctive therapy for refractory ventricular arrhythmias." },
  { name: "Amiodarone", tHalfHours: 2400, qtRisk: "high", category: "reserve",
    description: "Broad-spectrum antiarrhythmic (multi-channel blocker) — last resort due to significant side effects and QT prolongation." },
  { name: "Sotalol", tHalfHours: 12, qtRisk: "high", category: "reserve",
    description: "Combined beta-blocker and potassium channel blocker — high QT prolongation risk limits use in TKOS patients." },

  // ── QT-risk medications to monitor ─────────────────────
  { name: "Dofetilide", tHalfHours: 10, qtRisk: "high", category: "qt-risk",
    description: "Potassium channel blocker for atrial fibrillation — significant QT prolongation risk, contraindicated with QT-sensitive conditions." },
  { name: "Ondansetron", tHalfHours: 4, qtRisk: "high", category: "qt-risk",
    description: "Anti-nausea medication — prolongs QT interval and should be avoided or used cautiously in TKOS patients." },
  { name: "Azithromycin", tHalfHours: 68, qtRisk: "high", category: "qt-risk",
    description: "Common antibiotic with documented QT prolongation risk — safer alternatives should be preferred for TKOS patients." },
  { name: "Ciprofloxacin", tHalfHours: 4, qtRisk: "moderate", category: "qt-risk",
    description: "Fluoroquinolone antibiotic with moderate QT risk — use with caution and monitoring in TKOS patients." },
  { name: "Fluconazole", tHalfHours: 30, qtRisk: "moderate", category: "qt-risk",
    description: "Antifungal with moderate QT prolongation risk — dose-dependent effect, monitor closely if prescribed." },
  { name: "Escitalopram", tHalfHours: 32, qtRisk: "moderate", category: "qt-risk",
    description: "SSRI antidepressant with moderate QT risk — if needed, use lower doses with cardiac monitoring." },
];

// ── Episode Intelligence (hard-coded UI) ────────────────

export const EPISODE_INSIGHTS: EpisodeInsight[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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
    id: 6,
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
  narrative: "Over the past 7 days, episodes cluster during nadolol trough windows \u2014 4 of 6 events occurred when drug coverage was below 30%. Sleep quality compounds this: episodes following poor sleep show higher heart rates (avg 92 vs 85 bpm). Notably, all 6 episodes fell within the ICD gap (70\u2013190 bpm), reinforcing that Knockout is capturing events the ICD deliberately ignores. One episode occurred at therapeutic drug levels and may warrant clinical discussion.",
};

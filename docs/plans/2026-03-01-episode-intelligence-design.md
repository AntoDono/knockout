# Episode Intelligence Layer — Design

## Goal

Transform the episodes page from a flat list of snapshots into an intelligent analysis surface that cross-references each episode against the patient's full clinical profile, passive data streams, and medication pharmacokinetics. All insights are hard-coded UI for now — no live AI calls.

## Audience

Both patient/family and cardiologist. Language is plain and accessible but clinically precise enough for a physician reviewing the same screen.

---

## 1. Episode Summary Panel

Sits at the top of the episodes page, above the filter chips and episode list.

### 1A. Pattern Highlights

A row of insight chips, each surfacing a cross-episode finding:

- **Trough Correlation** — "4 of 6 episodes during nadolol trough (<30%)" — red badge
- **Sleep Link** — "3 episodes followed poor sleep (<6h)" — amber badge
- **Episode Frequency** — "0.86/day this week vs. 0.43 baseline" — trend arrow (up = worse)
- **ICD Gap Activity** — "5 of 6 episodes fell within ICD gap (70–190 bpm)" — warning indicator

### 1B. Contributing Factors Breakdown

A ranked horizontal bar chart showing which factors most frequently coincide with episodes:

1. Nadolol trough (<30%) — 67% of episodes
2. Below-average sleep — 50% of episodes
3. Spironolactone trough — 33% of episodes
4. Elevated body temperature — 33% of episodes
5. High ambient humidity — 17% of episodes

This mirrors the output the future Layer 5 Bayesian model would compute.

### 1C. AI Summary Narrative

2–3 sentences in calm, clinical-but-accessible language:

> "Over the past 7 days, episodes cluster during nadolol trough windows — 4 of 6 events occurred when drug coverage was below 30%. Sleep quality appears to compound this: episodes following poor sleep nights show higher heart rates (avg 92 vs 85 bpm). This pattern is consistent with Dishita's known sensitivity to medication timing and sleep deprivation."

---

## 2. Per-Episode Insight Card

Each EpisodeCard gets three new sections between the metrics grid and the 24h context toggle.

### 2A. Multi-Drug Level Display

Replace the single drug percentage with a stacked display for all clinically relevant medications:

| Drug | Display | PK Tracking |
|---|---|---|
| **Nadolol (Corgard)** 40 mg BID | Percentage + color badge (red <30%, amber <50%, green >=50%) | Half-life 22h, exponential decay from each dose |
| **Spironolactone (Aldactone)** 25 mg daily | Percentage + color badge | Active metabolite half-life ~15h, decay from morning dose |
| **Vitamin D3** 400 units daily | "Taken" / "Not taken" pill badge | No PK curve — binary status |

Sprintec and multivitamin are listed in the patient profile but not shown on episode cards (not cardiac-relevant).

### 2B. AI Insight Narrative

A 2–3 line paragraph per episode that cross-references the snapshot against the full patient profile:

> "HR 92 bpm is 24% above your 7-day resting average (74 bpm) and inside the ICD gap (70–190 bpm). HRV 24 ms is 43% below baseline (42 ms), indicating autonomic stress. Nadolol at 28% — deep trough. Spironolactone at 41%. Prior night: 5h 10m sleep (poor quality). Two known risk factors converging: medication trough + sleep deficit."

### 2C. Deviation Indicators

Each metric gets a small tag showing deviation from the patient's personal 7-day baseline:

- HR 92 bpm → `+24%` (red if >15% above baseline)
- HRV 24 ms → `-43%` (red if >20% below baseline)
- Nadolol 28% → `Trough` (red badge)
- Spironolactone 41% → `Declining` (amber badge)

Color thresholds:
- HR: green (within ±10%), amber (±10–15%), red (>±15%)
- HRV: green (within ±15%), amber (±15–20%), red (>±20%)
- Drug: green (>=50%), amber (30–49%), red (<30%)

### 2D. Trigger Match Tags

If episode context matches any documented trigger from `KnownTrigger[]`, show small tags:

- `Sleep deprivation` — if prior night sleep was <6h (matches known trigger)
- `Physical exertion` — if activity was "walking" or "active" near episode time
- `Heat exposure` — if ambient temperature was significantly above weekly average

Tags reference the trigger source (e.g., "Clinical note" or "ICD discharge 2011").

---

## 3. Enhanced 24-Hour Context Window

The expandable context section gets three layers.

### 3A. Mini Timeline Chart

A compact multi-line chart (Recharts, consistent with existing app patterns) showing ±12h from episode:

- **HR line** (red) — 5-minute readings from HR_HISTORY
- **HRV line** (blue) — secondary Y-axis, from HRV_HISTORY
- **Nadolol decay curve** (purple, dashed) — computed from dose times + 22h half-life
- **Spironolactone decay curve** (teal, dashed) — computed from dose time + 15h half-life
- **ICD gap zone** — light gray horizontal band between 70–190 bpm
- **Episode marker** — vertical dotted line with a dot at the tap moment

This is the visual that ties everything together: the drug curves declining, HRV dropping, and HR rising in the hours before the tap.

### 3B. Context Stats (Existing Grid, Enhanced)

Keep the MiniStat grid but add baseline comparisons:

- Avg HR → "82 bpm — +11% vs baseline"
- HR Range → "68–95 bpm"
- Avg HRV → "30 ms — -29% vs baseline"
- Body Temp → "36.4°C — +0.25° vs baseline"
- Sleep → "5h 10m (poor) — 37 min deep, 1h 18m REM, 3 awakenings"
- Weather → "14°C, 68% humidity — +1.5° above weekly avg"

### 3C. Context Narrative

A short paragraph summarizing the 24-hour window:

> "In the 12 hours before this episode, heart rate trended upward from 74 to 88 bpm while nadolol declined from 52% to 28%. Spironolactone was at 41% and declining. HRV dropped steadily from 38 to 24 ms. Sleep the prior night was 5h 10m with only 37 min deep sleep — significantly below the 6h 50m average. No unusual weather deviations. Primary pattern: medication trough compounded by sleep deficit."

---

## 4. Updated Medication Data

The synthetic data module needs to be expanded with the full medication list from clinical records:

```
Medication             Dose          Schedule       Half-life    Cardiac   PK Track
─────────────────────────────────────────────────────────────────────────────────
Nadolol (Corgard)      40 mg         BID (AM+PM)    22h          Yes       Yes
Spironolactone         25 mg         Once daily AM  ~15h*        Indirect  Yes
Cholecalciferol (D3)   400 units     Once daily     N/A          Indirect  Binary
Sprintec               0.25-35 mg   Once daily AM  N/A          No        No
Multivitamin           1 tablet      Once daily AM  N/A          No        No
```

*Spironolactone parent half-life is 1.4h, but active metabolites (canrenone, TMS, HTMS) have half-lives of 13.8–16.5h. We track the effective metabolite half-life of ~15h.

### Cardiac relevance notes

- **Spironolactone**: Potassium-sparing diuretic. K+ homeostasis is critical for TKOS patients whose arrhythmias involve calcium channel dysfunction. Hypokalemia independently increases arrhythmia risk.
- **Vitamin D3**: Deficiency is linked to increased atrial fibrillation risk and disrupted cardiac calcium channels. At 400 units/day this is standard supplementation — tracking compliance matters.
- **Sprintec**: Prescribed for PCOS diagnosis. No documented QT prolongation. Not tracked for episodes.

---

## 5. Data Architecture

All new data is hard-coded in the synthetic module (`lib/data/synthetic.ts`). No backend changes needed.

### New types needed

```typescript
interface EpisodeInsight {
  id: string;                          // matches Episode.id
  deviations: {
    hrPct: number;                     // % above/below baseline
    hrvPct: number;                    // % above/below baseline
    drugLevels: DrugLevelSnapshot[];   // one per tracked medication
  };
  triggerMatches: string[];            // matched KnownTrigger types
  narrative: string;                   // hard-coded AI paragraph
  contextNarrative: string;            // hard-coded 24h context paragraph
}

interface DrugLevelSnapshot {
  drugName: string;
  brandName: string | null;
  levelPct: number | null;             // null if not PK-tracked
  status: "therapeutic" | "declining" | "trough" | "taken" | "not_taken";
  halfLifeHours: number | null;
}

interface EpisodeSummary {
  totalEpisodes: number;
  periodDays: number;
  frequencyPerDay: number;
  baselineFrequencyPerDay: number;
  troughCorrelationPct: number;        // % of episodes during drug trough
  sleepCorrelationPct: number;         // % preceded by poor sleep
  icdGapPct: number;                   // % within ICD gap zone
  contributingFactors: ContributingFactor[];
  narrative: string;                   // hard-coded summary paragraph
}

interface ContributingFactor {
  label: string;
  correlationPct: number;
  color: "red" | "amber" | "green";
}
```

### New synthetic data exports

- `EPISODE_INSIGHTS: EpisodeInsight[]` — one per episode
- `EPISODE_SUMMARY: EpisodeSummary` — cross-episode analysis
- `MEDICATIONS` array updated to include all 5 drugs with PK params

---

## 6. Component Changes

| Component | Change |
|---|---|
| `EpisodesPage` | Add EpisodeSummaryPanel above the episode list |
| `EpisodeCard` | Add multi-drug display, AI narrative, deviation indicators, trigger tags |
| `EpisodeContext` | Add timeline chart, enhance stats with baseline comparisons, add context narrative |
| **New: `EpisodeSummaryPanel`** | Pattern highlights + contributing factors chart + AI narrative |
| **New: `EpisodeTimeline`** | Recharts multi-line chart for 24h context |
| **New: `DrugLevelStack`** | Multi-drug level display component |
| **New: `DeviationTag`** | Reusable baseline deviation indicator |
| **New: `TriggerTag`** | Reusable trigger match badge |

---

## 7. Design Principles

- **Calm is clinical**: No alarming language. Insights are factual and measured. "Two risk factors converging" not "DANGER: multiple risks detected."
- **Personal baselines, not population norms**: Every deviation is compared against Dishita's own 7-day rolling averages.
- **Honest uncertainty**: Where data is insufficient, say so. "Insufficient data to determine sleep correlation" is better than guessing.
- **Multi-drug awareness**: Always show all cardiac-relevant medications, not just the primary one.
- **ICD gap visibility**: Every episode that falls within the 70–190 bpm blind zone is explicitly flagged — this is Knockout's core value proposition.

---

## Sources

- [Spironolactone pharmacokinetics — Wikipedia](https://en.wikipedia.org/wiki/Spironolactone)
- [Aldactone clinical pharmacology — Pfizer](https://www.pfizermedical.com/aldactone/clinical-pharmacology)
- [Vitamin D deficiency and cardiac arrhythmias — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9220304/)
- [Sprintec prescribing information — DailyMed](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d9252820-131a-4870-8b11-945d1bfd5659)

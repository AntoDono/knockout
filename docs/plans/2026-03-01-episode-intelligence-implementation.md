# Episode Intelligence Layer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the episodes page into an intelligent analysis surface with per-episode AI insights, cross-episode pattern summaries, multi-drug PK tracking, and enhanced 24h context with timeline visualization.

**Architecture:** All insights are hard-coded in the synthetic data module — no backend changes, no live AI calls. New types are added to `lib/types.ts`, new synthetic data to `lib/data/synthetic.ts`, and new components to `components/episodes/`. Existing components (`EpisodeCard`, `EpisodeContext`, `EpisodesPage`) are modified to consume the new data.

**Tech Stack:** Next.js 16, React 19, Recharts, Tailwind CSS v4, shadcn/ui, lucide-react icons.

**Note:** Per project preferences, no test files. Verify by running `npm run build` after each task.

---

## Task 1: Add New Types

**Files:**
- Modify: `frontend/lib/types.ts`

**Step 1: Add the new interfaces to the end of `lib/types.ts`**

```typescript
export interface DrugLevelSnapshot {
  drugName: string;
  brandName: string | null;
  levelPct: number | null;
  status: "therapeutic" | "declining" | "trough" | "taken" | "not_taken";
  halfLifeHours: number | null;
}

export interface EpisodeInsight {
  id: string;
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
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no type errors.

**Step 3: Commit**

```bash
git add frontend/lib/types.ts
git commit -m "feat: add episode intelligence types"
```

---

## Task 2: Expand Medications & Add Synthetic Insight Data

**Files:**
- Modify: `frontend/lib/data/synthetic.ts`
- Modify: `frontend/lib/types.ts` (add Medication fields if needed)

**Step 1: Update the MEDICATIONS array**

In `lib/data/synthetic.ts`, update the existing `MEDICATIONS` array to include all 5 drugs from clinical records. The existing two entries (nadolol, spironolactone) need updates, and three new entries are added.

Update **spironolactone** entry to add half-life:
```typescript
{
  id: "spironolactone-1",
  drugName: "spironolactone",
  brandName: "Aldactone",
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
}
```

Add three new medications after the existing two:
```typescript
{
  id: "cholecalciferol-1",
  drugName: "cholecalciferol",
  brandName: "Vitamin D3",
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
  drugName: "norgestimate-ethinyl estradiol",
  brandName: "Sprintec",
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
}
```

Note: The `Medication` interface in `types.ts` has `doseMg: number`. You'll need to change it to `doseMg: number | null` to support multivitamin (no mg dosage).

**Step 2: Add `EPISODE_INSIGHTS` array**

Add to the bottom of `synthetic.ts`, after the `EPISODES` export. Each insight matches an episode by `id`:

```typescript
export const EPISODE_INSIGHTS: EpisodeInsight[] = [
  {
    id: "ep-1",
    deviations: {
      hrPct: 24,
      hrvPct: -43,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 28, status: "trough", halfLifeHours: 22 },
        { drugName: "spironolactone", brandName: "Aldactone", levelPct: 41, status: "declining", halfLifeHours: 15 },
        { drugName: "cholecalciferol", brandName: "Vitamin D3", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [
      { triggerType: "Sleep deprivation", source: "Clinical note" },
    ],
    narrative: "HR 92 bpm is 24% above your 7-day resting average (74 bpm) and inside the ICD gap (70\u2013190 bpm). HRV 24 ms is 43% below baseline (42 ms), indicating autonomic stress. Nadolol at 28% \u2014 deep trough. Spironolactone at 41% and declining. Prior night: 5h 10m sleep (poor quality). Two known risk factors converging: medication trough + sleep deficit.",
    contextNarrative: "In the 12 hours before this episode, heart rate trended upward from 74 to 88 bpm while nadolol declined from 52% to 28%. Spironolactone was at 41% and declining. HRV dropped steadily from 38 to 24 ms. Sleep the prior night was 5h 10m with only 37 min deep sleep \u2014 significantly below the 6h 50m average. No unusual weather deviations. Primary pattern: medication trough compounded by sleep deficit.",
  },
  {
    id: "ep-2",
    deviations: {
      hrPct: 19,
      hrvPct: -33,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 45, status: "declining", halfLifeHours: 22 },
        { drugName: "spironolactone", brandName: "Aldactone", levelPct: 32, status: "declining", halfLifeHours: 15 },
        { drugName: "cholecalciferol", brandName: "Vitamin D3", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [],
    narrative: "HR 88 bpm is 19% above your resting average (74 bpm), within the ICD gap. HRV 28 ms is 33% below baseline (42 ms). Nadolol at 45% \u2014 declining but above trough. Spironolactone at 32%. Sleep the prior night was adequate (7h 02m, fair quality). No known triggers matched. Drug level decline may be the primary factor.",
    contextNarrative: "Heart rate was elevated but stable in the 6 hours before the episode, averaging 83 bpm. Nadolol declined from 68% to 45% over this window. HRV showed gradual decline from 35 to 28 ms. Body temperature was normal at 36.2\u00b0C. Weather conditions unremarkable at 13\u00b0C, 58% humidity.",
  },
  {
    id: "ep-3",
    deviations: {
      hrPct: 28,
      hrvPct: -48,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 25, status: "trough", halfLifeHours: 22 },
        { drugName: "spironolactone", brandName: "Aldactone", levelPct: 18, status: "trough", halfLifeHours: 15 },
        { drugName: "cholecalciferol", brandName: "Vitamin D3", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [
      { triggerType: "Sleep deprivation", source: "Clinical note" },
      { triggerType: "Physical exertion", source: "Clinical note" },
    ],
    narrative: "HR 95 bpm is 28% above resting average \u2014 the highest this week \u2014 and deep inside the ICD gap. HRV 22 ms is 48% below baseline, indicating significant autonomic stress. Both nadolol (25%) and spironolactone (18%) are in trough. Prior night: 5h 22m sleep (poor). Walking activity detected 20 minutes before tap. Three risk factors converging: dual medication trough + sleep deficit + physical exertion.",
    contextNarrative: "This episode shows the strongest pre-episode signal of the week. Heart rate climbed from 72 to 95 bpm over 8 hours as both nadolol and spironolactone declined into trough windows simultaneously. HRV dropped from 40 to 22 ms. Sleep the prior night was poor (5h 22m, 2 awakenings). Activity sensor detected walking 20 minutes before the tap. Body temperature slightly elevated at 36.5\u00b0C.",
  },
  {
    id: "ep-4",
    deviations: {
      hrPct: 14,
      hrvPct: -24,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 52, status: "therapeutic", halfLifeHours: 22 },
        { drugName: "spironolactone", brandName: "Aldactone", levelPct: 58, status: "therapeutic", halfLifeHours: 15 },
        { drugName: "cholecalciferol", brandName: "Vitamin D3", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [],
    narrative: "HR 84 bpm is 14% above resting average, within normal variation. HRV 32 ms is 24% below baseline but within acceptable range. Both nadolol (52%) and spironolactone (58%) are at therapeutic levels. Sleep was adequate (7h 15m, good). No known triggers matched. This episode occurred during therapeutic drug coverage \u2014 context alone does not explain the event.",
    contextNarrative: "An atypical episode \u2014 vitals were near baseline and medication levels were therapeutic. Heart rate was stable around 78\u201384 bpm in the hours before. HRV was slightly depressed at 32 ms but not dramatically. Sleep, temperature, and weather were all within normal ranges. This event may warrant discussion with the care team as it doesn\u2019t fit the usual trough-window pattern.",
  },
  {
    id: "ep-5",
    deviations: {
      hrPct: 22,
      hrvPct: -38,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 29, status: "trough", halfLifeHours: 22 },
        { drugName: "spironolactone", brandName: "Aldactone", levelPct: 22, status: "trough", halfLifeHours: 15 },
        { drugName: "cholecalciferol", brandName: "Vitamin D3", levelPct: null, status: "not_taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [
      { triggerType: "Sleep deprivation", source: "Clinical note" },
    ],
    narrative: "HR 90 bpm is 22% above resting average, inside the ICD gap. HRV 26 ms is 38% below baseline. Both nadolol (29%) and spironolactone (22%) are in trough. Vitamin D3 was not taken this day. Prior night: 5h 30m sleep (poor). One known trigger matched: sleep deprivation. Dual drug trough + missed supplement + poor sleep.",
    contextNarrative: "Heart rate rose steadily from 73 to 90 bpm as medication levels declined. Both drugs entered trough simultaneously around hour 16 post-dose. HRV mirrored the decline, dropping from 36 to 26 ms. Sleep deficit from the prior night (5h 30m, poor quality) likely contributed to reduced autonomic resilience. Vitamin D3 dose was missed.",
  },
  {
    id: "ep-6",
    deviations: {
      hrPct: 16,
      hrvPct: -29,
      drugLevels: [
        { drugName: "nadolol", brandName: "Corgard", levelPct: 38, status: "declining", halfLifeHours: 22 },
        { drugName: "spironolactone", brandName: "Aldactone", levelPct: 45, status: "declining", halfLifeHours: 15 },
        { drugName: "cholecalciferol", brandName: "Vitamin D3", levelPct: null, status: "taken", halfLifeHours: null },
      ],
    },
    triggerMatches: [],
    narrative: "HR 86 bpm is 16% above resting average, inside the ICD gap. HRV 30 ms is 29% below baseline. Nadolol at 38% \u2014 declining but above trough threshold. Spironolactone at 45%. Sleep was fair (6h 10m). No known triggers matched. Moderate drug decline may be the primary factor, though overall risk profile is lower than trough-window episodes.",
    contextNarrative: "A moderate episode. Heart rate averaged 80 bpm in the preceding hours, rising gradually to 86 bpm. Drug levels were declining but had not yet reached trough. HRV was mildly depressed. Sleep the prior night was fair at 6h 10m. Weather was mild at 11\u00b0C. This episode sits between the clear trough-pattern events and the unexplained therapeutic-level event.",
  },
];
```

**Step 3: Add `EPISODE_SUMMARY` object**

```typescript
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
    { label: "Spironolactone trough", correlationPct: 33, color: "amber" },
    { label: "Dual drug trough", correlationPct: 33, color: "red" },
    { label: "Elevated body temp", correlationPct: 17, color: "green" },
  ],
  narrative: "Over the past 7 days, episodes cluster during nadolol trough windows \u2014 4 of 6 events occurred when drug coverage was below 30%. Sleep quality compounds this: episodes following poor sleep show higher heart rates (avg 92 vs 85 bpm). Notably, all 6 episodes fell within the ICD gap (70\u2013190 bpm), reinforcing that Knockout is capturing events the ICD deliberately ignores. One episode occurred at therapeutic drug levels and may warrant clinical discussion.",
};
```

**Step 4: Add missing imports at the top of `synthetic.ts`**

Add `EpisodeInsight, EpisodeSummary` to the type imports from `../types`.

**Step 5: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add frontend/lib/types.ts frontend/lib/data/synthetic.ts
git commit -m "feat: add episode insight data and expanded medications"
```

---

## Task 3: Build Reusable Sub-Components (DeviationTag, TriggerTag, DrugLevelStack)

**Files:**
- Create: `frontend/components/episodes/DeviationTag.tsx`
- Create: `frontend/components/episodes/TriggerTag.tsx`
- Create: `frontend/components/episodes/DrugLevelStack.tsx`

**Step 1: Create `DeviationTag.tsx`**

A small inline tag showing deviation from baseline with color coding.

```tsx
"use client";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DeviationTagProps {
  valuePct: number;  // positive = above baseline, negative = below
  thresholds?: { amber: number; red: number };  // absolute % thresholds
}

const DEFAULT_THRESHOLDS = { amber: 15, red: 20 };

export function DeviationTag({ valuePct, thresholds = DEFAULT_THRESHOLDS }: DeviationTagProps) {
  const abs = Math.abs(valuePct);
  const color = abs >= thresholds.red ? "text-red-600 bg-red-50"
    : abs >= thresholds.amber ? "text-amber-600 bg-amber-50"
    : "text-green-600 bg-green-50";
  const Icon = valuePct > 2 ? TrendingUp : valuePct < -2 ? TrendingDown : Minus;
  const sign = valuePct > 0 ? "+" : "";

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md", color)}>
      <Icon className="h-2.5 w-2.5" />
      {sign}{valuePct}%
    </span>
  );
}
```

**Step 2: Create `TriggerTag.tsx`**

A small badge showing a matched trigger.

```tsx
import { AlertTriangle } from "lucide-react";

interface TriggerTagProps {
  triggerType: string;
  source: string;
}

export function TriggerTag({ triggerType, source }: TriggerTagProps) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
      title={`Source: ${source}`}
    >
      <AlertTriangle className="h-2.5 w-2.5" />
      {triggerType}
    </span>
  );
}
```

**Step 3: Create `DrugLevelStack.tsx`**

Displays multiple drug levels stacked vertically.

```tsx
import { Pill, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrugLevelSnapshot } from "@/lib/types";

interface DrugLevelStackProps {
  drugLevels: DrugLevelSnapshot[];
}

function statusLabel(status: DrugLevelSnapshot["status"]): string {
  switch (status) {
    case "therapeutic": return "Therapeutic";
    case "declining": return "Declining";
    case "trough": return "Trough";
    case "taken": return "Taken";
    case "not_taken": return "Not taken";
  }
}

function statusColor(status: DrugLevelSnapshot["status"]): string {
  switch (status) {
    case "therapeutic": return "text-green-700 bg-green-50";
    case "declining": return "text-amber-700 bg-amber-50";
    case "trough": return "text-red-700 bg-red-50";
    case "taken": return "text-green-700 bg-green-50";
    case "not_taken": return "text-muted-foreground bg-muted/50";
  }
}

export function DrugLevelStack({ drugLevels }: DrugLevelStackProps) {
  return (
    <div className="space-y-1.5">
      {drugLevels.map((drug) => (
        <div key={drug.drugName} className="flex items-center gap-2 text-xs">
          <Pill className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground min-w-[90px] truncate">
            {drug.brandName ?? drug.drugName}
          </span>
          {drug.levelPct !== null ? (
            <span className={cn("font-semibold tabular-nums", drug.status === "trough" ? "text-red-600" : drug.status === "declining" ? "text-amber-600" : "text-foreground")}>
              {drug.levelPct}%
            </span>
          ) : (
            drug.status === "taken" ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", statusColor(drug.status))}>
            {statusLabel(drug.status)}
          </span>
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds (components not yet imported anywhere).

**Step 5: Commit**

```bash
git add frontend/components/episodes/DeviationTag.tsx frontend/components/episodes/TriggerTag.tsx frontend/components/episodes/DrugLevelStack.tsx
git commit -m "feat: add DeviationTag, TriggerTag, DrugLevelStack components"
```

---

## Task 4: Build the Episode Summary Panel

**Files:**
- Create: `frontend/components/episodes/EpisodeSummaryPanel.tsx`

**Step 1: Create the summary panel component**

This sits at the top of the episodes page. It has three sections: pattern highlight chips, a contributing factors bar chart, and the AI narrative.

```tsx
"use client";
import { TrendingUp, Moon, Pill, ShieldAlert, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { EPISODE_SUMMARY } from "@/lib/data/synthetic";

function PatternChip({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border", color)}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xs font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function EpisodeSummaryPanel() {
  const s = EPISODE_SUMMARY;
  const freqTrend = s.frequencyPerDay > s.baselineFrequencyPerDay ? "up" : "down";

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm space-y-5">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Pattern Analysis
        </h2>
        <span className="text-[10px] text-muted-foreground ml-auto">Past {s.periodDays} days</span>
      </div>

      {/* Pattern Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <PatternChip
          icon={Pill}
          label="Trough Link"
          value={`${s.troughCorrelationPct}% of episodes`}
          color="border-red-200 bg-red-50/50 text-red-700"
        />
        <PatternChip
          icon={Moon}
          label="Sleep Link"
          value={`${s.sleepCorrelationPct}% of episodes`}
          color="border-amber-200 bg-amber-50/50 text-amber-700"
        />
        <PatternChip
          icon={TrendingUp}
          label="Frequency"
          value={`${s.frequencyPerDay}/day (${freqTrend === "up" ? "\u2191" : "\u2193"} from ${s.baselineFrequencyPerDay})`}
          color={freqTrend === "up" ? "border-red-200 bg-red-50/50 text-red-700" : "border-green-200 bg-green-50/50 text-green-700"}
        />
        <PatternChip
          icon={ShieldAlert}
          label="ICD Gap"
          value={`${s.icdGapPct}% in blind zone`}
          color="border-amber-200 bg-amber-50/50 text-amber-700"
        />
      </div>

      {/* Contributing Factors */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Contributing Factors</p>
        {s.contributingFactors.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground min-w-[140px] truncate">{f.label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  f.color === "red" ? "bg-red-400" : f.color === "amber" ? "bg-amber-400" : "bg-green-400"
                )}
                style={{ width: `${f.correlationPct}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums w-[36px] text-right">{f.correlationPct}%</span>
          </div>
        ))}
      </div>

      {/* AI Narrative */}
      <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
          <Brain className="h-3 w-3" /> AI Summary
        </p>
        <p className="text-sm text-foreground leading-relaxed">{s.narrative}</p>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`

**Step 3: Commit**

```bash
git add frontend/components/episodes/EpisodeSummaryPanel.tsx
git commit -m "feat: add EpisodeSummaryPanel component"
```

---

## Task 5: Build the Episode Timeline Chart

**Files:**
- Create: `frontend/components/episodes/EpisodeTimeline.tsx`

**Step 1: Create the timeline chart**

Uses Recharts `ComposedChart` (matching the `PKChart.tsx` pattern). Shows HR, HRV, and drug curves over the 24h window with the episode moment marked.

```tsx
"use client";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import type { Episode } from "@/lib/types";
import { HR_HISTORY, HRV_HISTORY } from "@/lib/data/synthetic";
import { decayConcentration } from "@/lib/simulate";

interface EpisodeTimelineProps {
  episode: Episode;
}

interface TimelinePoint {
  time: number;
  label: string;
  hr: number | null;
  hrv: number | null;
  nadolol: number;
  spironolactone: number;
}

function buildTimelineData(episode: Episode): TimelinePoint[] {
  const epTime = new Date(episode.recordedAt).getTime();
  const windowMs = 12 * 60 * 60 * 1000;
  const startMs = epTime - windowMs;
  const endMs = epTime + windowMs;
  const points: TimelinePoint[] = [];

  // Build 30-min resolution points
  for (let t = startMs; t <= endMs; t += 30 * 60 * 1000) {
    const d = new Date(t);
    const hour = d.getHours();
    const min = d.getMinutes();
    const label = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

    // Find nearest HR reading (within 5 min)
    const nearHr = HR_HISTORY.find((r) => Math.abs(new Date(r.recordedAt).getTime() - t) < 5 * 60 * 1000);
    const nearHrv = HRV_HISTORY.find((r) => Math.abs(new Date(r.recordedAt).getTime() - t) < 5 * 60 * 1000);

    // Compute drug levels at this time
    // Nadolol: BID at 09:00 and 20:00, half-life 22h
    const nadololDoses = [9, 20];
    let nadolol = 0;
    for (const doseHour of nadololDoses) {
      const dose = new Date(d);
      dose.setHours(doseHour, 0, 0, 0);
      if (dose > d) dose.setDate(dose.getDate() - 1);
      // Also check previous day's dose
      const prevDose = new Date(dose);
      prevDose.setDate(prevDose.getDate() - 1);
      nadolol += decayConcentration(dose, 22, d) * 0.5;
      nadolol += decayConcentration(prevDose, 22, d) * 0.5;
    }
    nadolol = Math.min(100, nadolol);

    // Spironolactone: once daily at 09:00, half-life 15h
    const spiroDose = new Date(d);
    spiroDose.setHours(9, 0, 0, 0);
    if (spiroDose > d) spiroDose.setDate(spiroDose.getDate() - 1);
    const spironolactone = decayConcentration(spiroDose, 15, d);

    points.push({
      time: t,
      label,
      hr: nearHr?.hrBpm ?? null,
      hrv: nearHrv?.hrvMs ?? null,
      nadolol: Math.round(nadolol),
      spironolactone: Math.round(spironolactone),
    });
  }

  return points;
}

export function EpisodeTimeline({ episode }: EpisodeTimelineProps) {
  const data = buildTimelineData(episode);
  const epTime = new Date(episode.recordedAt).getTime();

  // Find the closest data point to the episode time for the reference line
  const epLabel = data.reduce((closest, p) =>
    Math.abs(p.time - epTime) < Math.abs(closest.time - epTime) ? p : closest
  , data[0]).label;

  return (
    <div className="mt-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">24-Hour Timeline</p>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

          {/* ICD Gap zone: 70-190 bpm */}
          <ReferenceArea y1={70} y2={190} fill="#f59e0b" fillOpacity={0.04} />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
            interval={5}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="hr"
            domain={[50, 120]}
            tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={30}
          />

          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--color-border)" }}
            labelFormatter={(label) => `Time: ${label}`}
          />

          {/* HR area + line */}
          <Area yAxisId="hr" type="monotone" dataKey="hr" stroke="#ef4444" fill="url(#hrGradient)" strokeWidth={1.5} dot={false} connectNulls />

          {/* HRV line */}
          <Line yAxisId="hr" type="monotone" dataKey="hrv" stroke="#3b82f6" strokeWidth={1} dot={false} connectNulls strokeDasharray="2 2" />

          {/* Drug curves */}
          <Line yAxisId="pct" type="monotone" dataKey="nadolol" stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="6 3" />
          <Line yAxisId="pct" type="monotone" dataKey="spironolactone" stroke="#14b8a6" strokeWidth={1.5} dot={false} strokeDasharray="6 3" />

          {/* Episode marker */}
          <ReferenceLine x={epLabel} yAxisId="hr" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 rounded" /> HR</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 rounded border-dashed" /> HRV</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 rounded" /> Nadolol</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-teal-500 rounded" /> Spironolactone</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-100 border border-amber-300 rounded-sm" /> ICD Gap</span>
        <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-red-500 rounded" /> Episode</span>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`

**Step 3: Commit**

```bash
git add frontend/components/episodes/EpisodeTimeline.tsx
git commit -m "feat: add EpisodeTimeline chart component"
```

---

## Task 6: Enhance EpisodeCard with Insights

**Files:**
- Modify: `frontend/components/episodes/EpisodeCard.tsx`

**Step 1: Update `EpisodeCard` to accept and display insights**

Replace the single drug metric column with `DrugLevelStack`, add the AI narrative, deviation indicators, and trigger tags. The component now imports insight data and looks up the matching insight for each episode.

Key changes to `EpisodeCard.tsx`:
- Import `EPISODE_INSIGHTS` from synthetic data
- Import `DeviationTag`, `TriggerTag`, `DrugLevelStack`
- Look up `insight` by matching `episode.id`
- Replace the 3-column grid: keep HR and HRV with deviation tags, replace drug column with `DrugLevelStack`
- Add AI narrative section below the metrics
- Add trigger tags if any matches exist
- Keep the existing 24h context toggle and expand behavior

The border-left color logic should now check the primary drug (nadolol) from `insight.deviations.drugLevels[0]` instead of `ep.drugLevelPct`.

Refer to `frontend/components/episodes/EpisodeCard.tsx` (currently 69 lines) for the exact current code to modify.

**Step 2: Verify build + visual check**

Run: `cd frontend && npm run build`
Then: `cd frontend && npm run dev` — navigate to `/episodes` and verify each card shows the new sections.

**Step 3: Commit**

```bash
git add frontend/components/episodes/EpisodeCard.tsx
git commit -m "feat: enhance EpisodeCard with AI insights and multi-drug display"
```

---

## Task 7: Enhance EpisodeContext with Timeline and Narratives

**Files:**
- Modify: `frontend/components/episodes/EpisodeContext.tsx`

**Step 1: Update `EpisodeContext` to include the three layers**

Key changes to `EpisodeContext.tsx`:
- Import `EpisodeTimeline` component
- Import `EPISODE_INSIGHTS` and `BASELINES` from synthetic data
- Look up the matching insight by episode ID for the context narrative
- **Layer 1**: Add `<EpisodeTimeline episode={episode} />` at the top
- **Layer 2**: Enhance existing `MiniStat` grid with baseline comparison text (e.g., "82 bpm — +11% vs baseline"). Use `BASELINES` to compute the comparison.
- **Layer 3**: Add the context narrative paragraph from `insight.contextNarrative`

Enhance each `MiniStat` — either add a secondary line or append the comparison to the value string. For example:
- Current: `value={avgHr}` `unit="bpm"`
- New: `value={avgHr}` `unit="bpm"` with a comparison line like `${deviation > 0 ? "+" : ""}${deviation}% vs baseline`

Add the narrative at the bottom:

```tsx
{insight?.contextNarrative && (
  <div className="rounded-xl bg-muted/30 p-3 border border-border/50 mt-3">
    <p className="text-xs font-medium text-muted-foreground mb-1">Context Analysis</p>
    <p className="text-xs text-foreground leading-relaxed">{insight.contextNarrative}</p>
  </div>
)}
```

Refer to `frontend/components/episodes/EpisodeContext.tsx` (currently 125 lines) for the exact current code to modify.

**Step 2: Verify build + visual check**

Run: `cd frontend && npm run build`
Then: `cd frontend && npm run dev` — expand a card's 24h context and verify the timeline chart renders with the narrative below.

**Step 3: Commit**

```bash
git add frontend/components/episodes/EpisodeContext.tsx
git commit -m "feat: enhance 24h context with timeline chart and narrative"
```

---

## Task 8: Wire EpisodeSummaryPanel into the Episodes Page

**Files:**
- Modify: `frontend/app/episodes/page.tsx`

**Step 1: Add the summary panel to the page**

Import `EpisodeSummaryPanel` and render it between the header and the episode list.

In `frontend/app/episodes/page.tsx`, add:

```tsx
import { EpisodeSummaryPanel } from "@/components/episodes/EpisodeSummaryPanel";
```

Then in the JSX, insert `<EpisodeSummaryPanel />` after the header div (with the title and filter chips) and before the `<div className="space-y-4">` that contains the episode cards.

Refer to `frontend/app/episodes/page.tsx` (currently 61 lines) for the exact placement.

**Step 2: Full visual check**

Run: `cd frontend && npm run dev`
Navigate to `/episodes` and verify:
1. Summary panel appears at the top with pattern chips, bar chart, and narrative
2. Each episode card shows multi-drug levels, deviation tags, trigger matches, and AI narrative
3. Expanding 24h context shows the timeline chart, enhanced stats, and context narrative
4. Filter buttons still work (7 days / 30 days / All)
5. Mobile responsive — check at narrow viewport

**Step 3: Verify production build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add frontend/app/episodes/page.tsx
git commit -m "feat: wire EpisodeSummaryPanel into episodes page"
```

---

## Task 9: Final Polish and Lint

**Files:**
- All modified/created files

**Step 1: Run lint**

Run: `cd frontend && npm run lint`
Fix any lint errors.

**Step 2: Run build**

Run: `cd frontend && npm run build`
Verify clean build with no warnings.

**Step 3: Visual walkthrough**

Run: `cd frontend && npm run dev`
Complete visual check of the entire episodes page:
- Summary panel renders correctly
- All 6 episode cards show insights
- Drug level stacks display all 3 tracked medications
- Deviation tags show correct colors (red/amber/green)
- Trigger tags appear on episodes that match known triggers
- Timeline charts render with HR, HRV, and both drug curves
- ICD gap zone is visible on timeline
- Context narratives are readable and well-formatted
- Page is responsive at mobile and desktop widths

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: lint and polish episode intelligence layer"
```

---

## Summary

| Task | Component | Estimated Scope |
|------|-----------|----------------|
| 1 | Types | ~30 lines added to `types.ts` |
| 2 | Synthetic data | ~150 lines added to `synthetic.ts` |
| 3 | Sub-components | 3 new files (~120 lines total) |
| 4 | Summary panel | 1 new file (~90 lines) |
| 5 | Timeline chart | 1 new file (~120 lines) |
| 6 | EpisodeCard enhancement | Modify existing (~50 lines changed) |
| 7 | EpisodeContext enhancement | Modify existing (~40 lines changed) |
| 8 | Page wiring | Modify existing (~5 lines changed) |
| 9 | Polish | Lint + build + visual check |

**Total: ~9 tasks, 5 new files, 3 modified files, ~600 lines of code.**

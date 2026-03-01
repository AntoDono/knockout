# Frontend Clean Slate Rebuild — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 5-page cardiac monitoring dashboard with an orange+white design system, powered by synthetic demo data.

**Architecture:** Next.js 16 App Router with 5 routes (Dashboard, Medications, Episodes, Reports, Profile). Shared top nav (desktop) and bottom nav (mobile). All data from a single synthetic data file — no backend API calls. Recharts for charts, shadcn/ui for primitives.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Recharts, shadcn/ui (Radix), Lucide + Phosphor icons, Plus Jakarta Sans font.

**Design reference:** See `docs/plans/2026-03-01-frontend-design.md` for full design spec.

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `frontend/package.json`, `frontend/next.config.ts`, `frontend/tsconfig.json`, `frontend/postcss.config.mjs`, `frontend/eslint.config.mjs`, `frontend/app/layout.tsx`, `frontend/app/page.tsx`, `frontend/app/globals.css`, `frontend/lib/utils.ts`

**Step 1: Remove stale .next cache and scaffold**

```bash
cd /Users/datct/CSProjects/PersonalProjects/knockout
rm -rf frontend/.next
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --turbopack
```

Accept all defaults. This creates the full Next.js 16 scaffold.

**Step 2: Install dependencies**

```bash
cd frontend
npm install recharts@2 lucide-react @phosphor-icons/react sonner next-themes clsx tailwind-merge
```

**Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Select: New York style, neutral base color, CSS variables yes.

**Step 4: Add shadcn components**

```bash
npx shadcn@latest add badge button card dialog input label progress scroll-area select separator tabs
```

**Step 5: Create `lib/utils.ts`**

```typescript
// frontend/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 6: Verify scaffold works**

```bash
npm run dev
```

Visit http://localhost:3000 — should show default Next.js page.

**Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Next.js 16 frontend with shadcn/ui and dependencies"
```

---

## Task 2: Design System — globals.css + Layout

**Files:**
- Rewrite: `frontend/app/globals.css`
- Rewrite: `frontend/app/layout.tsx`

**Step 1: Rewrite globals.css with orange theme**

Replace `frontend/app/globals.css` entirely with:

```css
@import "tailwindcss";
@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --color-sidebar-background: var(--sidebar-background);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-lg: var(--radius);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
}

:root {
  --radius: 0.625rem;

  --background: oklch(0.985 0.002 90);          /* warm near-white #FAFAFA */
  --foreground: oklch(0.145 0.005 285);          /* neutral-900 */
  --card: oklch(1.0 0 0);                        /* white */
  --card-foreground: oklch(0.145 0.005 285);
  --popover: oklch(1.0 0 0);
  --popover-foreground: oklch(0.145 0.005 285);
  --primary: oklch(0.65 0.19 45);                /* orange-500 #F97316 */
  --primary-foreground: oklch(1.0 0 0);          /* white */
  --secondary: oklch(0.97 0.01 90);              /* orange-50 #FFF7ED */
  --secondary-foreground: oklch(0.50 0.12 45);   /* orange-700 */
  --muted: oklch(0.96 0.005 90);
  --muted-foreground: oklch(0.55 0.01 285);      /* neutral-500 */
  --accent: oklch(0.97 0.01 90);
  --accent-foreground: oklch(0.50 0.12 45);
  --destructive: oklch(0.55 0.22 29);            /* red-500 */
  --destructive-foreground: oklch(1.0 0 0);
  --border: oklch(0.92 0.005 90);
  --input: oklch(0.92 0.005 90);
  --ring: oklch(0.65 0.19 45);                   /* orange-500 */

  --chart-1: oklch(0.65 0.19 45);                /* orange-500 — drug level */
  --chart-2: oklch(0.55 0.01 285);               /* neutral-500 — HRV */
  --chart-3: oklch(0.55 0.22 29);                /* red-500 — heart rate / danger */
  --chart-4: oklch(0.70 0.18 85);                /* amber-500 — warning */
  --chart-5: oklch(0.60 0.17 145);               /* green-500 — healthy */
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Custom animations */
@keyframes pulse-live {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-pulse-live {
  animation: pulse-live 2s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Smooth scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: oklch(0.85 0.005 90); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: oklch(0.75 0.005 90); }
```

**Step 2: Rewrite layout.tsx**

Replace `frontend/app/layout.tsx` entirely:

```tsx
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Guardrail · TKOS Cardiac Monitoring",
  description: "Cardiac monitoring platform for Triadin Knockout Syndrome",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-[family-name:var(--font-plus-jakarta)] antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
```

**Step 3: Create placeholder page.tsx**

Replace `frontend/app/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-foreground">Guardrail</h1>
      <p className="mt-2 text-muted-foreground">Dashboard coming soon</p>
    </div>
  );
}
```

**Step 4: Verify orange theme renders**

```bash
npm run dev
```

Visit http://localhost:3000 — should show "Guardrail" in dark text on warm-white background.

**Step 5: Commit**

```bash
git add frontend/app/globals.css frontend/app/layout.tsx frontend/app/page.tsx
git commit -m "feat: set up orange+white design system with Plus Jakarta Sans"
```

---

## Task 3: Types + Synthetic Data File

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/data/synthetic.ts`
- Create: `frontend/lib/simulate.ts`

**Step 1: Create type definitions**

```typescript
// frontend/lib/types.ts
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
```

**Step 2: Create simulate.ts (PK math)**

```typescript
// frontend/lib/simulate.ts
export function decayConcentration(
  lastDoseAt: Date,
  tHalfHours: number,
  now: Date = new Date()
): number {
  const elapsedMs = now.getTime() - lastDoseAt.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  if (elapsedHours < 0) return 100;
  const k = Math.LN2 / tHalfHours;
  return Math.max(0, Math.min(100, 100 * Math.exp(-k * elapsedHours)));
}

export function isInTrough(concentrationPct: number): boolean {
  return concentrationPct < 30;
}
```

**Step 3: Create synthetic data file**

This is the central data file. Create `frontend/lib/data/synthetic.ts`. This file contains hardcoded demo data matching the backend's clinical.json and synthetic generator patterns.

```typescript
// frontend/lib/data/synthetic.ts
import type {
  Patient, Diagnosis, Allergy, KnownTrigger, Medication,
  ICDDevice, ICDZone, ICDEpisode, ShockEvent, ECGReading,
  StaticThreshold, HeartRateReading, HRVReading, SleepRecord,
  Episode, WeatherReading, TemperatureReading, Baselines, DrugOption,
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

// ── 7-day Vitals History (generated) ─────────────────────
// Helper: generate 7 days of HR/HRV readings every 5 min

function generateVitalsHistory(): { hr: HeartRateReading[]; hrv: HRVReading[] } {
  const hr: HeartRateReading[] = [];
  const hrv: HRVReading[] = [];
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (let t = start.getTime(); t < now.getTime(); t += 5 * 60 * 1000) {
    const d = new Date(t);
    const hour = d.getHours();
    const isSleep = hour < 7 || hour >= 23;

    // Nadolol trough: doses at 9am and 8pm, trough ~13h after dose
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

  // Episodes cluster in trough windows and after poor sleep
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
```

**Step 4: Verify types compile**

```bash
cd frontend && npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add frontend/lib/
git commit -m "feat: add type definitions, synthetic data, and PK simulation utilities"
```

---

## Task 4: Navigation — TopNav + BottomNav

**Files:**
- Create: `frontend/components/nav/TopNav.tsx`
- Create: `frontend/components/nav/BottomNav.tsx`
- Create: `frontend/hooks/useIsMobile.ts`
- Modify: `frontend/app/layout.tsx` — add nav wrapper

**Step 1: Create useIsMobile hook**

```typescript
// frontend/hooks/useIsMobile.ts
"use client";
import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
```

**Step 2: Create TopNav**

```tsx
// frontend/components/nav/TopNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/" },
  { label: "Medications", href: "/medications" },
  { label: "Episodes", href: "/episodes" },
  { label: "Reports", href: "/reports" },
  { label: "Profile", href: "/profile" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground">Guardrail</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            DA
          </div>
        </div>
      </div>
    </header>
  );
}
```

**Step 3: Create BottomNav**

```tsx
// frontend/components/nav/BottomNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Pill, ListChecks, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: House },
  { label: "Meds", href: "/medications", icon: Pill },
  { label: "Episodes", href: "/episodes", icon: ListChecks },
  { label: "Reports", href: "/reports", icon: FileText },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-white/90 backdrop-blur-lg sm:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 4: Create FeelSomethingFAB**

```tsx
// frontend/components/shared/FeelSomethingFAB.tsx
"use client";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export function FeelSomethingFAB() {
  const handleTap = () => {
    toast.success("Episode captured", {
      description: "24-hour context saved automatically.",
    });
  };

  return (
    <button
      onClick={handleTap}
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-transform hover:scale-105 active:scale-95"
      aria-label="Feel something — capture episode"
    >
      <Heart className="h-6 w-6 animate-pulse-live" fill="currentColor" />
    </button>
  );
}
```

**Step 5: Update layout.tsx to include navigation**

Modify `frontend/app/layout.tsx` — add TopNav, BottomNav, and FAB:

```tsx
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { TopNav } from "@/components/nav/TopNav";
import { BottomNav } from "@/components/nav/BottomNav";
import { FeelSomethingFAB } from "@/components/shared/FeelSomethingFAB";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Guardrail · TKOS Cardiac Monitoring",
  description: "Cardiac monitoring platform for Triadin Knockout Syndrome",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-[family-name:var(--font-plus-jakarta)] antialiased`}>
        <TopNav />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-20 sm:pb-8 pt-6">
          {children}
        </main>
        <BottomNav />
        <FeelSomethingFAB />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
```

**Step 6: Verify navigation renders**

```bash
npm run dev
```

Check desktop: top nav with tabs. Check mobile (resize to <640px): bottom nav with icons. FAB visible on both.

**Step 7: Commit**

```bash
git add frontend/components/nav/ frontend/components/shared/ frontend/hooks/ frontend/app/layout.tsx
git commit -m "feat: add TopNav, BottomNav, FeelSomethingFAB, and shared layout"
```

---

## Task 5: Dashboard — Greeting Hero + Stat Cards

**Files:**
- Create: `frontend/components/dashboard/GreetingHero.tsx`
- Create: `frontend/components/dashboard/StatCard.tsx`
- Modify: `frontend/app/page.tsx`

**Step 1: Create GreetingHero**

```tsx
// frontend/components/dashboard/GreetingHero.tsx
import { PATIENT } from "@/lib/data/synthetic";
import { Badge } from "@/components/ui/badge";

export function GreetingHero() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{dateStr}</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
        Hi, {PATIENT.firstName}.
      </h1>
      <p className="text-base text-muted-foreground">
        Let&apos;s check your heart today.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Badge variant="secondary" className="text-xs">Stable</Badge>
        <Badge variant="secondary" className="text-xs">Medicated</Badge>
        <Badge variant="secondary" className="text-xs">Resting</Badge>
      </div>
    </div>
  );
}
```

**Step 2: Create StatCard**

```tsx
// frontend/components/dashboard/StatCard.tsx
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  subtitle?: string;
  progress?: number; // 0-100
  accentColor?: string; // tailwind text color
}

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  delta,
  deltaDirection,
  subtitle,
  progress,
  accentColor = "text-primary",
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm min-w-[160px] flex-1">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("h-4 w-4", accentColor)} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>

      {delta && (
        <p className={cn(
          "text-xs mt-1",
          deltaDirection === "up" ? "text-red-500" :
          deltaDirection === "down" ? "text-amber-500" :
          "text-muted-foreground"
        )}>
          {deltaDirection === "up" ? "\u25B2" : deltaDirection === "down" ? "\u25BC" : ""} {delta}
        </p>
      )}

      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}

      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progress >= 50 ? "bg-primary" : progress >= 30 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

**Step 3: Update page.tsx with hero + stat cards**

```tsx
// frontend/app/page.tsx
"use client";
import { Heart, Activity, Pill, Moon } from "lucide-react";
import { GreetingHero } from "@/components/dashboard/GreetingHero";
import { StatCard } from "@/components/dashboard/StatCard";
import { BASELINES, MEDICATIONS } from "@/lib/data/synthetic";
import { decayConcentration } from "@/lib/simulate";

export default function DashboardPage() {
  const nadolol = MEDICATIONS.find((m) => m.drugName === "nadolol");
  const now = new Date();

  // Calculate current drug level from last dose
  let drugLevel = 0;
  if (nadolol?.halfLifeHours) {
    const hour = now.getHours();
    const lastDoseHour = hour >= 20 ? 20 : hour >= 9 ? 9 : 20;
    const lastDose = new Date(now);
    lastDose.setHours(lastDoseHour, 0, 0, 0);
    if (lastDose > now) lastDose.setDate(lastDose.getDate() - 1);
    drugLevel = Math.round(decayConcentration(lastDose, nadolol.halfLifeHours));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <GreetingHero />

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        <StatCard
          icon={Heart}
          label="Heart Rate"
          value="74"
          unit="bpm"
          delta={`+${74 - BASELINES.hr.mean} bpm`}
          deltaDirection="neutral"
          accentColor="text-red-500"
        />
        <StatCard
          icon={Activity}
          label="HRV"
          value="42"
          unit="ms"
          delta={`${42 - BASELINES.hrv.mean} ms`}
          deltaDirection="neutral"
          accentColor="text-primary"
        />
        <StatCard
          icon={Pill}
          label="Med Level"
          value={`${drugLevel}`}
          unit="%"
          subtitle={nadolol?.drugName ?? "—"}
          progress={drugLevel}
        />
        <StatCard
          icon={Moon}
          label="Sleep"
          value="7h 10m"
          unit=""
          subtitle="Good"
          accentColor="text-green-500"
        />
      </div>
    </div>
  );
}
```

**Step 4: Verify**

```bash
npm run dev
```

Should see greeting hero with date + badges, then 4 stat cards in a horizontal row.

**Step 5: Commit**

```bash
git add frontend/components/dashboard/ frontend/app/page.tsx
git commit -m "feat: add dashboard greeting hero and stat cards"
```

---

## Task 6: Dashboard — PK Chart

**Files:**
- Create: `frontend/components/dashboard/PKChart.tsx`
- Modify: `frontend/app/page.tsx` — add chart below stat cards

**Step 1: Create PKChart component**

This is the 48-hour drug level + HRV overlay chart using Recharts.

```tsx
// frontend/components/dashboard/PKChart.tsx
"use client";
import { useMemo } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  ReferenceArea,
} from "recharts";
import { MEDICATIONS } from "@/lib/data/synthetic";
import { decayConcentration } from "@/lib/simulate";

interface ChartPoint {
  time: number;
  label: string;
  drugLevel: number;
  hrv: number;
}

export function PKChart() {
  const data = useMemo(() => {
    const now = Date.now();
    const points: ChartPoint[] = [];
    const nadolol = MEDICATIONS.find((m) => m.drugName === "nadolol");
    if (!nadolol?.halfLifeHours) return [];

    // 48h window: -24h to +24h
    const start = now - 24 * 60 * 60 * 1000;
    const end = now + 24 * 60 * 60 * 1000;

    for (let t = start; t <= end; t += 30 * 60 * 1000) {
      const d = new Date(t);
      const hour = d.getHours();

      // Find most recent dose before this time
      // Doses at 9am and 8pm daily
      const doseHours = [9, 20];
      let lastDose = new Date(d);
      let minHours = Infinity;

      for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
        for (const dh of doseHours) {
          const dose = new Date(d);
          dose.setDate(dose.getDate() - dayOffset);
          dose.setHours(dh, 0, 0, 0);
          if (dose <= d) {
            const hoursSince = (d.getTime() - dose.getTime()) / (1000 * 60 * 60);
            if (hoursSince < minHours) {
              minHours = hoursSince;
              lastDose = dose;
            }
          }
        }
      }

      const drugLevel = decayConcentration(lastDose, nadolol.halfLifeHours, d);

      // HRV correlates inversely with drug level decline
      const hrvBase = 44;
      const hrvDelta = drugLevel < 30 ? -14 : drugLevel < 50 ? -6 : 0;
      const hrv = hrvBase + hrvDelta + (Math.sin(t / 3600000) * 3);

      const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

      points.push({
        time: t,
        label: timeLabel,
        drugLevel: Math.round(drugLevel * 10) / 10,
        hrv: Math.round(hrv * 10) / 10,
      });
    }

    return points;
  }, []);

  const nowTime = Date.now();

  // Find trough zones (drugLevel < 30%)
  const troughZones: { start: number; end: number }[] = [];
  let troughStart: number | null = null;
  for (const p of data) {
    if (p.drugLevel < 30 && troughStart === null) {
      troughStart = p.time;
    } else if (p.drugLevel >= 30 && troughStart !== null) {
      troughZones.push({ start: troughStart, end: p.time });
      troughStart = null;
    }
  }
  if (troughStart !== null) {
    troughZones.push({ start: troughStart, end: data[data.length - 1]?.time ?? troughStart });
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          48-Hour Heart & Medication
        </h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> Drug Level
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-6 border-t-2 border-dashed border-neutral-400" /> HRV
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="drugGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" vertical={false} />

          {troughZones.map((zone, i) => (
            <ReferenceArea
              key={i}
              x1={zone.start}
              x2={zone.end}
              fill="hsl(0, 84%, 60%)"
              fillOpacity={0.06}
            />
          ))}

          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t) => {
              const d = new Date(t);
              return d.toLocaleTimeString("en-US", { hour: "numeric" });
            }}
            tick={{ fontSize: 11, fill: "hsl(0, 0%, 55%)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
          />

          <YAxis
            yAxisId="drug"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "hsl(0, 0%, 55%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />

          <YAxis
            yAxisId="hrv"
            orientation="right"
            domain={[0, 80]}
            tick={{ fontSize: 11, fill: "hsl(0, 0%, 55%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}ms`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid hsl(0, 0%, 90%)",
              borderRadius: "12px",
              fontSize: "12px",
              padding: "8px 12px",
            }}
            labelFormatter={(t) => new Date(t).toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
            formatter={(value: number, name: string) => [
              name === "drugLevel" ? `${value}%` : `${value} ms`,
              name === "drugLevel" ? "Drug Level" : "HRV",
            ]}
          />

          <Area
            yAxisId="drug"
            dataKey="drugLevel"
            stroke="hsl(25, 95%, 53%)"
            strokeWidth={2}
            fill="url(#drugGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "hsl(25, 95%, 53%)" }}
          />

          <Line
            yAxisId="hrv"
            dataKey="hrv"
            stroke="hsl(0, 0%, 55%)"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 3, fill: "hsl(0, 0%, 55%)" }}
          />

          <ReferenceLine
            x={nowTime}
            yAxisId="drug"
            stroke="hsl(25, 95%, 53%)"
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{
              value: "NOW",
              position: "top",
              fill: "hsl(25, 95%, 53%)",
              fontSize: 10,
              fontWeight: 600,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 2: Add PKChart to page.tsx**

Add after the stat cards `<div>`:

```tsx
import { PKChart } from "@/components/dashboard/PKChart";

// Inside the return, after the stat cards div:
<PKChart />
```

**Step 3: Verify**

```bash
npm run dev
```

Should see the 48h chart with orange area (drug level), gray dashed (HRV), red trough zones, and a "NOW" marker.

**Step 4: Commit**

```bash
git add frontend/components/dashboard/PKChart.tsx frontend/app/page.tsx
git commit -m "feat: add 48-hour PK/HRV chart to dashboard"
```

---

## Task 7: Dashboard — Recent Episodes + ICD Gap + Active Meds

**Files:**
- Create: `frontend/components/dashboard/RecentEpisodes.tsx`
- Create: `frontend/components/dashboard/ICDGapMonitor.tsx`
- Create: `frontend/components/dashboard/ActiveMeds.tsx`
- Modify: `frontend/app/page.tsx` — add 2-column layout

**Step 1: Create RecentEpisodes**

```tsx
// frontend/components/dashboard/RecentEpisodes.tsx
import Link from "next/link";
import { EPISODES } from "@/lib/data/synthetic";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentEpisodes() {
  const recent = EPISODES.slice(0, 4);

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Recent Episodes
        </h2>
        <Link href="/episodes" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {recent.map((ep) => (
          <div
            key={ep.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border",
              ep.drugLevelPct < 30 ? "border-red-200 bg-red-50/50" :
              ep.drugLevelPct < 50 ? "border-amber-200 bg-amber-50/50" :
              "border-border bg-muted/30"
            )}
          >
            <div className={cn(
              "h-2 w-2 rounded-full flex-shrink-0",
              ep.drugLevelPct < 30 ? "bg-red-500" :
              ep.drugLevelPct < 50 ? "bg-amber-500" :
              "bg-green-500"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{timeAgo(ep.recordedAt)}</p>
              <p className="text-xs text-muted-foreground">
                HR {ep.heartRate} · HRV {ep.hrv} ms
              </p>
            </div>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              ep.drugLevelPct < 30 ? "bg-red-100 text-red-700" :
              ep.drugLevelPct < 50 ? "bg-amber-100 text-amber-700" :
              "bg-green-100 text-green-700"
            )}>
              {ep.drugLevelPct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create ICDGapMonitor**

```tsx
// frontend/components/dashboard/ICDGapMonitor.tsx
import { THRESHOLDS, BASELINES } from "@/lib/data/synthetic";
import { ShieldAlert } from "lucide-react";

export function ICDGapMonitor() {
  const lower = THRESHOLDS.icdGapLowerBpm;
  const upper = THRESHOLDS.icdGapUpperBpm;
  const currentHr = Math.round(BASELINES.hr.mean);
  const pct = ((currentHr - lower) / (upper - lower)) * 100;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          ICD Gap Monitor
        </h2>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {lower} – {upper} bpm blind zone
      </p>

      <div className="relative h-2 w-full rounded-full bg-amber-100 overflow-visible">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary border-2 border-white shadow-sm"
          style={{ left: `${Math.max(0, Math.min(100, pct))}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{lower} bpm</span>
        <span className="text-sm font-semibold text-foreground">{currentHr} bpm</span>
        <span>{upper} bpm</span>
      </div>

      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
        Within paced range
      </p>
    </div>
  );
}
```

**Step 3: Create ActiveMeds**

```tsx
// frontend/components/dashboard/ActiveMeds.tsx
import Link from "next/link";
import { MEDICATIONS } from "@/lib/data/synthetic";
import { decayConcentration } from "@/lib/simulate";
import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActiveMeds() {
  const now = new Date();
  const cardiacMeds = MEDICATIONS.filter((m) => m.isCardiac && m.halfLifeHours);

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Active Medications
        </h2>
        <Link href="/medications" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {cardiacMeds.map((med) => {
          // Find most recent dose time
          const hour = now.getHours();
          const doseHours = med.doseTimes.map((t) => parseInt(t.split(":")[0]));
          let lastDoseHour = doseHours[0];
          for (const dh of doseHours) {
            if (dh <= hour) lastDoseHour = dh;
          }
          const lastDose = new Date(now);
          lastDose.setHours(lastDoseHour, 0, 0, 0);
          if (lastDose > now) lastDose.setDate(lastDose.getDate() - 1);

          const level = Math.round(decayConcentration(lastDose, med.halfLifeHours!, now));

          return (
            <div key={med.id} className="flex items-center gap-3">
              <Pill className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground capitalize">
                    {med.drugName} {med.doseMg}mg
                  </p>
                  <span className={cn(
                    "text-xs font-semibold",
                    level >= 50 ? "text-primary" : level >= 30 ? "text-amber-500" : "text-red-500"
                  )}>
                    {level}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      level >= 50 ? "bg-primary" : level >= 30 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${level}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {med.frequency.replace("_", " ")} · t½ {med.halfLifeHours}h
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 4: Update page.tsx with full dashboard layout**

Rewrite `frontend/app/page.tsx`:

```tsx
// frontend/app/page.tsx
"use client";
import { Heart, Activity, Pill, Moon } from "lucide-react";
import { GreetingHero } from "@/components/dashboard/GreetingHero";
import { StatCard } from "@/components/dashboard/StatCard";
import { PKChart } from "@/components/dashboard/PKChart";
import { RecentEpisodes } from "@/components/dashboard/RecentEpisodes";
import { ICDGapMonitor } from "@/components/dashboard/ICDGapMonitor";
import { ActiveMeds } from "@/components/dashboard/ActiveMeds";
import { BASELINES, MEDICATIONS, SLEEP_HISTORY } from "@/lib/data/synthetic";
import { decayConcentration } from "@/lib/simulate";

export default function DashboardPage() {
  const nadolol = MEDICATIONS.find((m) => m.drugName === "nadolol");
  const now = new Date();

  let drugLevel = 0;
  if (nadolol?.halfLifeHours) {
    const hour = now.getHours();
    const lastDoseHour = hour >= 20 ? 20 : hour >= 9 ? 9 : 20;
    const lastDose = new Date(now);
    lastDose.setHours(lastDoseHour, 0, 0, 0);
    if (lastDose > now) lastDose.setDate(lastDose.getDate() - 1);
    drugLevel = Math.round(decayConcentration(lastDose, nadolol.halfLifeHours));
  }

  const lastSleep = SLEEP_HISTORY[SLEEP_HISTORY.length - 1];
  const sleepHours = Math.floor((lastSleep?.durationMinutes ?? 0) / 60);
  const sleepMins = (lastSleep?.durationMinutes ?? 0) % 60;

  return (
    <div className="space-y-6 animate-fade-in">
      <GreetingHero />

      {/* Stat cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        <StatCard
          icon={Heart}
          label="Heart Rate"
          value={`${BASELINES.hr.mean}`}
          unit="bpm"
          delta={`${BASELINES.hr.mean - 70} from baseline`}
          deltaDirection="neutral"
          accentColor="text-red-500"
        />
        <StatCard
          icon={Activity}
          label="HRV"
          value={`${BASELINES.hrv.mean}`}
          unit="ms"
          delta="Status: Stable"
          deltaDirection="neutral"
          accentColor="text-primary"
        />
        <StatCard
          icon={Pill}
          label="Med Level"
          value={`${drugLevel}`}
          unit="%"
          subtitle={nadolol?.drugName ?? "—"}
          progress={drugLevel}
        />
        <StatCard
          icon={Moon}
          label="Sleep"
          value={`${sleepHours}h ${sleepMins}m`}
          unit=""
          subtitle={lastSleep?.quality ?? "—"}
          accentColor="text-green-500"
        />
      </div>

      {/* Main content: chart left, sidebar right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PKChart />
          <ICDGapMonitor />
        </div>
        <div className="space-y-6">
          <RecentEpisodes />
          <ActiveMeds />
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Verify full dashboard**

```bash
npm run dev
```

Dashboard should show: greeting hero, 4 stat cards, PK chart + ICD gap on left, episodes + meds on right.

**Step 6: Commit**

```bash
git add frontend/components/dashboard/ frontend/app/page.tsx
git commit -m "feat: complete dashboard with episodes, ICD gap monitor, and active meds"
```

---

## Task 8: Medications Page

**Files:**
- Create: `frontend/app/medications/page.tsx`
- Create: `frontend/components/medications/MedCard.tsx`
- Create: `frontend/components/medications/DrugChecker.tsx`

**Step 1: Create MedCard**

```tsx
// frontend/components/medications/MedCard.tsx
import { Pill, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Medication } from "@/lib/types";
import { decayConcentration } from "@/lib/simulate";
import { cn } from "@/lib/utils";

interface MedCardProps {
  medication: Medication;
}

export function MedCard({ medication: med }: MedCardProps) {
  const now = new Date();
  let level = 0;
  let hoursSinceDose = 0;

  if (med.halfLifeHours) {
    const hour = now.getHours();
    const doseHours = med.doseTimes.map((t) => parseInt(t.split(":")[0]));
    let lastDoseHour = doseHours[0];
    for (const dh of doseHours) {
      if (dh <= hour) lastDoseHour = dh;
    }
    const lastDose = new Date(now);
    lastDose.setHours(lastDoseHour, 0, 0, 0);
    if (lastDose > now) lastDose.setDate(lastDose.getDate() - 1);
    level = Math.round(decayConcentration(lastDose, med.halfLifeHours, now));
    hoursSinceDose = Math.round((now.getTime() - lastDose.getTime()) / (1000 * 60 * 60));
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground capitalize">{med.drugName}</h3>
            {med.brandName && (
              <p className="text-xs text-muted-foreground">{med.brandName}</p>
            )}
          </div>
        </div>
        {med.halfLifeHours && (
          <span className={cn(
            "text-2xl font-bold",
            level >= 50 ? "text-primary" : level >= 30 ? "text-amber-500" : "text-red-500"
          )}>
            {level}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Dose</p>
          <p className="font-medium">{med.doseMg} {med.doseUnit}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Frequency</p>
          <p className="font-medium">{med.frequency.replace(/_/g, " ")}</p>
        </div>
        {med.halfLifeHours && (
          <div>
            <p className="text-xs text-muted-foreground">Half-life</p>
            <p className="font-medium">{med.halfLifeHours}h</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Schedule</p>
          <p className="font-medium">{med.doseTimes.join(", ")}</p>
        </div>
      </div>

      {med.halfLifeHours && (
        <div className="mb-4">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                level >= 50 ? "bg-primary" : level >= 30 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${level}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>Last dose: {hoursSinceDose}h ago</span>
            <span>t½ {med.halfLifeHours}h</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {med.qtRisk !== "none" && (
          <Badge variant={med.qtRisk === "high" ? "destructive" : "outline"} className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            QT Risk: {med.qtRisk}
          </Badge>
        )}
        {med.isCardiac && (
          <Badge variant="secondary" className="text-xs">Cardiac</Badge>
        )}
      </div>

      {med.halfLifeHours && (
        <Button variant="outline" size="sm" className="w-full mt-4">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          Took dose
        </Button>
      )}
    </div>
  );
}
```

**Step 2: Create DrugChecker**

```tsx
// frontend/components/medications/DrugChecker.tsx
"use client";
import { useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DRUG_OPTIONS } from "@/lib/data/synthetic";
import { cn } from "@/lib/utils";

export function DrugChecker() {
  const [query, setQuery] = useState("");

  const results = query.length >= 2
    ? DRUG_OPTIONS.filter((d) =>
        d.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Drug Checker
      </h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search medications..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((drug) => (
            <div
              key={drug.name}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border",
                drug.qtRisk === "high" ? "border-red-200 bg-red-50/50" :
                drug.qtRisk === "moderate" ? "border-amber-200 bg-amber-50/50" :
                "border-border"
              )}
            >
              <div>
                <p className="text-sm font-medium">{drug.name}</p>
                <p className="text-xs text-muted-foreground">t½ {drug.tHalfHours}h</p>
              </div>
              <Badge variant={
                drug.qtRisk === "high" ? "destructive" :
                drug.qtRisk === "moderate" ? "outline" :
                "secondary"
              }>
                {drug.qtRisk === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                QT: {drug.qtRisk}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted-foreground mt-3">No medications found.</p>
      )}
    </div>
  );
}
```

**Step 3: Create medications page**

```tsx
// frontend/app/medications/page.tsx
import { MEDICATIONS } from "@/lib/data/synthetic";
import { MedCard } from "@/components/medications/MedCard";
import { DrugChecker } from "@/components/medications/DrugChecker";

export default function MedicationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Medications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Active medications and drug safety checker
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MEDICATIONS.map((med) => (
          <MedCard key={med.id} medication={med} />
        ))}
      </div>

      <DrugChecker />
    </div>
  );
}
```

**Step 4: Verify**

```bash
npm run dev
```

Navigate to /medications — should show medication cards with decay bars and the drug checker.

**Step 5: Commit**

```bash
git add frontend/app/medications/ frontend/components/medications/
git commit -m "feat: add Medications page with drug cards and safety checker"
```

---

## Task 9: Episodes Page

**Files:**
- Create: `frontend/app/episodes/page.tsx`
- Create: `frontend/components/episodes/EpisodeCard.tsx`

**Step 1: Create EpisodeCard**

```tsx
// frontend/components/episodes/EpisodeCard.tsx
import { Heart, Activity, Pill, Clock } from "lucide-react";
import type { Episode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EpisodeCardProps {
  episode: Episode;
}

export function EpisodeCard({ episode: ep }: EpisodeCardProps) {
  const date = new Date(ep.recordedAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });

  const hoursAgo = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  const timeAgo = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;

  return (
    <div className={cn(
      "rounded-2xl bg-card p-5 shadow-sm border-l-4",
      ep.drugLevelPct < 30 ? "border-l-red-500" :
      ep.drugLevelPct < 50 ? "border-l-amber-500" :
      "border-l-green-500"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{dateStr} at {timeStr}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo}
          </p>
        </div>
        <span className={cn(
          "text-lg font-bold px-2.5 py-0.5 rounded-lg",
          ep.drugLevelPct < 30 ? "bg-red-100 text-red-700" :
          ep.drugLevelPct < 50 ? "bg-amber-100 text-amber-700" :
          "bg-green-100 text-green-700"
        )}>
          {ep.drugLevelPct}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">HR</p>
            <p className="font-semibold">{ep.heartRate} bpm</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">HRV</p>
            <p className="font-semibold">{ep.hrv} ms</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Pill className="h-3.5 w-3.5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Drug</p>
            <p className="font-semibold">{ep.drugLevelPct}%</p>
          </div>
        </div>
      </div>

      {ep.notes && (
        <p className="text-xs text-muted-foreground mt-3 italic">{ep.notes}</p>
      )}
    </div>
  );
}
```

**Step 2: Create episodes page**

```tsx
// frontend/app/episodes/page.tsx
import { EPISODES } from "@/lib/data/synthetic";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";

export default function EpisodesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Episodes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {EPISODES.length} episodes captured · Sorted by most recent
        </p>
      </div>

      <div className="space-y-4">
        {EPISODES.map((ep) => (
          <EpisodeCard key={ep.id} episode={ep} />
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Verify**

```bash
npm run dev
```

Navigate to /episodes — should show color-coded episode cards.

**Step 4: Commit**

```bash
git add frontend/app/episodes/ frontend/components/episodes/
git commit -m "feat: add Episodes page with severity-coded episode cards"
```

---

## Task 10: Reports Page

**Files:**
- Create: `frontend/app/reports/page.tsx`
- Create: `frontend/components/reports/ReportBuilder.tsx`

**Step 1: Create ReportBuilder**

```tsx
// frontend/components/reports/ReportBuilder.tsx
"use client";
import { useState } from "react";
import { FileText, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SPECIALISTS = [
  { id: "cardiology", label: "Cardiology", available: true },
  { id: "neurology", label: "Neurology", available: false },
  { id: "genetics", label: "Genetics", available: false },
  { id: "pediatrics", label: "Pediatrics", available: false },
];

const SECTIONS = [
  { id: "executive", label: "Executive Summary", locked: true },
  { id: "episodes", label: "Episode Library" },
  { id: "pk", label: "Pharmacokinetic Analysis" },
  { id: "autonomic", label: "Autonomic Trends" },
  { id: "triggers", label: "Trigger Analysis" },
  { id: "context", label: "Supporting Context" },
];

const DATE_RANGES = [
  { label: "4 weeks", value: "4w" },
  { label: "3 months", value: "3m" },
  { label: "6 months", value: "6m" },
];

export function ReportBuilder() {
  const [specialist, setSpecialist] = useState("cardiology");
  const [dateRange, setDateRange] = useState("4w");
  const [selectedSections, setSelectedSections] = useState(
    new Set(SECTIONS.map((s) => s.id))
  );

  const toggleSection = (id: string) => {
    const section = SECTIONS.find((s) => s.id === id);
    if (section?.locked) return;
    const next = new Set(selectedSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSections(next);
  };

  return (
    <div className="space-y-6">
      {/* Specialist selector */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Specialist
        </h2>
        <div className="flex flex-wrap gap-2">
          {SPECIALISTS.map((s) => (
            <button
              key={s.id}
              onClick={() => s.available && setSpecialist(s.id)}
              disabled={!s.available}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                s.id === specialist
                  ? "bg-primary text-white"
                  : s.available
                  ? "bg-muted text-foreground hover:bg-muted/80"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed"
              )}
            >
              {s.label}
              {!s.available && <span className="text-xs ml-1">(Coming soon)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Date Range
        </h2>
        <div className="flex gap-2">
          {DATE_RANGES.map((dr) => (
            <button
              key={dr.value}
              onClick={() => setDateRange(dr.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                dateRange === dr.value
                  ? "bg-primary text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              {dr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Report Sections
        </h2>
        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSection(s.id)}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl text-left transition-colors",
                selectedSections.has(s.id)
                  ? "bg-primary/10 text-foreground"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <div className={cn(
                "h-4 w-4 rounded border flex items-center justify-center",
                selectedSections.has(s.id)
                  ? "bg-primary border-primary"
                  : "border-border"
              )}>
                {selectedSections.has(s.id) && (
                  <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">{s.label}</span>
              {s.locked && <Lock className="h-3 w-3 text-muted-foreground ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <Button size="lg" className="w-full rounded-xl h-12 text-base">
        <FileText className="h-5 w-5 mr-2" />
        Generate Report
      </Button>
    </div>
  );
}
```

**Step 2: Create reports page**

```tsx
// frontend/app/reports/page.tsx
import { ReportBuilder } from "@/components/reports/ReportBuilder";

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate structured PDF reports for your care team
        </p>
      </div>

      <ReportBuilder />
    </div>
  );
}
```

**Step 3: Verify**

```bash
npm run dev
```

Navigate to /reports — should show specialist, date range, and section selectors.

**Step 4: Commit**

```bash
git add frontend/app/reports/ frontend/components/reports/
git commit -m "feat: add Reports page with specialist, date range, and section builder"
```

---

## Task 11: Profile Page

**Files:**
- Create: `frontend/app/profile/page.tsx`
- Create: `frontend/components/profile/PatientInfo.tsx`
- Create: `frontend/components/profile/ICDDetails.tsx`
- Create: `frontend/components/profile/ECGTable.tsx`
- Create: `frontend/components/profile/TriggersCard.tsx`

**Step 1: Create PatientInfo**

```tsx
// frontend/components/profile/PatientInfo.tsx
import { PATIENT, DIAGNOSES, ALLERGIES } from "@/lib/data/synthetic";
import { User, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PatientInfo() {
  const age = Math.floor(
    (Date.now() - new Date(PATIENT.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      {/* Demographics */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {PATIENT.firstName} {PATIENT.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {age} y/o · {PATIENT.sex} · {PATIENT.heightCm} cm · {PATIENT.weightKg} kg · BMI {PATIENT.bmi}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Primary Diagnosis</p>
            <p className="font-medium">{PATIENT.primaryDiagnosis}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Diagnosis Date</p>
            <p className="font-medium">{PATIENT.diagnosisDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Myopathy</p>
            <p className="font-medium">{PATIENT.hasMyopathy ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sick Sinus</p>
            <p className="font-medium">{PATIENT.hasSickSinus ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>

      {/* Diagnoses */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Diagnoses
        </h3>
        <div className="space-y-2">
          {DIAGNOSES.map((d, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{d.diagnosis}</p>
                {d.notedDate && <p className="text-xs text-muted-foreground">{d.notedDate}</p>}
                {d.notes && <p className="text-xs text-muted-foreground italic">{d.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Allergies
        </h3>
        {ALLERGIES.map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">{a.allergen}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create ICDDetails**

```tsx
// frontend/components/profile/ICDDetails.tsx
import { ICD_DEVICE, ICD_ZONES, ICD_EPISODES, SHOCK_HISTORY } from "@/lib/data/synthetic";
import { Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ICDDetails() {
  return (
    <div className="space-y-6">
      {/* Device Info */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            ICD Device
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Manufacturer</p><p className="font-medium">{ICD_DEVICE.manufacturer}</p></div>
          <div><p className="text-xs text-muted-foreground">Model</p><p className="font-medium">{ICD_DEVICE.model}</p></div>
          <div><p className="text-xs text-muted-foreground">Implant Date</p><p className="font-medium">{ICD_DEVICE.implantDate}</p></div>
          <div><p className="text-xs text-muted-foreground">Pacing Mode</p><p className="font-medium">{ICD_DEVICE.pacingMode}</p></div>
          <div><p className="text-xs text-muted-foreground">Lower Rate</p><p className="font-medium">{ICD_DEVICE.lowerRateLimitBpm} bpm</p></div>
          <div><p className="text-xs text-muted-foreground">Battery</p><p className="font-medium">{ICD_DEVICE.batteryStatus} ({ICD_DEVICE.batteryLifeYears}y)</p></div>
          <div><p className="text-xs text-muted-foreground">Atrial Pacing</p><p className="font-medium">{ICD_DEVICE.atrialPacingPct}%</p></div>
          <div><p className="text-xs text-muted-foreground">Last Interrogation</p><p className="font-medium">{ICD_DEVICE.lastInterrogationDate}</p></div>
        </div>
      </div>

      {/* Zones */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Programmed Zones
        </h3>
        <div className="space-y-3">
          {ICD_ZONES.map((zone) => (
            <div key={zone.zoneName} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-semibold">{zone.zoneName}</p>
                <p className="text-xs text-muted-foreground">{zone.notes}</p>
              </div>
              <Badge variant="outline">{zone.rateCutoffBpm} bpm</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Shock History */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Shock History
          </h3>
        </div>
        <div className="space-y-3">
          {SHOCK_HISTORY.map((s, i) => (
            <div key={i} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{s.eventDate}</p>
                <Badge variant="outline" className="text-xs">{s.eventType}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.context}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create ECGTable**

```tsx
// frontend/components/profile/ECGTable.tsx
import { ECG_READINGS } from "@/lib/data/synthetic";
import { cn } from "@/lib/utils";

export function ECGTable() {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm overflow-x-auto">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        ECG History ({ECG_READINGS.length} readings)
      </h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground uppercase tracking-wide">
            <th className="text-left pb-3 pr-4">Date</th>
            <th className="text-right pb-3 px-2">HR</th>
            <th className="text-right pb-3 px-2">PR</th>
            <th className="text-right pb-3 px-2">QRS</th>
            <th className="text-right pb-3 px-2">QT</th>
            <th className="text-right pb-3 px-2">QTc</th>
            <th className="text-left pb-3 pl-4">Notes</th>
          </tr>
        </thead>
        <tbody>
          {ECG_READINGS.map((ecg) => (
            <tr
              key={ecg.readingDate}
              className={cn(
                "border-t border-border/50",
                ecg.isAnomalous && "bg-red-50"
              )}
            >
              <td className="py-2.5 pr-4 font-medium">{ecg.readingDate}</td>
              <td className="py-2.5 px-2 text-right">{ecg.hrBpm}</td>
              <td className="py-2.5 px-2 text-right">{ecg.prMs}</td>
              <td className={cn("py-2.5 px-2 text-right", ecg.qrsMs > 100 && "text-red-600 font-semibold")}>{ecg.qrsMs}</td>
              <td className="py-2.5 px-2 text-right">{ecg.qtMs}</td>
              <td className={cn("py-2.5 px-2 text-right", ecg.qtcMs > 500 && "text-red-600 font-semibold")}>{ecg.qtcMs}</td>
              <td className="py-2.5 pl-4 text-xs text-muted-foreground max-w-[200px] truncate">{ecg.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 4: Create TriggersCard**

```tsx
// frontend/components/profile/TriggersCard.tsx
import { TRIGGERS } from "@/lib/data/synthetic";
import { Badge } from "@/components/ui/badge";

export function TriggersCard() {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Known Triggers
      </h3>
      <div className="space-y-3">
        {TRIGGERS.map((t, i) => (
          <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium">{t.triggerType}</p>
              <p className="text-xs text-muted-foreground">{t.notes}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Source: {t.source}</p>
            </div>
            <Badge variant={
              t.confidence === "documented" ? "default" :
              t.confidence === "patient_reported" ? "secondary" :
              "outline"
            } className="text-xs flex-shrink-0 ml-3">
              {t.confidence.replace("_", " ")}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 5: Create profile page**

```tsx
// frontend/app/profile/page.tsx
import { PatientInfo } from "@/components/profile/PatientInfo";
import { ICDDetails } from "@/components/profile/ICDDetails";
import { ECGTable } from "@/components/profile/ECGTable";
import { TriggersCard } from "@/components/profile/TriggersCard";
import { THRESHOLDS } from "@/lib/data/synthetic";

export default function ProfilePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patient Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clinical foundation data from medical records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientInfo />
        <div className="space-y-6">
          <ICDDetails />
          <TriggersCard />
        </div>
      </div>

      <ECGTable />

      {/* Static Thresholds */}
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          Clinical Thresholds
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Set by {THRESHOLDS.clinician} on {THRESHOLDS.effectiveDate}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Resting HR</p><p className="font-semibold">{THRESHOLDS.restingHrBpm} bpm</p></div>
          <div><p className="text-xs text-muted-foreground">QRS Baseline</p><p className="font-semibold">{THRESHOLDS.qrsBaselineMs} ms</p></div>
          <div><p className="text-xs text-muted-foreground">QTc Baseline</p><p className="font-semibold">{THRESHOLDS.qtcBaselineMs} ms</p></div>
          <div><p className="text-xs text-muted-foreground">QTc Upper Limit</p><p className="font-semibold">{THRESHOLDS.qtcUpperLimitMs} ms</p></div>
          <div><p className="text-xs text-muted-foreground">ICD Gap</p><p className="font-semibold">{THRESHOLDS.icdGapLowerBpm}–{THRESHOLDS.icdGapUpperBpm} bpm</p></div>
          <div><p className="text-xs text-muted-foreground">QRS Alert</p><p className="font-semibold">{THRESHOLDS.qrsAbsoluteAlertMs} ms</p></div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">{THRESHOLDS.notes}</p>
      </div>
    </div>
  );
}
```

**Step 6: Verify**

```bash
npm run dev
```

Navigate to /profile — should show patient info, diagnoses, ICD details, ECG table, triggers, and thresholds.

**Step 7: Commit**

```bash
git add frontend/app/profile/ frontend/components/profile/
git commit -m "feat: add Profile page with patient info, ICD, ECG history, and triggers"
```

---

## Task 12: Final Verification + Build Check

**Step 1: Run the full build**

```bash
cd frontend && npm run build
```

Fix any TypeScript or build errors.

**Step 2: Run lint**

```bash
npm run lint
```

Fix any lint errors.

**Step 3: Manual smoke test**

```bash
npm run dev
```

Navigate through all 5 pages:
- `/` — Dashboard with greeting, stat cards, PK chart, episodes, ICD gap, meds
- `/medications` — Med cards + drug checker
- `/episodes` — Episode cards with severity colors
- `/reports` — Report builder with specialist/date/sections
- `/profile` — Patient info, ICD, ECG, triggers, thresholds

Verify:
- Top nav highlights active page
- Bottom nav visible on mobile (<640px)
- Feel Something FAB visible everywhere
- Orange+white theme throughout
- Cards have rounded-2xl, shadow-sm
- Good spacing between elements

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Guardrail frontend with 5-page orange+white dashboard"
```

# Frontend Design — Knockout Cardiac Monitoring Dashboard

**Date:** 2026-03-01
**Approach:** Clean Slate Rebuild with orange + white design system
**Data:** Synthetic demo data in local file (no backend wiring this phase)

---

## Design System

### Color Palette

| Role            | Value              | Tailwind         | Usage                                      |
|-----------------|--------------------|------------------|---------------------------------------------|
| Primary         | `#F97316`          | orange-500       | Buttons, active tabs, chart accents, icons  |
| Primary Light   | `#FFF7ED`          | orange-50        | Card hover, badge backgrounds, highlights   |
| Primary Medium  | `#FDBA74`          | orange-300       | Progress bars, secondary accents            |
| Background      | `#FAFAFA`          | neutral-50       | Page background                             |
| Surface         | `#FFFFFF`          | white            | Cards, panels, nav bar                      |
| Text Primary    | `#171717`          | neutral-900      | Headings, big metric numbers                |
| Text Secondary  | `#737373`          | neutral-500      | Labels, subtitles                           |
| Text Muted      | `#A3A3A3`          | neutral-400      | Timestamps, meta info                       |
| Danger          | `#EF4444`          | red-500          | Trough warnings, Feel Something button      |
| Success         | `#22C55E`          | green-500        | Healthy status, good sleep                  |
| Warning         | `#F59E0B`          | amber-500        | Caution states, moderate drug levels        |

### Typography

- **Font:** Plus Jakarta Sans (already installed)
- Hero greeting: 28px semibold
- Big metric numbers: 36px bold
- Card titles: 14px medium, text-secondary
- Card labels: 12px regular, text-muted

### Card Style

- White background, `rounded-2xl`, `shadow-sm`
- 24px internal padding
- 16px gap between cards
- No borders — shadow defines edges

### Status Badges

- Rounded pill, orange-50 background, orange-500 text
- Used for: "Stable", "Medicated", "Resting"

---

## Page Structure (Next.js App Router)

| Route           | Page            | Purpose                                          |
|-----------------|-----------------|--------------------------------------------------|
| `/`             | Dashboard       | Greeting, stat cards, PK chart, episodes, meds   |
| `/medications`  | Medications     | Full med list, drug checker, dose logging         |
| `/episodes`     | Episodes        | Episode history, timeline, 24h context views      |
| `/reports`      | Reports         | PDF report generation, specialist/date selection  |
| `/profile`      | Profile         | Patient info, ICD, ECG history, triggers          |

### Shared Elements (all pages)

- **Desktop:** Horizontal top nav (logo left, tabs center, patient badge right)
- **Mobile:** Bottom nav with 4-5 icons + center FAB
- **Feel Something FAB:** Floating red button, always visible, always accessible

---

## Dashboard Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🛡 Knockout     Dashboard  Medications  Episodes  Reports  DA │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sunday, March 1, 2026                                          │
│  Hi, Dishita.                                                   │
│  Let's check your heart today.                                  │
│  [Stable]  [Medicated]  [Resting]                               │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ HR       │ │ HRV      │ │ Med Lvl  │ │ Sleep    │           │
│  │ 78 bpm   │ │ 44 ms    │ │ 72%      │ │ 7h 20m   │           │
│  │ +2 bpm   │ │ -3 ms    │ │ Nadolol  │ │ Good     │           │
│  │ ~spark~  │ │ ~spark~  │ │ ▓▓▓▓░░   │ │ ▓▓▓▓▓░   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ┌─────────────────────────────────┐ ┌─────────────────────┐    │
│  │  48-Hour Heart & Medication     │ │  Recent Episodes    │    │
│  │  [Orange area: drug level]      │ │  ● 2h ago  29%     │    │
│  │  [Gray dashed: HRV]            │ │  ● 8h ago  68%     │    │
│  │  [Red zones: trough]           │ │  ● 14h ago 45%     │    │
│  │  [Pulsing dot: NOW]            │ │  → View all         │    │
│  └─────────────────────────────────┘ ├─────────────────────┤    │
│                                      │  Active Meds        │    │
│  ┌─────────────────────────────────┐ │  Nadolol 40mg 72%  │    │
│  │  ICD Gap Monitor               │ │  Flecainide 50mg   │    │
│  │  70-190 bpm blind zone         │ │  45%               │    │
│  │  [───●──────────] 78 bpm       │ │  [+ Add med]       │    │
│  │  Within paced range ✓          │ │                     │    │
│  └─────────────────────────────────┘ └─────────────────────┘    │
│                                                   [🔴 Feel      │
│                                                    Something]   │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Components

- **GreetingHero:** Date, personalized greeting, status badges
- **StatCard (×4):** Icon, label, big number, delta from baseline, mini sparkline/progress bar
- **PKChart:** 48h dual-axis Recharts ComposedChart — orange area (drug level), gray dashed (HRV), red-50 trough zones, pulsing "NOW" dot, dose markers, episode markers
- **RecentEpisodes:** Last 3-5 episodes, color-coded by drug level (red <30%, amber 30-50%, green >50%)
- **ICDGapMonitor:** Horizontal range bar (70-190 bpm) with current HR dot, status label
- **ActiveMeds:** Vertical list with progress bars, decay %, dose timing

---

## Secondary Pages

### Medications (`/medications`)

- Full medication cards with: name, dose, frequency, t½, QT risk, current level %, progress bar, last/next dose
- "Took dose" button per medication
- Drug Checker section: search input, results with t½ and QT risk badges
- Add medication modal (search, dose, frequency)

### Episodes (`/episodes`)

- Full episode history list, filterable by date range (7d, 30d, custom)
- Episode cards: timestamp, HR, HRV, drug level %, severity color
- Expandable 24h context: HR/HRV/temp mini charts, sleep quality, weather, compound factors
- "View 24h context" link per episode

### Reports (`/reports`)

- Specialist selector: Cardiology (active), Neurology/Genetics/Pediatrics (disabled)
- Date range: 4 weeks, 3 months, custom
- Section toggles: Executive Summary, Episode Library, PK Analysis, Autonomic Trends, Trigger Analysis, Supporting Context
- Generate button → PDF preview + download

### Profile (`/profile`)

- Patient demographics card (name, DOB, sex, height, weight, primary diagnosis, gene variant)
- Diagnoses list
- Allergies list
- ICD device info (manufacturer, model, pacing mode, zones, battery)
- ICD episode history table
- Shock history timeline
- ECG readings table (14 historical: date, HR, QTc, findings)
- Known triggers with source and confidence
- Static thresholds from clinician

---

## Component File Structure

```
frontend/
├── app/
│   ├── layout.tsx                 ← Root: font, TopNav/BottomNav, FAB
│   ├── page.tsx                   ← Dashboard
│   ├── medications/page.tsx
│   ├── episodes/page.tsx
│   ├── reports/page.tsx
│   ├── profile/page.tsx
│   └── globals.css                ← Orange theme tokens
├── components/
│   ├── nav/
│   │   ├── TopNav.tsx
│   │   └── BottomNav.tsx
│   ├── dashboard/
│   │   ├── GreetingHero.tsx
│   │   ├── StatCard.tsx
│   │   ├── PKChart.tsx
│   │   ├── ICDGapMonitor.tsx
│   │   ├── RecentEpisodes.tsx
│   │   └── ActiveMeds.tsx
│   ├── medications/
│   │   ├── MedCard.tsx
│   │   ├── DrugChecker.tsx
│   │   └── AddMedModal.tsx
│   ├── episodes/
│   │   ├── EpisodeCard.tsx
│   │   └── EpisodeContext.tsx
│   ├── reports/
│   │   └── ReportBuilder.tsx
│   ├── profile/
│   │   ├── PatientInfo.tsx
│   │   ├── ICDDetails.tsx
│   │   ├── ECGTable.tsx
│   │   └── TriggersCard.tsx
│   ├── shared/
│   │   └── FeelSomethingFAB.tsx
│   └── ui/                        ← Existing shadcn/ui primitives
├── lib/
│   ├── data/
│   │   └── synthetic.ts           ← All demo data
│   ├── types.ts
│   ├── drugs.ts
│   ├── simulate.ts
│   └── utils.ts
└── hooks/
    ├── useVitals.ts
    └── usePKData.ts
```

---

## Data Layer

### Synthetic Data File (`lib/data/synthetic.ts`)

Single file exporting all demo data as typed constants:

- `PATIENT` — demographics, diagnoses, allergies
- `VITALS_HISTORY` — 7 days of HR/HRV readings (from synthetic generator shapes)
- `EPISODES` — 5-8 demo episodes with varied severity
- `MEDICATIONS` — Nadolol + Flecainide with dose times and PK params
- `BASELINES` — 7-day rolling averages (HR, HRV, sleep, temp, weather)
- `ECG_READINGS` — 14 historical readings
- `ICD_DATA` — device, zones, episodes, shock history, gap boundaries
- `TRIGGERS` — known triggers with confidence
- `THRESHOLDS` — clinician-set static thresholds
- `SLEEP_DATA` — recent sleep records
- `WEATHER_DATA` — recent weather readings

### Hooks

- `useVitals` — reads from VITALS_HISTORY, simulates real-time tick with latest values
- `usePKData` — computes 48h chart data from MEDICATIONS using exponential decay math

---

## Mobile Behavior

- **Breakpoint:** 640px (Tailwind `sm`)
- **Desktop:** Top horizontal nav, 2-column dashboard grid
- **Mobile:** Bottom icon nav, single-column stacked layout, horizontal scroll for stat cards
- **Feel Something FAB:** Fixed position above bottom nav on mobile, bottom-right corner on desktop
- **Charts:** Horizontally scrollable on mobile (touch drag)

---

## What's Reused From Current Codebase

- `components/ui/*` — all shadcn/ui primitives (badge, button, card, dialog, etc.)
- `lib/utils.ts` — `cn()` helper
- `lib/drugs.ts` — drug options list
- `lib/simulate.ts` — PK decay math
- `lib/types.ts` — base types (extended with new ones)
- `hooks/useVitals.ts` — adapted to use synthetic data
- `hooks/usePKData.ts` — adapted for orange theme chart
- `hooks/useIsMobile.ts` — breakpoint detection

## What's New

- Orange + white design system (globals.css rewrite)
- 5-page routing structure
- TopNav, BottomNav components
- GreetingHero, StatCard, ICDGapMonitor components
- Profile page components (PatientInfo, ICDDetails, ECGTable, TriggersCard)
- Episode context expansion view
- Synthetic data file
- FeelSomethingFAB (redesigned, always visible)

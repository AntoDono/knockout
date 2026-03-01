# Track 3: Symptom Management

## 3.1 General Track Challenge

For many rare conditions, the biggest day-to-day burden isn't the diagnosis — it's living with symptoms that fluctuate, flare, and affect school, work, sleep, nutrition, mobility, pain, and mental health. Care is often fragmented across specialists, and caregivers do invisible coordination work.

This track is about engineering practical tools that improve daily function for patients/caregivers across:

- **Flare weeks:** triage, symptom tracking, contingency plans, medication/therapy adjustments, school/work accommodations.
- **Long-term management:** habit supports, appointment coordination, adherence, accessible education, and caregiver load reduction.

### What Makes a Strong Project

Strong projects will:

- **Be usable** — low cognitive load, accessible language, multilingual-aware, offline/low-bandwidth if possible.
- **Offer actionable outputs** — graphs, checklists, summaries, prompts, and "what to do next."
- **Respect safety** — not giving medical advice beyond scope; clear escalation guidance; guardrails in place.
- **Demonstrate impact** — with usability testing, pilot feedback, or measurable proxy outcomes (time saved, adherence, symptom reporting completeness, reduced crisis events — depending on scope).

---

### Project Idea 1: Flare-Week Planner

Families often struggle most during flare weeks: deciding what to track, how to adjust routines, and how to communicate changes quickly to clinicians. Build a "flare mode" tool that reduces chaos and improves communication without practicing medicine.

#### Inputs

- Baseline function profile (sleep, mobility, pain, feeding, behavior, etc.)
- Daily quick check-ins (severity sliders + a few yes/no red flags)

#### Outputs

- Daily plan/checklist (hydration, rest, symptom log prompts, appointment prep)
- "Clinician message" summary: what changed from baseline, timeline, key metrics, and questions to ask
- Conservative escalation guidance templates ("consider contacting… if…")

#### Validation

- **Scenario testing:** run 3 scripted flare scenarios; verify summaries capture key changes and avoid unsafe advice.
- **Measure** time saved creating a clinician update vs. manual.

---

### Project Idea 2: One-Page Emergency / New Specialist Brief Generator

Rare disease patients often see new clinicians or visit the ER where context is missing. A concise, structured brief can prevent errors, reduce repeated testing, and improve safety.

#### Inputs

- Diagnosis (or "undiagnosed"), baseline status, typical flare signs
- Meds/allergies, devices, key prior tests, care plan notes
- Care team contacts + preferred hospital/clinic

#### Outputs

- A printable one-page brief + wallet card format
- A structured "must know" section (e.g., contraindications, communication needs)
- Exportable version for patient portals or caregivers

#### Validation

- **Completeness checklist:** does it include high-safety items (allergies, meds, contraindications, baseline)?
- **Compare** against a "before" free-text summary: fewer missing critical fields.

---

## 3.2 Narrow Challenge: Symptom-to-Signal Translation for Rare Disease Care

Many rare diseases involve symptoms that are severe and fluctuating, yet difficult to "see" in routine care. Patients and caregivers can describe the burden clearly, but clinical visits often lack a consistent way to summarize trajectory, severity, triggers, and functional impact over time. This creates a gap between lived experience and what clinicians can reliably interpret and use in decision-making.

This challenge is about building a **symptom-to-signal layer**: tools that convert patient-reported symptom experience into structured, longitudinal, clinician-usable signals (not just a narrative summary) to improve recognition, communication, and quality-of-life-oriented management.

> **Core question:** How might we translate patient-reported symptoms into structured, clinician-usable signals that support better day-to-day rare disease care?

This challenge does not seek to build diagnostic devices or medical treatments. It focuses on structuring symptoms for interpretation and care planning.

### What Makes a Strong Project

Strong projects will:

- **Produce structured signals, not just summaries** — represent baseline vs. flare changes, timelines, variability, triggers, and functional impact in a consistent format.
- **Be interpretable for clinical use** — show what drove each signal (evidence, uncertainty, missingness) and make outputs usable within a short visit workflow.
- **Be safe by design** — clear scope limits, guardrails, and escalation guidance; no medical advice beyond scope.
- **Prove value with an evaluation plan** — include case replays, clinician review, usability testing, and/or measurable proxies (reporting completeness, time saved, earlier recognition of deterioration, reduced avoidable escalation — depending on scope).

The goal is to engineer tools that make lived experience visible, structured, and actionable — so that daily rare disease management becomes more understandable, coordinated, and humane.

> *This problem statement was provided by the Spanish Association for Empty Nose Syndrome (AESNV).*

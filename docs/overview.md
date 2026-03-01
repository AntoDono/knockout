# Guardrail — Project Overview

## What We're Building (One Sentence)

A system that passively watches everything happening in a TKOS patient's body and environment, lets them flag moments with one tap, learns their personal pre-episode pattern over time, and hands their doctor a report that makes the invisible visible.

---

## The Disease

Triadin Knockout Syndrome (TKOS) is an ultra-rare inherited heart condition. About 340 people on earth have it. The triadin protein, which helps regulate calcium flow in heart muscle cells, is completely absent. Without it, the heart's electrical signaling misfires, causing life-threatening arrhythmias.

Key facts:

- 95% of patients experience cardiac arrest or fainting by age 3
- 74% have recurrent breakthrough cardiac events even on aggressive treatment
- The most common medications (nadolol, flecainide) help but don't fully control it
- 68% have implantable cardioverter-defibrillators (ICDs) — shock devices in their chest
- About 29% also have skeletal muscle weakness on top of the heart problems
- Most patients are children

There are no clinical practice guidelines. Each doctor is essentially improvising. The international TKOS registry at Mayo Clinic, with data on a few dozen patients, is the sum total of published clinical knowledge.

---

## The Three Blind Spots We're Filling

### 1. The ICD Gap

Her ICD (the defibrillator implanted in her chest) is deliberately programmed to ignore some arrhythmias. This sounds wrong, but there's a reason: in TKOS and related conditions, the pain from an ICD shock triggers a catecholamine (adrenaline) surge, which can cause more arrhythmia, which triggers another shock — a deadly feedback loop called arrhythmia storm.

So clinicians set the ICD to only respond to the most dangerous rhythms. Arrhythmias that are too short, too slow, or too variable to cross the ICD's thresholds go undetected and unlogged. These subclinical events are invisible, but they matter — they indicate how well medication is working, what triggers episodes, and whether the disease is progressing.

### 2. The Visit Gap

Between quarterly cardiologist visits, roughly 2,160 waking hours pass with no clinical observation. If she feels something — palpitations, dizziness, fatigue — she might mention it from memory 6 weeks later. The detail is gone. The context is gone.

### 3. The "Why" Gap

Even when events are documented, nobody systematically asks: was she at the lowest point of her medication level? Was it 95 degrees outside? Did she sleep poorly last night? Was it all three at once? Individual factors get noted sometimes. The combination — which is what actually matters — is never captured.

---

## How Guardrail Works

### Layer 1: Clinical Foundation (One-Time Onboarding)

**What it does:** Before collecting a single new data point, the system loads everything already known about this specific patient.

**Why it matters:** With 340 patients worldwide, generic medical thresholds are useless. Her normal resting heart rate, her personal ectopy onset rate, her ICD shock history, her specific triggers — all of this already exists in scattered medical records and doctor's notes. This layer pulls it together into a single personalized profile that replaces every default in the system.

**What goes in:**
- Medical records — her actual heart rate thresholds from stress tests, not textbook numbers
- ICD interrogation reports — every shock and logged event with timestamps
- Medication history — exact drugs, doses, and timing
- Clinical notes — a language model reads through doctor's notes to extract things like "episodes tend to occur during hot weather" or "child reported feeling heavy before the event"

**What comes out:** A personalized clinical profile. Her thresholds. Her event timeline. Her medication list. Her documented triggers. This is the foundation everything else builds on.

---

### Layer 2: Passive Data Engine (Continuous, Zero Effort)

**What it does:** Six streams of data run continuously without the patient doing anything beyond wearing an Apple Watch and carrying a phone.

**Why it matters:** The system needs to see what's happening in her body and environment at all times — not just during a crisis. And it can't add burden. A sick child can't fill out daily symptom forms. Passive collection means the data is always there when she needs it.

**The six streams:**

1. **Heart rate variability (HRV)** — a measure of the variation between heartbeats. When HRV drops, it means the autonomic nervous system is under stress. The system compares against her personal rolling 7-day average, not population norms.

2. **Heart rate** — continuous, but only flagged when it deviates from her personal baseline. A heart rate of 110 means nothing in isolation. It matters whether she's running or sitting still.

3. **Sleep** — duration and quality compared to her personal baseline. Sleep deprivation depresses HRV, increases sympathetic nervous system activity, and independently raises arrhythmia risk.

4. **Wrist temperature** — from Apple Watch. Detects fever, which increases resting heart rate by roughly 10 bpm per degree Fahrenheit and is an independent arrhythmia trigger.

5. **Weather** — ambient temperature and humidity at her location, checked every 30 minutes. Heat increases cardiac workload and is a documented trigger in channelopathy patients.

6. **Medication timing** — a single daily tap to confirm she took her dose. This is the only active input required.

**The critical principle:** Everything is compared against her personal rolling baseline, not population averages. If her normal HRV is 35ms and it drops to 20ms, that's significant for her — even if 20ms is textbook "normal" for someone else.

---

### Layer 3: Pharmacokinetic Model (The Medication Curve)

**What it does:** Models the real-time blood level of each cardiac medication throughout the day.

**Why it matters:** This is the most novel part of the system. Nadolol (her primary beta-blocker) has a half-life of 20-24 hours. That means if she takes it at 8am, by the next morning she's at roughly 50% coverage — the trough. Flecainide has an even shorter half-life (12-27 hours), meaning coverage can dip significantly between doses.

The system models this as a continuous curve: after she logs her dose, it calculates where her drug level is at every point in the day — peak coverage, declining coverage, trough window.

**The key question this layer answers:** Do her tapped episodes cluster during medication trough windows? If she consistently feels something 18-20 hours after her dose when drug coverage is at its lowest, that's actionable clinical information. Her cardiologist might adjust timing, split the dose, or change medications. Right now, that pattern is completely invisible.

The system overlays the medication curve against HRV on a single timeline, making the relationship between drug level and autonomic stability visible for the first time.

---

### Layer 4: One-Tap Capture

**What it does:** A single button, always accessible on the watch or phone. When she feels something — palpitations, dizziness, "something's off" — she taps once.

**Why it matters:** During an episode, she can't fill out a form. She might be scared, dizzy, or a child who can't articulate what's happening. One gesture is the maximum cognitive load you can ask for.

**What happens on tap:**
- Timestamp recorded
- Last 24 hours of all six passive streams automatically captured
- Current medication coverage percentage logged
- Entry added to her personal episode library

No typing. No form. No description needed. The context is captured automatically from the passive streams. Over time, these taps become labeled data points that power the learning model.

---

### Layer 5: Pattern Learning via Bayesian Model (Future Vision)

*This layer is part of the long-term vision. We describe the architecture at the hackathon but do not implement it.*

**What it would do:** A Bayesian learning model that learns her personal pre-episode pattern over time by analyzing what the passive streams looked like before each tap.

**Why it matters:** TKOS triggers are multi-factorial and patient-specific. For one patient, it might be heat + medication trough. For another, sleep debt + exertion. No clinician, seeing the patient for 15 minutes every 3 months, can identify these compound patterns. A learning model watches continuously and remembers everything.

**How it would work:**
- Starts with priors from the TKOS registry and CPVT literature — what triggers events in these conditions generally
- Each tap is a labeled event: "something happened here"
- The model examines what all six streams looked like in the hours before each tap
- Early on, confidence is low and the model is honest about uncertainty
- After approximately 20-30 taps, it begins identifying which stream combinations most reliably precede her episodes

**What it would do with that knowledge:** When the passive streams converge on her personal pre-episode pattern, a single calm, low-urgency notification surfaces. Not an alarm. Not red text. Not "DANGER." Just quiet awareness.

**Why calm matters:** For TKOS, stress and adrenaline literally trigger arrhythmias. A frightening alert could cause the exact cardiac event it's warning about. Any future notification design must be deliberately clinical, not emotional.

---

### Layer 6: Physician Report Generator

**What it does:** One button generates a structured PDF for her cardiologist visit.

**Why it matters:** Right now, the 15-minute quarterly visit goes: "How have you been?" and the patient or parent tries to recall months of experience from memory. Critical details are lost. Patterns are invisible. The visit becomes a guessing game.

**What the report contains:**
- Her personal baseline for each stream and how it's trended over the reporting period
- Medication trough windows mapped against her HRV timeline — showing the relationship between drug coverage and autonomic stability
- Her full episode library with 24-hour context for each tap
- Stream correlation analysis — which factors appear most consistently before episodes
- Trajectory — is her HRV baseline improving, stable, or declining over months?

The report is formatted for a 5-minute clinical review. Information is prioritized by clinical significance, not chronology. The cardiologist gets a data-backed longitudinal picture instead of a memory-based snapshot.

---

## What We Build vs. What We Demo

### What we build

- **One-tap capture** with automatic context snapshot — the core interaction
- **Physician PDF report generation** — structured clinical output from captured data
- **Simulated patient data** showing trough-episode correlation — demonstrates the PK overlay concept with realistic data
- **Apple Watch data ingestion** — pulling real health data from our teammate's watch for the demo
- **In-app data generation buttons** — since we can't wait for a real arrhythmia event during a hackathon, the app includes buttons that simulate contextual data entries (heart rate spike, missed dose, poor sleep, etc.) to populate the system and demonstrate how it works over time

### What we demo conceptually

- **Bayesian learning model** — we describe the architecture and priors but don't implement the full model
- **NLP extraction from clinical notes** — show sample extractions from example doctor's notes
- **Pharmacokinetic curve visualization** — the medication blood-level model is the vision differentiator; we show the concept and its clinical value

### The hackathon reality

We have a teammate with TKOS. We can pull her real Apple Watch data for the demo. But we cannot wait for a real cardiac event to happen during the hackathon — and we wouldn't want to. Instead, the app includes manual data generation buttons that let us simulate the kind of events and context the system would capture in real use. This lets us demonstrate the full data flow — from capture through context snapshot to physician report — without depending on a live medical event.

The pharmacokinetic overlay is the differentiator — no existing app models medication blood levels against biometric data for channelopathy patients. That's the thing that makes a cardiologist lean forward. For the hackathon, we demonstrate this concept with simulated data and explain how it would work with real dose-logging over time.

---

## Key Design Principles

### Personal baselines, not population norms
Every threshold in the system is calibrated to this patient's data, not textbook ranges. With 340 patients worldwide, "normal" means nothing. Her normal is what matters.

### Calm is clinical
Notifications are never alarming. Stress triggers arrhythmia in TKOS. A scary alert could cause the event it's warning about. The system communicates with quiet, clinical language.

### One gesture maximum
During an episode, cognitive load is at its peak. Every patient interaction is designed to require one tap or less. Context is captured automatically.

### Honest uncertainty
The model states its confidence. Early on, it says "I don't have enough data yet." It never pretends to know more than it does. Gaps and limitations are documented, not hidden.

### The ICD's partner, not its replacement
Guardrail doesn't compete with the implanted device. It captures what the ICD deliberately ignores — the subclinical events, the trends, the compound context. Together, they create a complete picture that neither provides alone.

---

## Tech Stack (Possibilities / Ideas)

| Component | Options | Notes |
|---|---|---|
| **Mobile app** | Swift + HealthKit | iOS-first. HealthKit background delivery for passive data streams. Swift is required for native Apple Watch and HealthKit integration. |
| **Local database** | SQLite or InfluxDB | SQLite for simplicity and hackathon speed. InfluxDB if we need time-series query performance for overlaying streams on a timeline. |
| **PK modeling** | Python + PKPy | Open-source pharmacokinetic library. Models nadolol and flecainide blood-level curves from logged dose times and known half-lives. |
| **NLP for EHR parsing** | Claude API | Extracts triggers, prodromal descriptions, and treatment patterns from unstructured clinical notes. Demo scope — run on sample notes. |
| **Bayesian model** | PyMC or similar | Future vision layer. Would use PyMC for probabilistic modeling with TKOS registry priors. Not built for hackathon. |
| **PDF generation** | Standard report templating | Generates the physician report. Any PDF library works — the clinical content structure matters more than the rendering tool. |
| **Weather** | OpenWeatherMap API | Free tier. Polled every 30 minutes via GPS location. Temperature and humidity as environmental context. |

---

## The Hackathon Track Alignment

This project addresses Track 3: Symptom Management.

**3.2 Narrow Challenge — Symptom-to-Signal Translation:** The core product. Converting one-tap patient reports and passive biometrics into structured, longitudinal, clinician-usable signals. Not a narrative summary — structured data with timelines, baselines, deviations, and correlations.

**3.1 General — Flare-Week Planner and Emergency Brief:** The physician report generator and the one-tap episode library directly serve this. When things get worse, the system captures what changed, from when, and produces a structured update for the care team.

---

## Why This Matters

A child with TKOS today lives under blanket restriction. Don't run. Don't swim. Be careful. The fear is constant — for the child and the family. Care is reactive: something happens, then everyone responds.

Guardrail shifts the frame. It watches passively, learns personally, and over time builds a picture of this specific patient's risk landscape that no 15-minute visit could ever produce. It gives the doctor data they've never had. And it fills the gap between what her ICD catches and what actually happens in her body every day.

The technology isn't the point. The point is a child who gets told "today is a good day" — and a parent who can believe it.

---

## Notes

- Wrist temperature has uses beyond fever detection — could feed into fatigue tracking, exercise recovery, and other physiological state signals worth exploring.
- Medication logging needs to account for multiple drugs. A single tap works for one daily dose, but TKOS patients often take both nadolol and flecainide (and potentially others). The tap flow needs to handle selecting which drug was taken, or logging multiple doses at different times of day.

import type { Vitals, ActivityState } from "./types";

const HR_BASELINE = 78;
const HRV_BASELINE = 44;
const ACTIVITIES: ActivityState[] = ["Resting", "Walking", "Active"];

function gaussian(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

let lastHR = HR_BASELINE;
let lastHRV = HRV_BASELINE;
let lastActivity: ActivityState = "Resting";
let activityCounter = 0;

export function nextVitals(drugLevelPercent: number): Vitals {
  const inTrough = drugLevelPercent < 30;
  const hrMean = inTrough ? HR_BASELINE + 12 : HR_BASELINE;
  const hrvMean = inTrough ? HRV_BASELINE - 14 : HRV_BASELINE;

  lastHR = Math.round(Math.max(55, Math.min(120, gaussian(hrMean, 4))));
  lastHRV = Math.round(Math.max(18, Math.min(75, gaussian(hrvMean, 5))));

  activityCounter++;
  if (activityCounter > 20 + Math.floor(Math.random() * 30)) {
    lastActivity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
    activityCounter = 0;
  }

  const barometer = Math.round(1013 + gaussian(0, 3));
  const stability: Vitals["barometerStability"] =
    Math.random() > 0.85
      ? Math.random() > 0.5
        ? "rising"
        : "falling"
      : "stable";

  return {
    heartRate: lastHR,
    hrv: lastHRV,
    activity: lastActivity,
    barometer,
    barometerStability: stability,
  };
}

export function decayConcentration(
  lastDoseAt: number,
  tHalfHours: number,
  now: number
): number {
  const hoursSince = (now - lastDoseAt) / (1000 * 60 * 60);
  if (hoursSince <= 0) return 100;
  const k = 0.693 / tHalfHours;
  return Math.max(0, Math.min(100, 100 * Math.exp(-k * hoursSince)));
}

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

export function getCurrentDrugLevel(
  halfLifeHours: number,
  doseTimes: string[],
  now: Date = new Date(),
): number {
  const hour = now.getHours();
  const doseHours = doseTimes.map((t) => parseInt(t.split(":")[0]));

  let lastDoseHour = doseHours[0];
  for (const dh of doseHours) {
    if (dh <= hour) lastDoseHour = dh;
  }

  const lastDose = new Date(now);
  lastDose.setHours(lastDoseHour, 0, 0, 0);
  if (lastDose > now) lastDose.setDate(lastDose.getDate() - 1);

  return Math.round(decayConcentration(lastDose, halfLifeHours, now));
}

export function getLastDose(doseTimes: string[], now: Date = new Date()): Date {
  const hour = now.getHours();
  const doseHours = doseTimes.map((t) => parseInt(t.split(":")[0]));

  let lastDoseHour = doseHours[0];
  for (const dh of doseHours) {
    if (dh <= hour) lastDoseHour = dh;
  }

  const lastDose = new Date(now);
  lastDose.setHours(lastDoseHour, 0, 0, 0);
  if (lastDose > now) lastDose.setDate(lastDose.getDate() - 1);

  return lastDose;
}

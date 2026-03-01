"use client";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import { decayConcentration } from "@/lib/simulate";

interface EpisodeTimelineProps {
  recordedAt: string;
  hrData: { recordedAt: string; hrBpm: number }[];
  hrvData: { recordedAt: string; hrvMs: number }[];
}

interface TimelinePoint {
  time: number;
  label: string;
  hr: number | null;
  hrv: number | null;
  nadolol: number;
  flecainide: number;
}

function buildTimelineData(
  recordedAt: string,
  hrData: { recordedAt: string; hrBpm: number }[],
  hrvData: { recordedAt: string; hrvMs: number }[],
): TimelinePoint[] {
  const epTime = new Date(recordedAt).getTime();
  const windowMs = 12 * 60 * 60 * 1000;
  const startMs = epTime - windowMs;
  const endMs = epTime + windowMs;
  const points: TimelinePoint[] = [];

  for (let t = startMs; t <= endMs; t += 30 * 60 * 1000) {
    const d = new Date(t);
    const hour = d.getHours();
    const min = d.getMinutes();
    const label = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

    // Find nearest HR reading (within 5 min)
    const nearHr = hrData.find((r) => Math.abs(new Date(r.recordedAt).getTime() - t) < 5 * 60 * 1000);
    const nearHrv = hrvData.find((r) => Math.abs(new Date(r.recordedAt).getTime() - t) < 5 * 60 * 1000);

    // Compute drug levels at this time
    // Nadolol: BID at 09:00 and 20:00, half-life 22h
    const nadololDoses = [9, 20];
    let nadolol = 0;
    for (const doseHour of nadololDoses) {
      const dose = new Date(d);
      dose.setHours(doseHour, 0, 0, 0);
      if (dose > d) dose.setDate(dose.getDate() - 1);
      const prevDose = new Date(dose);
      prevDose.setDate(prevDose.getDate() - 1);
      nadolol += decayConcentration(dose, 22, d) * 0.5;
      nadolol += decayConcentration(prevDose, 22, d) * 0.5;
    }
    nadolol = Math.min(100, nadolol);

    // Flecainide: once daily at 09:00, half-life 15h
    const spiroDose = new Date(d);
    spiroDose.setHours(9, 0, 0, 0);
    if (spiroDose > d) spiroDose.setDate(spiroDose.getDate() - 1);
    const flecainide = decayConcentration(spiroDose, 15, d);

    points.push({
      time: t,
      label,
      hr: nearHr?.hrBpm ?? null,
      hrv: nearHrv?.hrvMs ?? null,
      nadolol: Math.round(nadolol),
      flecainide: Math.round(flecainide),
    });
  }

  return points;
}

export function EpisodeTimeline({ recordedAt, hrData, hrvData }: EpisodeTimelineProps) {
  const data = buildTimelineData(recordedAt, hrData, hrvData);
  const epTime = new Date(recordedAt).getTime();

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
          <Line yAxisId="pct" type="monotone" dataKey="flecainide" stroke="#14b8a6" strokeWidth={1.5} dot={false} strokeDasharray="6 3" />

          {/* Episode marker */}
          <ReferenceLine x={epLabel} yAxisId="hr" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 rounded" /> HR</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 rounded border-dashed" /> HRV</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 rounded" /> Nadolol</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-teal-500 rounded" /> Flecainide</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-100 border border-amber-300 rounded-sm" /> ICD Gap</span>
        <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-red-500 rounded" /> Episode</span>
      </div>
    </div>
  );
}

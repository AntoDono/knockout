"use client";
import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea, ResponsiveContainer,
} from "recharts";
import type { DrugLevelPoint } from "@/hooks/useHeartSocket";
import type { DrugLevel } from "@/lib/types";

const DRUG_COLORS = [
  "hsl(220, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(280, 55%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(180, 50%, 45%)",
];

const HALF_LIVES_TO_PROJECT = 5;

interface DrugChartProps {
  drugLevelHistory: DrugLevelPoint[];
  drugLevels?: DrugLevel[];
  connected: boolean;
}

function getHalfLife(drug: string, history: DrugLevelPoint[], drugLevels?: DrugLevel[]): number {
  const pts = history.filter((p) => p.drug === drug);
  const last = pts[pts.length - 1];
  if (last?.halfLifeH && last.halfLifeH > 0) return last.halfLifeH;
  const match = drugLevels?.find((d) => d.drug === drug);
  return match?.halfLifeH ?? 0;
}

function buildProjection(
  drugNames: string[],
  drugLevelHistory: DrugLevelPoint[],
  drugLevels?: DrugLevel[],
) {
  const now = Date.now();
  const projData: Record<string, number | undefined>[] = [];
  const projDrugNames: string[] = [];
  let maxHalfLifeH = 0;

  for (const drug of drugNames) {
    const pts = drugLevelHistory.filter((p) => p.drug === drug);
    const last = pts[pts.length - 1];
    if (!last) continue;

    const halfLifeH = getHalfLife(drug, drugLevelHistory, drugLevels);
    if (!halfLifeH || halfLifeH <= 0) continue;
    if (halfLifeH > maxHalfLifeH) maxHalfLifeH = halfLifeH;

    const projKey = `${drug} (proj)`;
    projDrugNames.push(projKey);

    const projHours = halfLifeH * HALF_LIVES_TO_PROJECT;
    const projMs = projHours * 3_600_000;
    const stepMs = projHours > 12 ? 300_000 : 60_000;
    const steps = Math.ceil(projMs / stepMs);

    for (let s = 0; s <= steps; s++) {
      const t = now + s * stepMs;
      const elapsedH = (t - last.time) / 3_600_000;
      const mg = last.mg * Math.pow(0.5, elapsedH / halfLifeH);

      let row = projData.find((r) => (r.time as number) === t);
      if (!row) {
        row = { time: t };
        projData.push(row);
      }
      row[projKey] = Math.max(0, mg);

      if (s === 0) {
        row[drug] = last.mg;
      }
    }
  }

  projData.sort((a, b) => (a.time as number) - (b.time as number));
  return { projData, projDrugNames, maxHalfLifeH };
}

export function DrugChart({ drugLevelHistory, drugLevels, connected }: DrugChartProps) {
  const [now] = useState(() => Date.now());
  const { chartData, drugNames, nowTime, critWindow } = useMemo(() => {
    if (drugLevelHistory.length === 0)
      return { chartData: [], drugNames: [] as string[], nowTime: now, critWindow: null };

    const names = [...new Set(drugLevelHistory.map((d) => d.drug))];

    const byTime = new Map<number, Record<string, number>>();
    for (const pt of drugLevelHistory) {
      const bucket = Math.round(pt.time / 1000) * 1000;
      if (!byTime.has(bucket)) byTime.set(bucket, {});
      byTime.get(bucket)![pt.drug] = pt.mg;
    }

    const liveData = Array.from(byTime.entries())
      .sort(([a], [b]) => a - b)
      .map(([time, drugs]) => ({ time, ...drugs } as Record<string, number | undefined>));

    const { projData, projDrugNames, maxHalfLifeH } = buildProjection(names, drugLevelHistory, drugLevels);

    const allNames = [...names, ...projDrugNames];
    const merged = [...liveData, ...projData];
    merged.sort((a, b) => (a.time as number) - (b.time as number));

    const cw = maxHalfLifeH > 0
      ? { x1: now + 4 * maxHalfLifeH * 3_600_000, x2: now + 5 * maxHalfLifeH * 3_600_000 }
      : null;

    return { chartData: merged, drugNames: allNames, nowTime: now, critWindow: cw };
  }, [drugLevelHistory, drugLevels, now]);

  const solidNames = drugNames.filter((n) => !n.endsWith("(proj)"));
  const projNames = drugNames.filter((n) => n.endsWith("(proj)"));

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Drug Plasma Levels (mg)
      </h2>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          {connected ? "Awaiting live data…" : "Connect to server to see drug data"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" vertical={false} />

            <XAxis
              dataKey="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t) => {
                const d = new Date(t);
                const day = d.toLocaleDateString("en-US", { weekday: "short" });
                const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return `${day} ${time}`;
              }}
              tick={{ fontSize: 9, fill: "hsl(0, 0%, 55%)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={60}
            />

            <YAxis
              tick={{ fontSize: 11, fill: "hsl(0, 0%, 55%)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
              label={{
                value: "mg",
                angle: -90,
                position: "insideLeft",
                offset: 20,
                style: { fontSize: 10, fill: "hsl(0, 0%, 55%)" },
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid hsl(0, 0%, 90%)",
                borderRadius: "12px",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              labelFormatter={(t) =>
                new Date(t as number).toLocaleTimeString("en-US", {
                  weekday: "short", hour: "numeric", minute: "2-digit", second: "2-digit",
                })
              }
              formatter={(value: number, name: string) => [`${value.toFixed(2)} mg`, name]}
            />

            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />

            {critWindow && (
              <ReferenceArea
                x1={critWindow.x1}
                x2={critWindow.x2}
                fill="hsl(0, 70%, 50%)"
                fillOpacity={0.08}
                stroke="hsl(0, 70%, 50%)"
                strokeOpacity={0.25}
                strokeDasharray="4 2"
                label={{
                  value: "Critical Window (4-5 t½)",
                  position: "insideTop",
                  fill: "hsl(0, 60%, 45%)",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}

            <ReferenceLine
              x={nowTime}
              stroke="hsl(0, 0%, 45%)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: "NOW",
                position: "top",
                fill: "hsl(0, 0%, 45%)",
                fontSize: 10,
                fontWeight: 600,
              }}
            />

            {solidNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={DRUG_COLORS[i % DRUG_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls
              />
            ))}

            {projNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={DRUG_COLORS[i % DRUG_COLORS.length]}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

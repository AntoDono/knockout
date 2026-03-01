"use client";

import { Heart, Waveform, PersonSimpleWalk, Gauge } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, ReferenceLine } from "recharts";
import type { Vitals, ActivityState } from "@/lib/types";

const HR_BASELINE = 78;
const HRV_BASELINE = 44;

/* ── Sparkline with Recharts ─────────────────────────── */

const hrChartConfig = {
  hr: { label: "Heart Rate", color: "var(--chart-3)" },
} satisfies ChartConfig;

const hrvChartConfig = {
  hrv: { label: "HRV", color: "var(--chart-2)" },
} satisfies ChartConfig;

interface SparklineProps {
  data: number[];
  dataKey: string;
  config: ChartConfig;
  color: string;
  gradientId: string;
  baseline?: number;
  height?: number;
}

function VitalSparkline({ data, dataKey, config, color, gradientId, baseline, height = 52 }: SparklineProps) {
  const chartData = data.map((v, i) => ({ i, [dataKey]: v }));

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {baseline != null && (
          <ReferenceLine y={baseline} stroke={color} strokeOpacity={0.2} strokeDasharray="3 3" />
        )}
        <Area
          dataKey={dataKey}
          type="monotone"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/* ── Activity badge ───────────────────────────────────── */

function activityStyle(state: ActivityState) {
  switch (state) {
    case "Active":   return "bg-amber-50 text-amber-700 border-amber-200";
    case "Walking":  return "bg-sky-50 text-sky-700 border-sky-200";
    default:         return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

/* ── Main component ───────────────────────────────────── */

interface VitalsCardProps {
  vitals: Vitals;
  history: { hr: number[]; hrv: number[] };
}

export function VitalsCard({ vitals, history }: VitalsCardProps) {
  const hrDev = vitals.heartRate - HR_BASELINE;
  const hrvDev = vitals.hrv - HRV_BASELINE;

  return (
    <div className="flex h-full flex-col gap-2.5">
      {/* Heart Rate */}
      <Card className="flex-1">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
                <Heart size={15} weight="fill" className="text-red-500 animate-pulse-live" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Heart Rate</span>
            </div>
            <Badge variant="outline" className={`tabular-nums text-[11px] ${hrDev >= 0 ? "bg-red-50 text-red-600 border-red-200" : "bg-sky-50 text-sky-600 border-sky-200"}`}>
              {hrDev >= 0 ? "+" : ""}{hrDev}
            </Badge>
          </div>

          <div className="mb-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums text-slate-900">{vitals.heartRate}</span>
            <span className="text-sm font-medium text-slate-400">BPM</span>
          </div>

          <VitalSparkline
            data={history.hr}
            dataKey="hr"
            config={hrChartConfig}
            color="#ef4444"
            gradientId="hr-grad"
            baseline={HR_BASELINE}
            height={52}
          />
        </CardContent>
      </Card>

      {/* HRV */}
      <Card className="flex-1">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <Waveform size={15} weight="bold" className="text-violet-500" />
              </div>
              <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">HRV</span>
            </div>
            <Badge variant="outline" className={`tabular-nums text-[11px] ${hrvDev >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
              {hrvDev >= 0 ? "+" : ""}{hrvDev} ms
            </Badge>
          </div>

          <div className="mb-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums text-slate-900">{vitals.hrv}</span>
            <span className="text-sm font-medium text-slate-400">ms</span>
          </div>

          <VitalSparkline
            data={history.hrv}
            dataKey="hrv"
            config={hrvChartConfig}
            color="#8b5cf6"
            gradientId="hrv-grad"
            baseline={HRV_BASELINE}
            height={44}
          />
        </CardContent>
      </Card>

      {/* Activity + Barometer row */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card>
          <CardContent className="p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <PersonSimpleWalk size={13} weight="bold" className="text-slate-400" />
              <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Activity</span>
            </div>
            <Badge variant="outline" className={activityStyle(vitals.activity)}>
              {vitals.activity}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Gauge size={13} weight="bold" className="text-slate-400" />
              <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Pressure</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-slate-900">
              {vitals.barometer}
              <span className="ml-0.5 text-[11px] font-medium text-slate-400">hPa</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

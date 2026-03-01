"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  ReferenceArea, ReferenceLine, Customized,
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartDataPoint { t: number; concentration: number; hrv: number }
interface TroughZone { start: number; end: number }

interface Props {
  chartData: ChartDataPoint[];
  troughZones: TroughZone[];
  doseTimes: number[];
  episodeTimes: number[];
  now: number;
  windowStart: number;
  windowEnd: number;
  highlightTime?: number | null;
  mobile?: boolean;
}

const chartConfig = {
  concentration: { label: "Drug Level", color: "var(--chart-1)" },
  hrv: { label: "HRV", color: "var(--chart-2)" },
} satisfies ChartConfig;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTick(t: number): string {
  const d = new Date(t);
  return `${DAYS[d.getDay()]} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatTooltipTime(t: number): string {
  const d = new Date(t);
  return d.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
}

/* ── Custom pulsing "now" dot rendered via Customized ── */
function NowDot({ xAxisMap, yAxisMap, now, chartData }: {
  xAxisMap?: Record<string, { scale: (v: number) => number }>;
  yAxisMap?: Record<string, { scale: (v: number) => number }>;
  now: number;
  chartData: ChartDataPoint[];
}) {
  if (!xAxisMap || !yAxisMap) return null;
  const xScale = Object.values(xAxisMap)[0]?.scale;
  // yAxisId="conc" is the first Y axis
  const yScale = Object.values(yAxisMap)[0]?.scale;
  if (!xScale || !yScale) return null;

  const cx = xScale(now);
  if (cx == null || isNaN(cx)) return null;

  const nearest = chartData.reduce((a, b) =>
    Math.abs(a.t - now) < Math.abs(b.t - now) ? a : b
  );
  const cy = yScale(nearest.concentration);
  if (cy == null || isNaN(cy)) return null;

  return (
    <g>
      {/* "NOW" label */}
      <text x={cx} y={-2} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight={600}>
        NOW
      </text>
      {/* Dashed vertical line */}
      <line x1={cx} x2={cx} y1={8} y2={yScale(0)} stroke="#475569" strokeWidth={1} strokeDasharray="4 3" />
      {/* Pulsing outer glow */}
      <circle cx={cx} cy={cy} r={8} fill="#0ea5e9" opacity={0.15}>
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={4} fill="#0ea5e9" stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

/* ── Dose + Episode markers rendered via Customized ── */
function Markers({ xAxisMap, yAxisMap, doseTimes, episodeTimes }: {
  xAxisMap?: Record<string, { scale: (v: number) => number }>;
  yAxisMap?: Record<string, { scale: (v: number) => number }>;
  doseTimes: number[];
  episodeTimes: number[];
}) {
  if (!xAxisMap || !yAxisMap) return null;
  const xScale = Object.values(xAxisMap)[0]?.scale;
  const yScale = Object.values(yAxisMap)[0]?.scale;
  if (!xScale || !yScale) return null;

  const bottomY = yScale(0);
  if (bottomY == null || isNaN(bottomY)) return null;

  return (
    <g>
      {/* Dose markers: blue circles at bottom */}
      {doseTimes.map((t) => {
        const dx = xScale(t);
        if (dx == null || isNaN(dx)) return null;
        return (
          <g key={`dose-${t}`}>
            <line x1={dx} x2={dx} y1={bottomY - 16} y2={bottomY}
              stroke="#0ea5e9" strokeWidth={1.5} strokeLinecap="round" />
            <circle cx={dx} cy={bottomY - 18} r={3.5}
              fill="#0ea5e9" stroke="#fff" strokeWidth={1} />
          </g>
        );
      })}
      {/* Episode markers: red diamonds below axis */}
      {episodeTimes.map((t) => {
        const ex = xScale(t);
        if (ex == null || isNaN(ex)) return null;
        return (
          <path
            key={`ep-${t}`}
            d={`M${ex},${bottomY + 2} l4,6 -4,6 -4,-6z`}
            fill="#ef4444" stroke="#fff" strokeWidth={0.5}
          />
        );
      })}
    </g>
  );
}

/* ── Main chart component ─────────────────────────────── */

export function PKHRVChart({
  chartData, troughZones, doseTimes, episodeTimes,
  now, windowStart, windowEnd, highlightTime,
  mobile = false,
}: Props) {
  if (chartData.length === 0) return null;

  return (
    <div className={cn("h-full min-h-[180px]", mobile && "overflow-x-auto touch-pan-x scrollbar-thin")}>
      <div style={{ minWidth: mobile ? 700 : undefined }} className="h-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 52, bottom: 8, left: 52 }}
          >
            <defs>
              <linearGradient id="pkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#e2e8f0" strokeWidth={0.5} />

            {/* Trough zones */}
            {troughZones.map((zone, i) => (
              <ReferenceArea
                key={`trough-${i}`}
                x1={zone.start}
                x2={zone.end}
                yAxisId="conc"
                fill="#ef4444"
                fillOpacity={0.06}
                strokeOpacity={0}
              />
            ))}

            {/* Highlight line (selected episode) */}
            {highlightTime != null && (
              <ReferenceLine
                x={highlightTime}
                yAxisId="conc"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeOpacity={0.7}
              />
            )}

            <XAxis
              dataKey="t"
              type="number"
              domain={[windowStart, windowEnd]}
              scale="time"
              tickFormatter={formatTick}
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tickCount={mobile ? 4 : 6}
            />

            <YAxis
              yAxisId="conc"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: "#0ea5e9", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={42}
            />

            <YAxis
              yAxisId="hrv"
              orientation="right"
              domain={[0, 80]}
              tick={{ fontSize: 10, fill: "#8b5cf6", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={42}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload?.t) {
                      return formatTooltipTime(payload[0].payload.t);
                    }
                    return "";
                  }}
                  formatter={(value, name) => {
                    if (name === "concentration") return [`${Math.round(value as number)}%`, "Drug Level"];
                    if (name === "hrv") return [`${Math.round(value as number)} ms`, "HRV"];
                    return [value, name];
                  }}
                />
              }
            />

            {/* PK area fill + line */}
            <Area
              yAxisId="conc"
              dataKey="concentration"
              type="monotone"
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="url(#pkGrad)"
              dot={false}
              isAnimationActive={false}
            />

            {/* HRV dashed line */}
            <Line
              yAxisId="hrv"
              dataKey="hrv"
              type="monotone"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              strokeOpacity={0.7}
              dot={false}
              isAnimationActive={false}
            />

            {/* Custom elements rendered via Customized */}
            <Customized
              component={(props: Record<string, unknown>) =>
                <NowDot {...props as Record<string, unknown> & { xAxisMap: Record<string, { scale: (v: number) => number }>; yAxisMap: Record<string, { scale: (v: number) => number }> }} now={now} chartData={chartData} />
              }
            />
            <Customized
              component={(props: Record<string, unknown>) =>
                <Markers {...props as Record<string, unknown> & { xAxisMap: Record<string, { scale: (v: number) => number }>; yAxisMap: Record<string, { scale: (v: number) => number }> }} doseTimes={doseTimes} episodeTimes={episodeTimes} />
              }
            />
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  );
}

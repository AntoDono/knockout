"use client";
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  ReferenceArea,
} from "recharts";
import { usePKData } from "@/hooks/usePKData";

export function PKChart() {
  const { data, nowTime, troughZones } = usePKData();

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
            tickFormatter={(t) => new Date(t).toLocaleTimeString("en-US", { hour: "numeric" })}
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
            tickFormatter={(v: number) => `${v}%`}
          />

          <YAxis
            yAxisId="hrv"
            orientation="right"
            domain={[0, 80]}
            tick={{ fontSize: 11, fill: "hsl(0, 0%, 55%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}ms`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid hsl(0, 0%, 90%)",
              borderRadius: "12px",
              fontSize: "12px",
              padding: "8px 12px",
            }}
            labelFormatter={(t) => new Date(t as number).toLocaleString("en-US", {
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

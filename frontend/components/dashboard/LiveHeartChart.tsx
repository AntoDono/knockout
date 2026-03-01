"use client";
import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { BpmPoint } from "@/hooks/useHeartSocket";

interface LiveHeartChartProps {
  bpmHistory: BpmPoint[];
  connected: boolean;
}

export function LiveHeartChart({ bpmHistory, connected }: LiveHeartChartProps) {
  const chartData = useMemo(
    () => bpmHistory.map((bp) => ({ time: bp.time, bpm: bp.bpm })),
    [bpmHistory],
  );

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Live Heart Rate
      </h2>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          {connected ? "Awaiting live data…" : "Connect to server to see live data"}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" vertical={false} />

            <XAxis
              dataKey="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t) =>
                new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
              }
              tick={{ fontSize: 10, fill: "hsl(0, 0%, 55%)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={50}
            />

            <YAxis
              domain={[40, 180]}
              tick={{ fontSize: 11, fill: "hsl(0, 0%, 55%)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}`}
              label={{
                value: "bpm",
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
                  hour: "numeric", minute: "2-digit", second: "2-digit",
                })
              }
              formatter={(value: number) => [`${Math.round(value)} bpm`, "Heart Rate"]}
            />

            <Line
              type="monotone"
              dataKey="bpm"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: "hsl(0, 84%, 60%)" }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

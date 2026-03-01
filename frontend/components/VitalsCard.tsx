"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Heart, ChartLine, ActivityIcon, Gauge } from "@phosphor-icons/react";
import type { Vitals, ActivityState } from "@/lib/types";

const HR_BASELINE = 78;
const HRV_BASELINE = 44;

interface SparklineProps {
  data: number[];
  color: string;
  baseline?: number;
  width: number;
  height: number;
}

function Sparkline({ data, color, baseline, width, height }: SparklineProps) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!ref.current || data.length < 2) return;
    const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, width]);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const pad = (max - min) * 0.1 || 1;
    const y = d3
      .scaleLinear()
      .domain([min - pad, max + pad])
      .range([height, 0]);
    const line = d3
      .line<number>()
      .x((_, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);
    d3.select(ref.current).selectAll("*").remove();
    const svg = d3.select(ref.current).attr("width", width).attr("height", height);
    svg.append("path").datum(data).attr("fill", "none").attr("stroke", color).attr("stroke-width", 1.5).attr("d", line as unknown as () => string);
    if (baseline != null) {
      const by = y(baseline);
      if (by >= 0 && by <= height) {
        svg.append("line").attr("x1", 0).attr("x2", width).attr("y1", by).attr("y2", by).attr("stroke", color).attr("stroke-opacity", 0.4).attr("stroke-dasharray", "2 2");
      }
    }
  }, [data, color, baseline, width, height]);
  return <svg ref={ref} className="block" />;
}

interface VitalsCardProps {
  vitals: Vitals;
  history: { hr: number[]; hrv: number[] };
}

function ActivityLabel({ state }: { state: ActivityState }) {
  return <span className="text-lg font-semibold text-zinc-800">{state}</span>;
}

export function VitalsCard({ vitals, history }: VitalsCardProps) {
  const w = 100;
  const h = 24;

  const hrDev = vitals.heartRate - HR_BASELINE;
  const hrvPct = HRV_BASELINE ? Math.round(((vitals.hrv - HRV_BASELINE) / HRV_BASELINE) * 100) : 0;

  const cardClass = "rounded-[20px] bg-white p-3 shadow-[0_4px_20px_rgba(56,189,248,0.08)]";
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
      <div className={cardClass}>
        <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <Heart size={14} weight="duotone" className="text-red-400" />
          Heart Rate
        </p>
        <p className="text-xl font-semibold text-zinc-800">{vitals.heartRate} <span className="text-xs font-normal text-zinc-500">BPM</span></p>
        <p className={`text-xs ${hrDev >= 0 ? "text-red-500" : "text-sky-500"}`}>{hrDev >= 0 ? "+" : ""}{hrDev}</p>
        <Sparkline data={history.hr.length ? history.hr : [vitals.heartRate]} color="#ef4444" baseline={HR_BASELINE} width={w} height={h} />
      </div>

      <div className={cardClass}>
        <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <ChartLine size={14} weight="duotone" className="text-violet-400" />
          HRV
        </p>
        <p className="text-xl font-semibold text-zinc-800">{vitals.hrv} <span className="text-xs font-normal text-zinc-500">ms</span></p>
        <p className={`text-xs ${hrvPct >= 0 ? "text-sky-600" : "text-amber-600"}`}>{hrvPct >= 0 ? "+" : ""}{hrvPct}%</p>
        <Sparkline data={history.hrv.length ? history.hrv : [vitals.hrv]} color="#8B5CF6" baseline={HRV_BASELINE} width={w} height={h} />
      </div>

      <div className={cardClass}>
        <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <ActivityIcon size={14} weight="duotone" className="text-sky-400" />
          Activity
        </p>
        <ActivityLabel state={vitals.activity} />
      </div>

      <div className={cardClass}>
        <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <Gauge size={14} weight="duotone" className="text-zinc-400" />
          Barometer
        </p>
        <p className="text-xl font-semibold text-zinc-800">{vitals.barometer} <span className="text-xs text-zinc-500">hPa</span></p>
        <p className="text-xs text-zinc-500 capitalize">{vitals.barometerStability}</p>
      </div>
    </div>
  );
}

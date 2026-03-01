"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

interface PKPoint {
  t: number;
  concentration: number;
}

interface HRVPoint {
  t: number;
  hrv: number;
}

interface TroughZone {
  start: number;
  end: number;
}

interface Props {
  pkPoints: PKPoint[];
  hrvPoints: HRVPoint[];
  troughZones: TroughZone[];
  doseTimes: number[];
  episodeTimes: number[];
  now: number;
  windowStart: number;
  windowEnd: number;
  highlightTime?: number | null;
  mobile?: boolean;
}

const MARGIN = { top: 16, right: 48, bottom: 40, left: 48 };
const HRV_MAX = 80;
const CONC_MAX = 100;

export function PKHRVChart({
  pkPoints,
  hrvPoints,
  troughZones,
  doseTimes,
  episodeTimes,
  now,
  windowStart,
  windowEnd,
  highlightTime,
  mobile = false,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    if (!svgRef.current || !wrapRef.current || pkPoints.length === 0) return;

    const width = wrapRef.current.clientWidth;
    const height = Math.max(160, wrapRef.current.clientHeight || (mobile ? 220 : 280));
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const xScale = d3
      .scaleTime()
      .domain([windowStart, windowEnd])
      .range([0, innerWidth]);

    const yConc = d3
      .scaleLinear()
      .domain([0, CONC_MAX])
      .range([innerHeight, 0])
      .nice();

    const yHRV = d3
      .scaleLinear()
      .domain([0, HRV_MAX])
      .range([innerHeight, 0])
      .nice();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const defs = svg.append("defs");

    const concGrad = defs
      .append("linearGradient")
      .attr("id", "pk-gradient")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", 1);
    concGrad.append("stop").attr("offset", "0%").attr("stop-color", "#38bdf8");
    concGrad
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgba(56,189,248,0.1)");

    const concLine = d3
      .line<PKPoint>()
      .x((d) => xScale(d.t))
      .y((d) => yConc(d.concentration))
      .curve(d3.curveMonotoneX);

    const hrvLine = d3
      .line<HRVPoint>()
      .x((d) => xScale(d.t))
      .y((d) => yHRV(d.hrv))
      .curve(d3.curveMonotoneX);

    troughZones.forEach((zone) => {
      const x1 = xScale(zone.start);
      const x2 = xScale(zone.end);
      g.append("rect")
        .attr("x", x1)
        .attr("y", 0)
        .attr("width", Math.max(2, x2 - x1))
        .attr("height", innerHeight)
        .attr("fill", "rgba(239,68,68,0.12)")
        .attr("rx", 4);
    });

    const pkPath = g.append("path").datum(pkPoints).attr("fill", "none");

    const area = d3
      .area<PKPoint>()
      .x((d) => xScale(d.t))
      .y0(innerHeight)
      .y1((d) => yConc(d.concentration))
      .curve(d3.curveMonotoneX);

    g.insert("path", ":first-child")
      .datum(pkPoints)
      .attr("fill", "url(#pk-gradient)")
      .attr("d", area as unknown as () => string)
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .attr("opacity", 1);

    pkPath
      .attr("d", concLine as unknown as () => string)
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round")
      .attr("opacity", 0)
      .attr("filter", "url(#glow)")
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .attr("opacity", 1);

    const glowFilter = defs.append("filter").attr("id", "glow");
    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", 2)
      .attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    g.append("path")
      .datum(hrvPoints)
      .attr("d", hrvLine as unknown as () => string)
      .attr("fill", "none")
      .attr("stroke", "#8B5CF6")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6 4")
      .attr("stroke-linecap", "round")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(200)
      .ease(d3.easeCubicInOut)
      .attr("opacity", 0.9);

    g.append("line")
      .attr("x1", xScale(now))
      .attr("x2", xScale(now))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#64748b")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4 4");

    episodeTimes.forEach((t) => {
      g.append("circle")
        .attr("cx", xScale(t))
        .attr("cy", innerHeight + 4)
        .attr("r", 4)
        .attr("fill", "#ef4444");
    });

    doseTimes.forEach((t) => {
      const gPill = g.append("g").attr("transform", `translate(${xScale(t)},${innerHeight + 2})`);
      gPill
        .append("rect")
        .attr("x", -6)
        .attr("y", -5)
        .attr("width", 12)
        .attr("height", 10)
        .attr("rx", 2)
        .attr("fill", "#38bdf8")
        .attr("opacity", 0.9);
      gPill
        .append("line")
        .attr("x1", -3)
        .attr("x2", 3)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);
    });

    if (highlightTime != null) {
      const x = xScale(highlightTime);
      if (x >= 0 && x <= innerWidth) {
        g.append("line")
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", 0)
          .attr("y2", innerHeight)
          .attr("stroke", "#f59e0b")
          .attr("stroke-width", 2)
          .attr("opacity", 0.8);
      }
    }

    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat((d) => {
      const date = d as Date;
      return d3.timeFormat("%a %H:%M")(date);
    });
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr("color", "#64748b")
      .selectAll("text")
      .attr("font-size", "11px");

    const yLeft = d3.axisLeft(yConc).ticks(5).tickFormat((d) => `${d}%`);
    g.append("g").call(yLeft).attr("color", "#38bdf8").selectAll("text").attr("font-size", "11px");

    const yRight = d3.axisRight(yHRV).ticks(5).tickFormat((d) => `${d}`);
    g.append("g")
      .attr("transform", `translate(${innerWidth},0)`)
      .call(yRight)
      .attr("color", "#8B5CF6")
      .selectAll("text")
      .attr("font-size", "11px");
  }, [
    pkPoints,
    hrvPoints,
    troughZones,
    doseTimes,
    episodeTimes,
    now,
    windowStart,
    windowEnd,
    highlightTime,
    mobile,
  ]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div
      ref={wrapRef}
      className={`h-full min-h-[160px] overflow-x-auto overflow-y-hidden ${mobile ? "touch-pan-x" : ""}`}
      style={{ minWidth: mobile ? 800 : undefined }}
    >
      <svg
        ref={svgRef}
        className="min-w-full"
        style={{ minWidth: mobile ? 800 : "100%" }}
      />
    </div>
  );
}

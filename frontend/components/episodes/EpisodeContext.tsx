"use client";
import { Heart, Activity, Thermometer, Moon, CloudSun } from "lucide-react";
import { useFetch } from "@/lib/api";
import type { EpisodeContextData, EpisodeInsight } from "@/lib/types";
import { EpisodeTimeline } from "./EpisodeTimeline";

interface EpisodeContextProps {
  episodeId: number;
  insight?: EpisodeInsight;
}

function MiniStat({ icon: Icon, label, value, unit, color, comparison }: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  color: string;
  comparison?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40">
      <Icon className={`h-4 w-4 ${color} shrink-0`} />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold">{value} <span className="text-xs font-normal text-muted-foreground">{unit}</span></p>
        {comparison && <p className="text-[10px] text-muted-foreground">{comparison}</p>}
      </div>
    </div>
  );
}

export function EpisodeContext({ episodeId, insight }: EpisodeContextProps) {
  const { data: ctx, loading } = useFetch<EpisodeContextData>(`/episodes/${episodeId}/context`);

  if (loading || !ctx) {
    return (
      <div className="mt-4 pt-4 border-t border-border/50 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  const hrWindow = ctx.hr ?? [];
  const hrvWindow = ctx.hrv ?? [];
  const tempWindow = ctx.temperature ?? [];
  const weatherWindow = ctx.weather ?? [];
  const sleepWindow = ctx.sleep ?? [];

  const avgHr = hrWindow.length
    ? Math.round(hrWindow.reduce((s, r) => s + r.hrBpm, 0) / hrWindow.length)
    : null;
  const maxHr = hrWindow.length ? Math.max(...hrWindow.map((r) => r.hrBpm)) : null;
  const minHr = hrWindow.length ? Math.min(...hrWindow.map((r) => r.hrBpm)) : null;

  const avgHrv = hrvWindow.length
    ? Math.round(hrvWindow.reduce((s, r) => s + r.hrvMs, 0) / hrvWindow.length)
    : null;

  const avgTemp = tempWindow.length
    ? (tempWindow.reduce((s, r) => s + r.tempC, 0) / tempWindow.length).toFixed(1)
    : null;

  const avgWeatherTemp = weatherWindow.length
    ? Math.round(weatherWindow.reduce((s, r) => s + r.tempC, 0) / weatherWindow.length)
    : null;
  const avgHumidity = weatherWindow.length
    ? Math.round(weatherWindow.reduce((s, r) => s + r.humidityPct, 0) / weatherWindow.length)
    : null;

  const nearestSleep = sleepWindow[0] ?? null;

  // Baseline comparisons from API
  const baselines = ctx.baselines;
  const hrDeviation = avgHr !== null && baselines?.hr?.mean
    ? Math.round(((avgHr - baselines.hr.mean) / baselines.hr.mean) * 100)
    : null;
  const hrvDeviation = avgHrv !== null && baselines?.hrv?.mean
    ? Math.round(((avgHrv - baselines.hrv.mean) / baselines.hrv.mean) * 100)
    : null;
  const tempNum = avgTemp !== null ? parseFloat(avgTemp) : null;
  const tempDeviationC = tempNum !== null && baselines?.temperature?.mean
    ? +(tempNum - baselines.temperature.mean).toFixed(2)
    : null;
  const weatherDeviation = avgWeatherTemp !== null && baselines?.weather?.meanTempC
    ? Math.round(avgWeatherTemp - baselines.weather.meanTempC)
    : null;

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-fade-in">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        24-Hour Context Window
      </p>

      {/* Layer 1: Timeline chart */}
      {hrWindow.length > 0 && (
        <EpisodeTimeline
          recordedAt={ctx.episode.recordedAt}
          hrData={hrWindow}
          hrvData={hrvWindow}
        />
      )}

      {/* Layer 2: Enhanced stats with baseline comparison */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {avgHr !== null && (
          <MiniStat
            icon={Heart}
            label="Avg HR"
            value={`${avgHr}`}
            unit="bpm"
            color="text-red-500"
            comparison={hrDeviation !== null ? `${hrDeviation > 0 ? "+" : ""}${hrDeviation}% vs baseline` : undefined}
          />
        )}
        {minHr !== null && maxHr !== null && (
          <MiniStat icon={Heart} label="HR Range" value={`${minHr}–${maxHr}`} unit="bpm" color="text-red-400" />
        )}
        {avgHrv !== null && (
          <MiniStat
            icon={Activity}
            label="Avg HRV"
            value={`${avgHrv}`}
            unit="ms"
            color="text-primary"
            comparison={hrvDeviation !== null ? `${hrvDeviation > 0 ? "+" : ""}${hrvDeviation}% vs baseline` : undefined}
          />
        )}
        {avgTemp !== null && (
          <MiniStat
            icon={Thermometer}
            label="Body Temp"
            value={avgTemp}
            unit="°C"
            color="text-amber-500"
            comparison={tempDeviationC !== null ? `${tempDeviationC >= 0 ? "+" : ""}${tempDeviationC}° vs avg` : undefined}
          />
        )}
        {nearestSleep && (
          <MiniStat
            icon={Moon}
            label="Sleep"
            value={`${Math.floor(nearestSleep.durationMinutes / 60)}h ${nearestSleep.durationMinutes % 60}m`}
            unit={nearestSleep.quality}
            color="text-indigo-500"
          />
        )}
        {avgWeatherTemp !== null && (
          <MiniStat
            icon={CloudSun}
            label="Weather"
            value={`${avgWeatherTemp}°C`}
            unit={`${avgHumidity}% humid`}
            color="text-sky-500"
            comparison={weatherDeviation !== null ? `${weatherDeviation >= 0 ? "+" : ""}${weatherDeviation}° vs weekly avg` : undefined}
          />
        )}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{hrWindow.length} HR readings</span>
        <span>·</span>
        <span>{hrvWindow.length} HRV readings</span>
        <span>·</span>
        <span>{tempWindow.length} temp readings</span>
      </div>

      {/* Layer 3: Context narrative */}
      {insight?.contextNarrative && (
        <div className="rounded-xl bg-muted/30 p-3 border border-border/50 mt-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Context Analysis</p>
          <p className="text-xs text-foreground leading-relaxed">{insight.contextNarrative}</p>
        </div>
      )}
    </div>
  );
}

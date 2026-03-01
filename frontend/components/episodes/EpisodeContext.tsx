"use client";
import { Heart, Activity, Thermometer, Moon, CloudSun } from "lucide-react";
import type { Episode } from "@/lib/types";
import {
  HR_HISTORY, HRV_HISTORY, TEMPERATURE_HISTORY,
  WEATHER_HISTORY, SLEEP_HISTORY, BASELINES, EPISODE_INSIGHTS,
} from "@/lib/data/synthetic";
import { EpisodeTimeline } from "./EpisodeTimeline";

interface EpisodeContextProps {
  episode: Episode;
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
      <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold">{value} <span className="text-xs font-normal text-muted-foreground">{unit}</span></p>
        {comparison && <p className="text-[10px] text-muted-foreground">{comparison}</p>}
      </div>
    </div>
  );
}

export function EpisodeContext({ episode }: EpisodeContextProps) {
  const epTime = new Date(episode.recordedAt).getTime();
  const windowMs = 12 * 60 * 60 * 1000; // 12h each side = 24h window

  // Find readings within the 24h window
  const hrWindow = HR_HISTORY.filter((r) => {
    const t = new Date(r.recordedAt).getTime();
    return Math.abs(t - epTime) <= windowMs;
  });

  const hrvWindow = HRV_HISTORY.filter((r) => {
    const t = new Date(r.recordedAt).getTime();
    return Math.abs(t - epTime) <= windowMs;
  });

  const tempWindow = TEMPERATURE_HISTORY.filter((r) => {
    const t = new Date(r.recordedAt).getTime();
    return Math.abs(t - epTime) <= windowMs;
  });

  const weatherWindow = WEATHER_HISTORY.filter((r) => {
    const t = new Date(r.recordedAt).getTime();
    return Math.abs(t - epTime) <= windowMs;
  });

  // Find the nearest sleep record
  const nearestSleep = SLEEP_HISTORY.reduce((closest, s) => {
    const sleepTime = new Date(s.sleepEnd).getTime();
    const closestTime = closest ? new Date(closest.sleepEnd).getTime() : Infinity;
    return Math.abs(sleepTime - epTime) < Math.abs(closestTime - epTime) ? s : closest;
  }, SLEEP_HISTORY[0]);

  // Compute averages for the window
  const avgHr = hrWindow.length
    ? Math.round(hrWindow.reduce((s, r) => s + r.hrBpm, 0) / hrWindow.length)
    : episode.heartRate;
  const maxHr = hrWindow.length ? Math.max(...hrWindow.map((r) => r.hrBpm)) : episode.heartRate;
  const minHr = hrWindow.length ? Math.min(...hrWindow.map((r) => r.hrBpm)) : episode.heartRate;

  const avgHrv = hrvWindow.length
    ? Math.round(hrvWindow.reduce((s, r) => s + r.hrvMs, 0) / hrvWindow.length)
    : episode.hrv;

  const avgTemp = tempWindow.length
    ? (tempWindow.reduce((s, r) => s + r.tempC, 0) / tempWindow.length).toFixed(1)
    : "—";

  const avgWeatherTemp = weatherWindow.length
    ? Math.round(weatherWindow.reduce((s, r) => s + r.tempC, 0) / weatherWindow.length)
    : null;
  const avgHumidity = weatherWindow.length
    ? Math.round(weatherWindow.reduce((s, r) => s + r.humidityPct, 0) / weatherWindow.length)
    : null;

  // Baseline comparisons
  const hrDeviation = Math.round(((avgHr - BASELINES.hr.mean) / BASELINES.hr.mean) * 100);
  const hrvDeviation = Math.round(((avgHrv - BASELINES.hrv.mean) / BASELINES.hrv.mean) * 100);
  const tempNum = parseFloat(avgTemp as string);
  const tempDeviation = !isNaN(tempNum) ? Math.round(((tempNum - BASELINES.temperature.mean) / BASELINES.temperature.mean) * 100) : null;

  // Look up context narrative
  const insight = EPISODE_INSIGHTS.find((i) => i.id === episode.id);

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-fade-in">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        24-Hour Context Window
      </p>

      {/* Layer 1: Timeline chart */}
      <EpisodeTimeline episode={episode} />

      {/* Layer 2: Enhanced stats with baseline comparison */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <MiniStat icon={Heart} label="Avg HR" value={`${avgHr}`} unit="bpm" color="text-red-500" comparison={`${hrDeviation > 0 ? "+" : ""}${hrDeviation}% vs baseline`} />
        <MiniStat icon={Heart} label="HR Range" value={`${minHr}–${maxHr}`} unit="bpm" color="text-red-400" />
        <MiniStat icon={Activity} label="Avg HRV" value={`${avgHrv}`} unit="ms" color="text-primary" comparison={`${hrvDeviation > 0 ? "+" : ""}${hrvDeviation}% vs baseline`} />
        <MiniStat icon={Thermometer} label="Body Temp" value={avgTemp} unit="°C" color="text-amber-500" comparison={tempDeviation !== null ? `${tempDeviation > 0 ? "+" : ""}${tempDeviation}% vs baseline` : undefined} />
        {nearestSleep && (
          <MiniStat
            icon={Moon}
            label="Sleep"
            value={`${Math.floor(nearestSleep.durationMinutes / 60)}h ${nearestSleep.durationMinutes % 60}m`}
            unit={nearestSleep.quality}
            color="text-indigo-500"
            comparison={`avg ${Math.floor(BASELINES.sleep.meanDurationMin / 60)}h ${Math.round(BASELINES.sleep.meanDurationMin % 60)}m`}
          />
        )}
        {avgWeatherTemp !== null && (
          <MiniStat
            icon={CloudSun}
            label="Weather"
            value={`${avgWeatherTemp}°C`}
            unit={`${avgHumidity}% humid`}
            color="text-sky-500"
            comparison={`avg ${BASELINES.weather.meanTempC}°C`}
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

"use client";
import { Heart, Activity, Thermometer, Moon, CloudSun } from "lucide-react";
import { useFetch } from "@/lib/api";
import type { EpisodeContextData } from "@/lib/types";

interface EpisodeContextProps {
  episodeId: number;
}

function MiniStat({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40">
      <Icon className={`h-4 w-4 ${color} shrink-0`} />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold">{value} <span className="text-xs font-normal text-muted-foreground">{unit}</span></p>
      </div>
    </div>
  );
}

export function EpisodeContext({ episodeId }: EpisodeContextProps) {
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

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-fade-in">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        24-Hour Context Window
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {avgHr !== null && (
          <MiniStat icon={Heart} label="Avg HR" value={`${avgHr}`} unit="bpm" color="text-red-500" />
        )}
        {minHr !== null && maxHr !== null && (
          <MiniStat icon={Heart} label="HR Range" value={`${minHr}–${maxHr}`} unit="bpm" color="text-red-400" />
        )}
        {avgHrv !== null && (
          <MiniStat icon={Activity} label="Avg HRV" value={`${avgHrv}`} unit="ms" color="text-primary" />
        )}
        {avgTemp !== null && (
          <MiniStat icon={Thermometer} label="Body Temp" value={avgTemp} unit="°C" color="text-amber-500" />
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
    </div>
  );
}

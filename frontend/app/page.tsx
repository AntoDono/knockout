"use client";
import Image from "next/image";
import { Pill, Moon } from "lucide-react";
import { GreetingHero } from "@/components/dashboard/GreetingHero";
import { StatCard } from "@/components/dashboard/StatCard";
import { LiveHeartChart } from "@/components/dashboard/LiveHeartChart";
import { DrugChart } from "@/components/dashboard/DrugChart";
import { RecentEpisodes } from "@/components/dashboard/RecentEpisodes";
import { ICDGapMonitor } from "@/components/dashboard/ICDGapMonitor";
import { ActiveMeds } from "@/components/dashboard/ActiveMeds";
import { useFetch } from "@/lib/api";
import { useVitals, useHeartSocket } from "@/hooks/useVitals";
import { cn } from "@/lib/utils";
import type { Baselines, AfibData } from "@/lib/types";

function formatSimTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h
    ? `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`
    : `${m}m ${String(sec).padStart(2, "0")}s`;
}

const HRV_METRICS: {
  key: keyof AfibData;
  label: string;
  full: string;
  digits: number;
  alertFn?: (v: number) => "alert" | "hi" | null;
}[] = [
  { key: "cv", label: "CV", full: "Coefficient of Variation", digits: 3, alertFn: (v) => v > 0.065 ? "alert" : null },
  { key: "rmssdMs", label: "RMSSD", full: "Root Mean Square Successive Diff (ms)", digits: 1, alertFn: (v) => v > 40 ? "alert" : null },
  { key: "pnn20", label: "pNN20", full: "% Successive Differences > 20ms", digits: 3, alertFn: (v) => v > 0.40 ? "alert" : null },
  { key: "sd1Sd2Ratio", label: "SD1/SD2", full: "Poincaré Plot Axis Ratio", digits: 3, alertFn: (v) => v > 0.75 ? "alert" : null },
  { key: "sampleEntropy", label: "SampEn", full: "Sample Entropy", digits: 2, alertFn: (v) => v > 1.5 ? "hi" : null },
  { key: "lfHfRatio", label: "LF/HF", full: "Low / High Frequency Power Ratio", digits: 2 },
];

export default function DashboardPage() {
  const vitals = useVitals();
  const socket = useHeartSocket();
  const { data: baselines } = useFetch<Baselines>("/baselines");

  const sleepDur = baselines?.sleep?.meanDurationMin ?? 0;
  const sleepHours = Math.floor(sleepDur / 60);
  const sleepMins = Math.round(sleepDur % 60);

  const afib = socket.afib;
  const hasAfibData = afib !== null;
  const afibDetected = afib?.afibDetected ?? false;
  const confPct = hasAfibData ? Math.round((afib.confidence ?? 0) * 100) : null;

  const hasLive = socket.connected && socket.latestBpm !== null;
  const beatDuration = hasLive ? 60 / vitals.hr : 1.2;

  return (
    <div className="space-y-6 animate-fade-in">
      <GreetingHero />

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {/* Heart Rate card with pulsing heart image */}
        <div className="rounded-2xl bg-card p-5 shadow-sm min-w-[160px] flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Image
              src="/heart.png"
              alt="Heart"
              width={28}
              height={28}
              className="animate-heartbeat"
              style={{ animationDuration: `${beatDuration}s` }}
            />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Heart Rate
            </span>
            {hasLive && (
              <span className="ml-auto text-[10px] text-green-500 font-medium uppercase tracking-wider">Live</span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-foreground">{vitals.hr}</span>
            <span className="text-sm text-muted-foreground">bpm</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {vitals.hr - 70} from baseline
          </p>
        </div>

        <StatCard
          icon={Pill}
          label="Med Level"
          value={`${vitals.drugLevel}`}
          unit="%"
          subtitle="Nadolol"
          progress={vitals.drugLevel}
        />
        <StatCard
          icon={Moon}
          label="Sleep"
          value={sleepDur > 0 ? `${sleepHours}h ${sleepMins}m` : "—"}
          unit=""
          subtitle="7-day avg"
          accentColor="text-green-500"
        />
      </div>

      {/* Live monitor status bar */}
      <div className="rounded-2xl bg-card p-4 shadow-sm flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2.5 w-2.5 rounded-full transition-colors",
            socket.connected
              ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"
              : "bg-muted-foreground/30"
          )} />
          <span className="text-xs text-muted-foreground">
            {socket.connected ? "Live" : "Disconnected"}
          </span>
        </div>

        {socket.simName && (
          <>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-primary font-medium">{socket.simName}</span>
            {socket.simTimeS != null && (
              <span className="text-xs text-muted-foreground">
                {formatSimTime(socket.simTimeS)}
              </span>
            )}
          </>
        )}

        <div className="h-4 w-px bg-border" />

        {hasAfibData ? (
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-md border",
              afibDetected
                ? "bg-red-500/10 text-red-600 border-red-500/30"
                : "bg-green-500/10 text-green-600 border-green-500/30"
            )}>
              {afibDetected ? "AFIB DETECTED" : "NSR — CLEAR"}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    afibDetected ? "bg-red-500" : confPct! > 35 ? "bg-amber-500" : "bg-green-500"
                  )}
                  style={{ width: `${confPct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{confPct}%</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            {socket.connected ? "Awaiting heart data…" : "No live feed"}
          </span>
        )}
      </div>

      {/* HRV Metrics panel */}
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
          HRV Metrics
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {HRV_METRICS.map((m) => {
            const raw = afib ? (afib[m.key] as number) : null;
            const display = raw != null && !isNaN(raw) ? raw.toFixed(m.digits) : "—";
            let colorClass = "text-foreground";
            if (raw != null && m.alertFn) {
              const level = m.alertFn(raw);
              if (level === "alert") colorClass = "text-red-500";
              else if (level === "hi") colorClass = "text-amber-500";
            }

            return (
              <div key={m.key} className="rounded-xl bg-muted/50 border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                  {m.label}
                </p>
                <p className="text-[9px] text-muted-foreground/60 mb-2 leading-tight">
                  {m.full}
                </p>
                <p className={cn("text-lg font-semibold", colorClass)}>
                  {display}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LiveHeartChart
            bpmHistory={socket.bpmHistory}
            connected={socket.connected}
          />
          <DrugChart
            drugLevelHistory={socket.drugLevelHistory}
            drugLevels={socket.drugLevels}
            connected={socket.connected}
          />
          <ICDGapMonitor currentHr={socket.latestBpm != null ? Math.round(socket.latestBpm) : undefined} />
        </div>
        <div className="space-y-6">
          <RecentEpisodes />
          <ActiveMeds drugLevels={socket.drugLevels} />
        </div>
      </div>
    </div>
  );
}

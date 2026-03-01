"use client";
import { Heart, Activity, Pill, Moon } from "lucide-react";
import { GreetingHero } from "@/components/dashboard/GreetingHero";
import { StatCard } from "@/components/dashboard/StatCard";
import { PKChart } from "@/components/dashboard/PKChart";
import { RecentEpisodes } from "@/components/dashboard/RecentEpisodes";
import { ICDGapMonitor } from "@/components/dashboard/ICDGapMonitor";
import { ActiveMeds } from "@/components/dashboard/ActiveMeds";
import { SLEEP_HISTORY } from "@/lib/data/synthetic";
import { useVitals } from "@/hooks/useVitals";

export default function DashboardPage() {
  const vitals = useVitals();

  const lastSleep = SLEEP_HISTORY[SLEEP_HISTORY.length - 1];
  const sleepHours = Math.floor((lastSleep?.durationMinutes ?? 0) / 60);
  const sleepMins = (lastSleep?.durationMinutes ?? 0) % 60;

  return (
    <div className="space-y-6 animate-fade-in">
      <GreetingHero />

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        <StatCard
          icon={Heart}
          label="Heart Rate"
          value={`${vitals.hr}`}
          unit="bpm"
          delta={`${vitals.hr - 70} from baseline`}
          deltaDirection="neutral"
          accentColor="text-red-500"
        />
        <StatCard
          icon={Activity}
          label="HRV"
          value={`${vitals.hrv}`}
          unit="ms"
          delta="Status: Stable"
          deltaDirection="neutral"
          accentColor="text-primary"
        />
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
          value={`${sleepHours}h ${sleepMins}m`}
          unit=""
          subtitle={lastSleep?.quality ?? "—"}
          accentColor="text-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PKChart />
          <ICDGapMonitor />
        </div>
        <div className="space-y-6">
          <RecentEpisodes />
          <ActiveMeds />
        </div>
      </div>
    </div>
  );
}

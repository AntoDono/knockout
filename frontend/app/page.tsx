"use client";

import { useState, useCallback, useMemo } from "react";
import { ChartLine } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { PatientCard } from "@/components/PatientCard";
import { FeelSomethingButton } from "@/components/FeelSomethingButton";
import { EpisodeLog } from "@/components/EpisodeLog";
import { VitalsCard } from "@/components/VitalsCard";
import { PKHRVChart } from "@/components/PKHRVChart";
import { MedicationRow } from "@/components/MedicationRow";
import { AddMedicationModal } from "@/components/AddMedicationModal";
import { DrugCheckerTab } from "@/components/DrugCheckerTab";
import { ExportTab } from "@/components/ExportTab";
import { toast } from "sonner";
import { useEpisodes } from "@/hooks/useEpisodes";
import { useVitals } from "@/hooks/useVitals";
import { usePKData } from "@/hooks/usePKData";
import { useIsMobile } from "@/hooks/useIsMobile";
import { INITIAL_MEDICATIONS } from "@/lib/drugs";
import type { Medication } from "@/lib/types";
import type { DrugOption } from "@/lib/types";

export default function Home() {
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [desktopTab, setDesktopTab] = useState("overview");
  const [mobileTab, setMobileTab] = useState("overview");
  // Toast handled by Sonner (via layout.tsx Toaster)
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileDrugChecker, setMobileDrugChecker] = useState(false);

  const { episodes, highlightId, setHighlightId, addEpisode } = useEpisodes();

  const primaryConcentration = useMemo(() => {
    const nadolol = medications.find((m) => m.name === "Nadolol");
    if (!nadolol?.lastDoseAt) return 50;
    const k = 0.693 / nadolol.tHalfHours;
    const hoursSince = (Date.now() - nadolol.lastDoseAt) / (60 * 60 * 1000);
    return Math.max(0, Math.min(100, 100 * Math.exp(-k * hoursSince)));
  }, [medications]);

  const getDrugLevel = useCallback(() => primaryConcentration, [primaryConcentration]);
  const { vitals, history } = useVitals(getDrugLevel);
  const pkData = usePKData(medications, episodes);

  const handleFeelSomething = useCallback(() => {
    addEpisode(vitals.heartRate, vitals.hrv, Math.round(primaryConcentration));
    toast("Episode captured", {
      description: `HR ${vitals.heartRate} · Drug ${Math.round(primaryConcentration)}% · HRV ${vitals.hrv}ms`,
    });
  }, [addEpisode, vitals, primaryConcentration]);

  const handleTookDose = useCallback((id: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, lastDoseAt: Date.now() } : m)),
    );
  }, []);

  const handleToggleChart = useCallback((id: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, visibleOnChart: !m.visibleOnChart } : m)),
    );
  }, []);

  const handleAddMedication = useCallback((drug: DrugOption, dose: string, frequency: string) => {
    setMedications((prev) => [
      ...prev,
      {
        id: `${drug.name.toLowerCase()}-${Date.now()}`,
        name: drug.name,
        dose,
        frequency,
        tHalfHours: drug.tHalfHours,
        qtRisk: drug.qtRisk,
        concentrationPercent: 0,
        lastDoseAt: 0,
        visibleOnChart: true,
      },
    ]);
  }, []);

  const highlightTime = highlightId ? episodes.find((e) => e.id === highlightId)?.timestamp ?? null : null;

  const isMobile = useIsMobile();
  const showOverviewContent = desktopTab === "overview" || (isMobile && mobileTab !== "export" && !mobileDrugChecker);
  const showDrugChecker = desktopTab === "drugchecker" || (isMobile && mobileDrugChecker);
  const showExport = desktopTab === "export" || mobileTab === "export";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <Header
        activeTab={desktopTab}
        onTab={setDesktopTab}
        mobile={isMobile}
        onDrugCheckerClick={isMobile ? () => setMobileDrugChecker(true) : undefined}
      />

      {/* Drug Checker */}
      {showDrugChecker && (
        <div className={`flex min-h-0 flex-1 flex-col overflow-auto ${isMobile ? "px-3" : "hidden sm:block"}`}>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileDrugChecker(false)}
              className="shrink-0 self-start"
            >
              ← Back
            </Button>
          )}
          <DrugCheckerTab />
        </div>
      )}

      {/* Export */}
      {showExport && !showDrugChecker && (
        <div className={`flex min-h-0 flex-1 flex-col overflow-auto ${isMobile ? "" : "hidden sm:block"}`}>
          <ExportTab />
        </div>
      )}

      {/* Main dashboard */}
      {showOverviewContent && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 sm:px-5">
          {/* Mobile: Episodes tab */}
          {isMobile && mobileTab === "episodes" && (
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden py-2">
              <div className="shrink-0"><PatientCard /></div>
              <div className="min-h-0 flex-1 overflow-auto">
                <EpisodeLog episodes={episodes} highlightId={highlightId} onSelect={setHighlightId} />
              </div>
            </div>
          )}

          {/* Mobile: Drugs tab */}
          {isMobile && mobileTab === "drugs" && (
            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden py-2">
              <div className="shrink-0"><PatientCard /></div>
              <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
                <MedicationRow
                  medications={medications}
                  onTookDose={handleTookDose}
                  onToggleChart={handleToggleChart}
                  onAdd={() => setModalOpen(true)}
                  now={Date.now()}
                />
              </div>
            </div>
          )}

          {/* Overview */}
          {(desktopTab === "overview" || (isMobile && mobileTab === "overview")) && (
            <>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 py-2.5 lg:grid-cols-12">
                {/* Left sidebar */}
                <aside className="flex min-h-0 flex-col gap-2.5 lg:col-span-3">
                  <div className="shrink-0"><PatientCard /></div>
                  <div className="hidden shrink-0 lg:block">
                    <FeelSomethingButton onClick={handleFeelSomething} mobile={false} />
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <EpisodeLog episodes={episodes} highlightId={highlightId} onSelect={setHighlightId} />
                  </div>
                </aside>

                {/* Center: PK chart */}
                <main className="flex min-h-0 flex-col lg:col-span-6">
                  <Card className="flex min-h-0 flex-1 flex-col">
                    <CardContent className="flex min-h-0 flex-1 flex-col p-4">
                      <div className="mb-2 flex shrink-0 items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50">
                          <ChartLine size={15} weight="bold" className="text-sky-600" />
                        </div>
                        <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                          Drug Level & HRV · 48h
                        </span>
                      </div>
                      <div className="min-h-0 flex-1">
                        <PKHRVChart
                          chartData={pkData.chartData}
                          troughZones={pkData.troughZones}
                          doseTimes={pkData.doseTimes}
                          episodeTimes={pkData.episodeTimes}
                          now={pkData.now}
                          windowStart={pkData.windowStart}
                          windowEnd={pkData.windowEnd}
                          highlightTime={highlightTime}
                          mobile={isMobile}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </main>

                {/* Right sidebar: Vitals */}
                <aside className="min-h-0 lg:col-span-3">
                  <VitalsCard vitals={vitals} history={history} />
                </aside>
              </div>

              {/* Medication row */}
              <div className="shrink-0 py-1">
                <MedicationRow
                  medications={medications}
                  onTookDose={handleTookDose}
                  onToggleChart={handleToggleChart}
                  onAdd={() => setModalOpen(true)}
                  now={Date.now()}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile FAB */}
      {isMobile && (mobileTab === "overview" || mobileTab === "episodes") && (
        <FeelSomethingButton onClick={handleFeelSomething} mobile />
      )}

      <AddMedicationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAddMedication} />

      {isMobile && (
        <BottomNav
          activeTab={mobileTab}
          onTab={(tab) => {
            setMobileTab(tab);
            if (tab !== "export") setMobileDrugChecker(false);
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { ChartLine } from "@phosphor-icons/react";
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
import { Toast } from "@/components/Toast";
import { useEpisodes } from "@/hooks/useEpisodes";
import { useVitals } from "@/hooks/useVitals";
import { usePKData } from "@/hooks/usePKData";
import { useIsMobile } from "@/hooks/useIsMobile";
import { INITIAL_MEDICATIONS } from "@/lib/drugs";
import type { Medication } from "@/lib/types";
import type { DrugOption } from "@/lib/types";

function formatToastTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function Home() {
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [desktopTab, setDesktopTab] = useState("overview");
  const [mobileTab, setMobileTab] = useState("overview");
  const [toast, setToast] = useState<string | null>(null);
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
    setToast(`Captured · ${formatToastTime(Date.now())} · HR ${vitals.heartRate} · Drug ${Math.round(primaryConcentration)}% · HRV ${vitals.hrv}ms`);
  }, [addEpisode, vitals, primaryConcentration]);

  const handleTookDose = useCallback((id: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, lastDoseAt: Date.now() } : m))
    );
  }, []);

  const handleToggleChart = useCallback((id: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, visibleOnChart: !m.visibleOnChart } : m))
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
    <div className="flex h-screen flex-col overflow-hidden bg-sky-50/50">
      <Header
        activeTab={desktopTab}
        onTab={setDesktopTab}
        mobile={isMobile}
        onDrugCheckerClick={isMobile ? () => setMobileDrugChecker(true) : undefined}
      />

      {/* Drug Checker: desktop tab or mobile full screen */}
      {showDrugChecker && (
        <div className={`flex min-h-0 flex-1 flex-col overflow-auto ${isMobile ? "px-3" : "hidden sm:block"}`}>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileDrugChecker(false)}
              className="shrink-0 py-2 text-sm font-medium text-sky-600"
            >
              ← Back
            </button>
          )}
          <DrugCheckerTab />
        </div>
      )}
      {showExport && !showDrugChecker && (
        <div className={`flex min-h-0 flex-1 flex-col overflow-auto ${isMobile ? "" : "hidden sm:block"}`}>
          <ExportTab />
        </div>
      )}

      {/* Overview / Episodes / Drugs (main dashboard or mobile sections) */}
      {showOverviewContent && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 sm:px-6">
          {/* Mobile: Episodes tab = episode log first */}
          {isMobile && mobileTab === "episodes" && (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-2">
              <div className="shrink-0">
                <PatientCard />
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <EpisodeLog
                  episodes={episodes}
                  highlightId={highlightId}
                  onSelect={setHighlightId}
                />
              </div>
            </div>
          )}

          {isMobile && mobileTab === "drugs" && (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-2">
              <div className="shrink-0">
                <PatientCard />
              </div>
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

          {(desktopTab === "overview" || (isMobile && mobileTab === "overview")) && (
            <>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 py-2 lg:grid-cols-12">
                <aside className="flex min-h-0 flex-col gap-3 lg:col-span-3">
                  <div className="shrink-0">
                    <PatientCard />
                  </div>
                  <div className="hidden shrink-0 lg:block">
                    <FeelSomethingButton onClick={handleFeelSomething} mobile={false} />
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <EpisodeLog
                      episodes={episodes}
                      highlightId={highlightId}
                      onSelect={setHighlightId}
                    />
                  </div>
                </aside>

                <main className="flex min-h-0 flex-col lg:col-span-6">
                  <div className="flex min-h-0 flex-1 flex-col rounded-[22px] bg-white p-3 shadow-[0_4px_20px_rgba(56,189,248,0.08)]">
                    <p className="mb-1 flex items-center gap-1.5 shrink-0 text-sm font-medium text-zinc-500">
                      <ChartLine size={18} weight="duotone" className="text-sky-500" />
                      PK & HRV · 48h
                    </p>
                    <div className="min-h-0 flex-1">
                      <PKHRVChart
                        pkPoints={pkData.pkPoints}
                        hrvPoints={pkData.hrvPoints}
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
                  </div>
                </main>

                <aside className="min-h-0 lg:col-span-3">
                  <VitalsCard vitals={vitals} history={history} />
                </aside>
              </div>

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

      <AddMedicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddMedication}
      />

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}

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

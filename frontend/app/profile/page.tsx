"use client";
import { PatientInfo } from "@/components/profile/PatientInfo";
import { ICDDetails } from "@/components/profile/ICDDetails";
import { ECGTable } from "@/components/profile/ECGTable";
import { TriggersCard } from "@/components/profile/TriggersCard";
import { EmergencyContacts } from "@/components/profile/EmergencyContacts";
import { useFetch } from "@/lib/api";
import type { StaticThreshold } from "@/lib/types";

export default function ProfilePage() {
  const { data: thresholds } = useFetch<StaticThreshold>("/patient/thresholds");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patient Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Clinical foundation data from medical records</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientInfo />
        <div className="space-y-6">
          <ICDDetails />
          <TriggersCard />
        </div>
      </div>

      <EmergencyContacts />

      <ECGTable />

      {thresholds && (
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Clinical Thresholds</h3>
          <p className="text-xs text-muted-foreground mb-3">Set by {thresholds.clinician} on {thresholds.effectiveDate}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Resting HR</p><p className="font-semibold">{thresholds.restingHrBpm} bpm</p></div>
            <div><p className="text-xs text-muted-foreground">QRS Baseline</p><p className="font-semibold">{thresholds.qrsBaselineMs} ms</p></div>
            <div><p className="text-xs text-muted-foreground">QTc Baseline</p><p className="font-semibold">{thresholds.qtcBaselineMs} ms</p></div>
            <div><p className="text-xs text-muted-foreground">QTc Upper Limit</p><p className="font-semibold">{thresholds.qtcUpperLimitMs} ms</p></div>
            <div><p className="text-xs text-muted-foreground">ICD Gap</p><p className="font-semibold">{thresholds.icdGapLowerBpm}–{thresholds.icdGapUpperBpm} bpm</p></div>
            <div><p className="text-xs text-muted-foreground">QRS Alert</p><p className="font-semibold">{thresholds.qrsAbsoluteAlertMs} ms</p></div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">{thresholds.notes}</p>
        </div>
      )}
    </div>
  );
}

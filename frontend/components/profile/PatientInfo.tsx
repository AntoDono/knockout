"use client";
import { useState } from "react";
import { PATIENT, DIAGNOSES, ALLERGIES } from "@/lib/data/synthetic";
import { User, AlertCircle } from "lucide-react";

export function PatientInfo() {
  const [now] = useState(() => Date.now());
  const age = Math.floor(
    (now - new Date(PATIENT.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{PATIENT.firstName} {PATIENT.lastName}</h2>
            <p className="text-sm text-muted-foreground">{age} y/o · {PATIENT.sex} · {PATIENT.heightCm} cm · {PATIENT.weightKg} kg · BMI {PATIENT.bmi}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Primary Diagnosis</p><p className="font-medium">{PATIENT.primaryDiagnosis}</p></div>
          <div><p className="text-xs text-muted-foreground">Diagnosis Date</p><p className="font-medium">{PATIENT.diagnosisDate}</p></div>
          <div><p className="text-xs text-muted-foreground">Myopathy</p><p className="font-medium">{PATIENT.hasMyopathy ? "Yes" : "No"}</p></div>
          <div><p className="text-xs text-muted-foreground">Sick Sinus</p><p className="font-medium">{PATIENT.hasSickSinus ? "Yes" : "No"}</p></div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Diagnoses</h3>
        <div className="space-y-2">
          {DIAGNOSES.map((d, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{d.diagnosis}</p>
                {d.notedDate && <p className="text-xs text-muted-foreground">{d.notedDate}</p>}
                {d.notes && <p className="text-xs text-muted-foreground italic">{d.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Allergies</h3>
        {ALLERGIES.map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">{a.allergen}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

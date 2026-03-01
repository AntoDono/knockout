"use client";
import { useState } from "react";
import { useFetch } from "@/lib/api";
import { User, AlertCircle } from "lucide-react";
import type { Patient, Diagnosis, Allergy } from "@/lib/types";

interface PatientResponse extends Patient {
  diagnoses: Diagnosis[];
  allergies: Allergy[];
}

export function PatientInfo() {
  const [now] = useState(() => Date.now());
  const { data } = useFetch<PatientResponse>("/patient");

  if (!data) {
    return <div className="space-y-6 animate-pulse"><div className="h-48 rounded-2xl bg-muted" /><div className="h-64 rounded-2xl bg-muted" /></div>;
  }

  const age = Math.floor(
    (now - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{data.firstName} {data.lastName}</h2>
            <p className="text-sm text-muted-foreground">{age} y/o · {data.sex} · {data.heightCm} cm · {data.weightKg} kg · BMI {data.bmi}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Primary Diagnosis</p><p className="font-medium">{data.primaryDiagnosis}</p></div>
          <div><p className="text-xs text-muted-foreground">Diagnosis Date</p><p className="font-medium">{data.diagnosisDate}</p></div>
          <div><p className="text-xs text-muted-foreground">Myopathy</p><p className="font-medium">{data.hasMyopathy ? "Yes" : "No"}</p></div>
          <div><p className="text-xs text-muted-foreground">Sick Sinus</p><p className="font-medium">{data.hasSickSinus ? "Yes" : "No"}</p></div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Diagnoses</h3>
        <div className="space-y-2">
          {(data.diagnoses ?? []).map((d, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
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
        {(data.allergies ?? []).map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">{a.allergen}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

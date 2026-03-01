"use client";

import { Heart } from "@phosphor-icons/react";

export function PatientCard() {
  return (
    <div className="rounded-[20px] bg-white p-3 shadow-[0_4px_20px_rgba(56,189,248,0.08)]">
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        <Heart size={14} weight="duotone" className="text-sky-500" />
        Patient
      </p>
      <p className="text-lg font-semibold text-zinc-800">Lily</p>
      <p className="mt-0.5 text-xs text-zinc-600">TKOS · ICD: Yes</p>
    </div>
  );
}

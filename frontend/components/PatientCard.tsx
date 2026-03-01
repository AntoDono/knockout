"use client";

import { User, Heart } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PatientCard() {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50">
          <User size={18} weight="bold" className="text-sky-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-900">Dishita Agarwal</p>
          <p className="text-xs text-slate-500">19 y/o · TKOS</p>
        </div>
        <Badge variant="secondary" className="gap-1 bg-sky-50 text-sky-700">
          <Heart size={12} weight="fill" className="text-sky-500" />
          ICD
        </Badge>
      </CardContent>
    </Card>
  );
}

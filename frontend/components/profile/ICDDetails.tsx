"use client";
import { useFetch } from "@/lib/api";
import { Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ICDDevice, ICDZone, ShockEvent } from "@/lib/types";

interface ICDResponse {
  device: ICDDevice;
  zones: ICDZone[];
  shockHistory: ShockEvent[];
}

export function ICDDetails() {
  const { data } = useFetch<ICDResponse>("/patient/icd");

  if (!data) {
    return <div className="space-y-6 animate-pulse"><div className="h-48 rounded-2xl bg-muted" /><div className="h-32 rounded-2xl bg-muted" /></div>;
  }

  const device = data.device;
  const zones = data.zones ?? [];
  const shocks = data.shockHistory ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">ICD Device</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Manufacturer</p><p className="font-medium">{device.manufacturer}</p></div>
          <div><p className="text-xs text-muted-foreground">Model</p><p className="font-medium">{device.model}</p></div>
          <div><p className="text-xs text-muted-foreground">Implant Date</p><p className="font-medium">{device.implantDate}</p></div>
          <div><p className="text-xs text-muted-foreground">Pacing Mode</p><p className="font-medium">{device.pacingMode}</p></div>
          <div><p className="text-xs text-muted-foreground">Lower Rate</p><p className="font-medium">{device.lowerRateLimitBpm} bpm</p></div>
          <div><p className="text-xs text-muted-foreground">Battery</p><p className="font-medium">{device.batteryStatus} ({device.batteryLifeYears}y)</p></div>
          <div><p className="text-xs text-muted-foreground">Atrial Pacing</p><p className="font-medium">{device.atrialPacingPct}%</p></div>
          <div><p className="text-xs text-muted-foreground">Last Interrogation</p><p className="font-medium">{device.lastInterrogationDate}</p></div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Programmed Zones</h3>
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.zoneName} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-semibold">{zone.zoneName}</p>
                <p className="text-xs text-muted-foreground">{zone.notes}</p>
              </div>
              <Badge variant="outline">{zone.rateCutoffBpm} bpm</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Shock History</h3>
        </div>
        <div className="space-y-3">
          {shocks.map((s, i) => (
            <div key={i} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{s.eventDate}</p>
                <Badge variant="outline" className="text-xs">{s.eventType}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.context}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

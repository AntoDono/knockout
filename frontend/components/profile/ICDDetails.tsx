import { ICD_DEVICE, ICD_ZONES, SHOCK_HISTORY } from "@/lib/data/synthetic";
import { Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ICDDetails() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">ICD Device</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Manufacturer</p><p className="font-medium">{ICD_DEVICE.manufacturer}</p></div>
          <div><p className="text-xs text-muted-foreground">Model</p><p className="font-medium">{ICD_DEVICE.model}</p></div>
          <div><p className="text-xs text-muted-foreground">Implant Date</p><p className="font-medium">{ICD_DEVICE.implantDate}</p></div>
          <div><p className="text-xs text-muted-foreground">Pacing Mode</p><p className="font-medium">{ICD_DEVICE.pacingMode}</p></div>
          <div><p className="text-xs text-muted-foreground">Lower Rate</p><p className="font-medium">{ICD_DEVICE.lowerRateLimitBpm} bpm</p></div>
          <div><p className="text-xs text-muted-foreground">Battery</p><p className="font-medium">{ICD_DEVICE.batteryStatus} ({ICD_DEVICE.batteryLifeYears}y)</p></div>
          <div><p className="text-xs text-muted-foreground">Atrial Pacing</p><p className="font-medium">{ICD_DEVICE.atrialPacingPct}%</p></div>
          <div><p className="text-xs text-muted-foreground">Last Interrogation</p><p className="font-medium">{ICD_DEVICE.lastInterrogationDate}</p></div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Programmed Zones</h3>
        <div className="space-y-3">
          {ICD_ZONES.map((zone) => (
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
          {SHOCK_HISTORY.map((s, i) => (
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

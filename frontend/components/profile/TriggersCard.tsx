import { TRIGGERS } from "@/lib/data/synthetic";
import { Badge } from "@/components/ui/badge";

export function TriggersCard() {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Known Triggers</h3>
      <div className="space-y-3">
        {TRIGGERS.map((t, i) => (
          <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-muted/30">
            <div>
              <p className="text-sm font-medium">{t.triggerType}</p>
              <p className="text-xs text-muted-foreground">{t.notes}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Source: {t.source}</p>
            </div>
            <Badge variant={t.confidence === "documented" ? "default" : t.confidence === "patient_reported" ? "secondary" : "outline"} className="text-xs flex-shrink-0 ml-3">
              {t.confidence.replace("_", " ")}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

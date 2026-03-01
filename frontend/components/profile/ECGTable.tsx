import { ECG_READINGS } from "@/lib/data/synthetic";
import { cn } from "@/lib/utils";

export function ECGTable() {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm overflow-x-auto">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        ECG History ({ECG_READINGS.length} readings)
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground uppercase tracking-wide">
            <th className="text-left pb-3 pr-4">Date</th>
            <th className="text-right pb-3 px-2">HR</th>
            <th className="text-right pb-3 px-2">PR</th>
            <th className="text-right pb-3 px-2">QRS</th>
            <th className="text-right pb-3 px-2">QT</th>
            <th className="text-right pb-3 px-2">QTc</th>
            <th className="text-left pb-3 pl-4">Notes</th>
          </tr>
        </thead>
        <tbody>
          {ECG_READINGS.map((ecg) => (
            <tr key={ecg.readingDate} className={cn("border-t border-border/50", ecg.isAnomalous && "bg-red-50")}>
              <td className="py-2.5 pr-4 font-medium">{ecg.readingDate}</td>
              <td className="py-2.5 px-2 text-right">{ecg.hrBpm}</td>
              <td className="py-2.5 px-2 text-right">{ecg.prMs}</td>
              <td className={cn("py-2.5 px-2 text-right", ecg.qrsMs > 100 && "text-red-600 font-semibold")}>{ecg.qrsMs}</td>
              <td className="py-2.5 px-2 text-right">{ecg.qtMs}</td>
              <td className={cn("py-2.5 px-2 text-right", ecg.qtcMs > 500 && "text-red-600 font-semibold")}>{ecg.qtcMs}</td>
              <td className="py-2.5 pl-4 text-xs text-muted-foreground max-w-[200px] truncate">{ecg.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { AlertTriangle } from "lucide-react";

interface TriggerTagProps {
  triggerType: string;
  source: string;
}

export function TriggerTag({ triggerType, source }: TriggerTagProps) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
      title={`Source: ${source}`}
    >
      <AlertTriangle className="h-2.5 w-2.5" />
      {triggerType}
    </span>
  );
}

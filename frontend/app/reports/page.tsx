import { ReportBuilder } from "@/components/reports/ReportBuilder";

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate structured PDF reports for your care team</p>
      </div>
      <ReportBuilder />
    </div>
  );
}

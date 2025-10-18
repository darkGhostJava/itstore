import { StatsCards } from "@/components/dashboard/stats-cards";
import { OperationsChart } from "@/components/dashboard/operations-chart";
import { RecentOperations } from "@/components/dashboard/recent-operations";
import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" />
      <StatsCards />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OperationsChart />
        </div>
        <div className="lg:col-span-1">
          <RecentOperations />
        </div>
      </div>
    </div>
  );
}

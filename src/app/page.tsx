import { Suspense } from "react";
import { StatsCards, StatsCardsSkeleton } from "@/components/dashboard/stats-cards";
import { OperationsChart, OperationsChartSkeleton } from "@/components/dashboard/operations-chart";
import { RecentOperations, RecentOperationsSkeleton } from "@/components/dashboard/recent-operations";
import { PageHeader } from "@/components/shared/page-header";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" />
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <Suspense fallback={<OperationsChartSkeleton />}>
            <OperationsChart />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<RecentOperationsSkeleton />}>
            <RecentOperations />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

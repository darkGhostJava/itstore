
import { Suspense } from "react";
import { StatsCards, StatsCardsSkeleton } from "@/components/dashboard/stats-cards";
import { OperationsChart, OperationsChartSkeleton } from "@/components/dashboard/operations-chart";
import { RecentOperations, RecentOperationsSkeleton } from "@/components/dashboard/recent-operations";
import { PageHeader } from "@/components/shared/page-header";
import { ArticleDistributionChart, ArticleDistributionChartSkeleton } from "@/components/dashboard/article-distribution-chart";
import { ArticleStatsCards, ArticleStatsCardsSkeleton } from "@/components/dashboard/article-stats-cards";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" />
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">In-Stock Designations</h2>
        <ArticleStatsCards />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <Suspense fallback={<ArticleDistributionChartSkeleton />}>
            <ArticleDistributionChart />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
           <Suspense fallback={<RecentOperationsSkeleton />}>
            <RecentOperations />
          </Suspense>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8">
        <div className="lg:col-span-2">
           <Suspense fallback={<OperationsChartSkeleton />}>
            <OperationsChart />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

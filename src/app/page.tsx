
"use client";

import { Suspense } from "react";
import { StatsCards, StatsCardsSkeleton } from "@/components/dashboard/stats-cards";
import { OperationsChart, OperationsChartSkeleton } from "@/components/dashboard/operations-chart";
import { RecentOperations, RecentOperationsSkeleton } from "@/components/dashboard/recent-operations";
import { PageHeader } from "@/components/shared/page-header";
import { ArticleDistributionChart, ArticleDistributionChartSkeleton } from "@/components/dashboard/article-distribution-chart";
import { ArticleStatsCards } from "@/components/dashboard/article-stats-cards";
import AuthGuard from "@/components/providers/auth-guard";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation('common');
  
  return (
    <AuthGuard>
      <div className="flex flex-col gap-8">
        <PageHeader title={t('dashboard')} />
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">{t('in_stock_hardware')}</h2>
          <ArticleStatsCards type="hardware" />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">{t('in_stock_consumables')}</h2>
          <ArticleStatsCards type="consumable" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Suspense fallback={<ArticleDistributionChartSkeleton />}>
              <ArticleDistributionChart type="hardware" />
            </Suspense>
            <Suspense fallback={<ArticleDistributionChartSkeleton />}>
              <ArticleDistributionChart type="consumable" />
            </Suspense>
        </div>


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
      </AuthGuard>
  );
}

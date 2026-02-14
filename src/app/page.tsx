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
import { StructureDistributionWrapper } from "@/components/dashboard/structure-distribution-charts";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function DashboardPage() {
  const { t } = useTranslation('common');
  
  return (
    <AuthGuard>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-8 pb-10"
      >
        <motion.div variants={item}>
          <PageHeader title={t('dashboard')} />
        </motion.div>

        {/* Top Row: General Stats Bento */}
        <motion.div variants={item}>
          <Suspense fallback={<StatsCardsSkeleton />}>
            <StatsCards />
          </Suspense>
        </motion.div>

        {/* Second Row: Specific Stock Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div variants={item} className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">{t('in_stock_hardware')}</h2>
            <ArticleStatsCards type="hardware" />
          </motion.div>

          <motion.div variants={item} className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">{t('in_stock_consumables')}</h2>
            <ArticleStatsCards type="consumable" />
          </motion.div>
        </div>

        {/* Third Row: Structure Distribution (Large Bento Widget) */}
        <motion.div variants={item} className="p-1 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <Suspense fallback={<>
            <div className="flex items-center justify-between px-4 py-2">
              <h2 className="text-2xl font-semibold tracking-tight">Distribution by Structure</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 p-4">
              <div className="h-64 w-full bg-muted animate-pulse rounded-lg" />
              <div className="h-64 w-full bg-muted animate-pulse rounded-lg" />
              <div className="h-64 w-full bg-muted animate-pulse rounded-lg" />
            </div>
          </>}>
              <div className="p-4 bg-background/40 backdrop-blur-sm rounded-2xl border border-border/50">
                <StructureDistributionWrapper />
              </div>
          </Suspense>
        </motion.div>

        {/* Fourth Row: Charts Bento */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <motion.div variants={item}>
              <Suspense fallback={<ArticleDistributionChartSkeleton />}>
                <ArticleDistributionChart type="hardware" />
              </Suspense>
            </motion.div>
            <motion.div variants={item}>
              <Suspense fallback={<ArticleDistributionChartSkeleton />}>
                <ArticleDistributionChart type="consumable" />
              </Suspense>
            </motion.div>
        </div>

        {/* Bottom Row: Activity & Detailed History Bento */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <motion.div variants={item} className="lg:col-span-8 h-full">
            <Suspense fallback={<OperationsChartSkeleton />}>
              <OperationsChart />
            </Suspense>
          </motion.div>
          <motion.div variants={item} className="lg:col-span-4 h-full">
            <Suspense fallback={<RecentOperationsSkeleton />}>
              <RecentOperations />
            </Suspense>
          </motion.div>
        </div>
      </motion.div>
      </AuthGuard>
  );
}
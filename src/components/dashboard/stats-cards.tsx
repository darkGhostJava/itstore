
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Boxes, ArrowRightLeft, Wrench, ShieldCheck, ArchiveX } from "lucide-react";
import { getStats } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { Stats } from "@/lib/definitions";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function StatsCards() {
  const [statsData, setStatsData] = useState<Stats | null>(null);
  const { t } = useTranslation('common');

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getStats();
      setStatsData(data);
    };

    fetchStats();
  }, []);

  // Still loading?
  if (!statsData) return <StatsCardsSkeleton />;

  const stats = [
    { title: t("total_articles"), value: statsData.totalArticles, icon: Package },
    { title: t("items_in_stock"), value: statsData.itemsInStock, icon: Boxes },
    { title: t("distributed_items"), value: statsData.distributedItems, icon: ArrowRightLeft },
    { title: t("under_repair"), value: statsData.underRepair, icon: Wrench },
    { title: t("repaired"), value: statsData.repaired, icon: ShieldCheck },
    { title: t("reformed"), value: statsData.reformed, icon: ArchiveX },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

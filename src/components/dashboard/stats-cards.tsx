"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Boxes, ArrowRightLeft, Wrench, ShieldCheck, ArchiveX } from "lucide-react";
import { getStats } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { Stats } from "@/lib/definitions";
import { motion } from "framer-motion";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function StatsCards() {
  const [statsData, setStatsData] = useState<Stats | null>(null);
  const { t } = useTranslation('common');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStatsData(data);
      } catch (e) {
        console.error("Stats load failed", e);
      }
    };

    fetchStats();
  }, []);

  if (!statsData) return <StatsCardsSkeleton />;

  const stats = [
    { title: t("total_articles"), value: statsData.totalArticles, icon: Package, color: "text-blue-500" },
    { title: t("items_in_stock"), value: statsData.itemsInStock, icon: Boxes, color: "text-green-500" },
    { title: t("distributed_items"), value: statsData.distributedItems, icon: ArrowRightLeft, color: "text-amber-500" },
    { title: t("under_repair"), value: statsData.underRepair, icon: Wrench, color: "text-red-500" },
    { title: t("repaired"), value: statsData.repaired, icon: ShieldCheck, color: "text-emerald-500" },
    { title: t("reformed"), value: statsData.reformed, icon: ArchiveX, color: "text-gray-500" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.title}
          whileHover={{ y: -5 }}
          className="h-full"
        >
          <Card className="glass-card h-full border-none bg-card/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-80`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="glass-card bg-card/40 border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
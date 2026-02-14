"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Boxes } from "lucide-react";
import { getArticlesInStockCons, getArticlesInStockMateriel } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface ArticleStatsCardsProps {
  type: "hardware" | "consumable";
}

export function ArticleStatsCards({ type }: ArticleStatsCardsProps) {
  const { t } = useTranslation('common');
  const [statsData, setStatsData] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data =
          type === "hardware"
            ? await getArticlesInStockMateriel()
            : await getArticlesInStockCons();
        setStatsData(data);
      } catch (error) {
        console.error(`Failed to fetch ${type} stats:`, error);
        setStatsData({}); 
      }
    };

    fetchStats();
  }, [type]);

  if (!statsData) return <ArticleStatsCardsSkeleton />;

  const designations = Object.entries(statsData).map(([rawTitle, value]) => ({
    rawTitle,
    title: t(`category_${rawTitle.toLowerCase()}` as any, rawTitle.replace(/_/g, " ")),
    value,
    icon: type === "hardware" ? HardDrive : Boxes,
  }));

  const linkHref = type === 'hardware' ? '/hardware' : '/stock';

  if (designations.length === 0) {
    return (
      <Card className="glass-card border-none bg-card/40">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('no_in_stock_items_title', { context: type })}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {t('no_in_stock_items_desc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {designations.slice(0, 6).map((stat) => (
        <motion.div
          key={stat.rawTitle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link href={`${linkHref}?query=${encodeURIComponent(stat.rawTitle)}`}>
            <Card className="glass-card border-none bg-card/40 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
                <CardTitle className="text-[10px] uppercase font-bold tracking-tight text-muted-foreground truncate">{stat.title}</CardTitle>
                <stat.icon className="h-3 w-3 text-primary/60" />
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export function ArticleStatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="glass-card border-none bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-3" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <Skeleton className="h-6 w-8" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Boxes } from "lucide-react";
import { getArticlesInStockCons, getArticlesInStockMateriel } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

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
        setStatsData({}); // Set to empty object on error
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
      <Card>
        <CardHeader>
          <CardTitle>{t('no_in_stock_items_title', { context: type })}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('no_in_stock_items_desc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {designations.map((stat) => (
        <Link
          key={stat.rawTitle}
          href={`${linkHref}?query=${encodeURIComponent(stat.rawTitle)}`}
          className="hover:shadow-lg transition-shadow rounded-lg"
        >
          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function ArticleStatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="flex flex-col">
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

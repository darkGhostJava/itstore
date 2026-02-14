"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getArticlesInStockCons, getArticlesInStockMateriel } from "@/lib/data";
import { useTheme } from "next-themes";
import { Skeleton } from "../ui/skeleton";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface ArticleDistributionChartProps {
  type: "hardware" | "consumable";
}

export function ArticleDistributionChart({ type }: ArticleDistributionChartProps) {
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const router = useRouter();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const title = type === "hardware" ? t('in_stock_hardware') : t('in_stock_consumables');
  const description = type === 'hardware' ? t('in_stock_hardware_desc') : t('in_stock_consumables_desc');
  const linkHref = type === 'hardware' ? '/hardware' : '/stock';

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const fetcher = type === 'hardware' ? getArticlesInStockMateriel : getArticlesInStockCons;
        const designationCounts: Record<string, number> = await fetcher();

        const data = Object.entries(designationCounts)
          .map(([name, value]) => ({
            rawName: name,
            name: t(`category_${name.toLowerCase()}` as any, name.replace(/_/g, " ")),
            value,
          }))
          .sort((a, b) => b.value - a.value); 

        setChartData(data);
      } catch (error) {
        console.error(`Failed to fetch ${type} for chart:`, error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [type, t]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload) {
      const payload = data.activePayload[0].payload;
      if (payload.rawName) {
        router.push(`${linkHref}?query=${encodeURIComponent(payload.rawName)}`);
      }
    }
  };
  
  const barColor = theme === 'dark' ? 'hsl(var(--primary))' : 'hsl(var(--primary))';
  const labelColor = theme === 'dark' ? '#f8fafc' : '#1e293b';

  if (loading) {
    return <ArticleDistributionChartSkeleton title={title} description={description} />;
  }

  return (
    <Card className="glass-card border-none bg-card/40 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ left: -20, right: 10, top: 20, bottom: 5 }} onClick={handleBarClick}>
             <XAxis 
              dataKey="name"
              stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={40}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(var(--primary), 0.1)', radius: 4 }}
              contentStyle={{
                backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                border: '1px solid rgba(var(--border), 0.2)',
                backdropFilter: 'blur(8px)',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                <LabelList dataKey="value" position="top" fill={labelColor} fontSize={10} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ArticleDistributionChartSkeletonProps {
  title?: string;
  description?: string;
}

export function ArticleDistributionChartSkeleton({ title = "Loading...", description = "Fetching data..." }: ArticleDistributionChartSkeletonProps) {
  return (
    <Card className="glass-card border-none bg-card/40">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}
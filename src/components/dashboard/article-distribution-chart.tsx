
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

interface ArticleDistributionChartProps {
  type: "hardware" | "consumable";
}

export function ArticleDistributionChart({ type }: ArticleDistributionChartProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const title = type === "hardware" ? "Hardware Inventory" : "Consumable Inventory";
  const description = type === 'hardware' ? "In-stock hardware count by designation" : "In-stock consumable count by designation";
  const linkHref = type === 'hardware' ? '/hardware' : '/consumables';

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const fetcher = type === 'hardware' ? getArticlesInStockMateriel : getArticlesInStockCons;
        const designationCounts: Record<string, number> = await fetcher();

        const data = Object.entries(designationCounts)
          .map(([name, value]) => ({
            name,
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
  }, [type]);

  const handleBarClick = (data: any) => {
    if (data && data.name) {
      router.push(`${linkHref}?query=${encodeURIComponent(data.name)}`);
    }
  };

  const barColor = theme === 'dark' ? '#90CAF9' : '#1E88E5';
  const labelColor = theme === 'dark' ? '#f8fafc' : '#1e293b';

  if (loading) {
    return <ArticleDistributionChartSkeleton title={title} description={description} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ left: 0, right: 20, top: 20, bottom: 5 }}>
             <XAxis 
              dataKey="name"
              stroke={theme === 'dark' ? '#f8fafc' : '#1e293b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke={theme === 'dark' ? '#f8fafc' : '#1e293b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={30}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#020817' : '#ffffff',
                border: '1px solid #334155'
              }}
               cursor={{ fill: theme === 'dark' ? '#334155' : '#e2e8f0', cursor: 'pointer' }}
            />
            <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]} onClick={handleBarClick} className="cursor-pointer">
                <LabelList dataKey="value" position="top" fill={labelColor} fontSize={12} />
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[350px] w-full" />
      </CardContent>
    </Card>
  );
}

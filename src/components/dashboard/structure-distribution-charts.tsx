
"use client";

import { useState, useEffect, useMemo } from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import { getStructureDistributionStats } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { DateRange } from "react-day-picker";
import { add, format, startOfMonth, subMonths } from "date-fns";

const CHART_COLORS = {
  light: ["#90CAF9", "#80CBC4", "#FFE082", "#F48FB1", "#CE93D8", "#BCAAA4", "#B0BEC5", "#FFAB91"],
  dark: ["#1E88E5", "#00897B", "#FFB300", "#D81B60", "#8E24AA", "#6D4C41", "#546E7A", "#F4511E"],
};

export function StructureDistributionWrapper() {
  const { t } = useTranslation("common");

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: new Date(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{t('structure_distribution_title', 'Distribution by Structure')}</h2>
        <DateRangePicker date={dateRange} setDate={setDateRange} />
      </div>
      <StructureDistributionCharts dateRange={dateRange} />
    </div>
  );
}


export function StructureDistributionCharts({ dateRange }: { dateRange?: DateRange }) {
  const { t } = useTranslation("common");
  const { theme } = useTheme();
  const [rawData, setRawData] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  
  const colors = theme === 'dark' ? CHART_COLORS.dark : CHART_COLORS.light;

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const params: { from?: string; to?: string } = {};
        if (dateRange?.from) {
          params.from = format(dateRange.from, "yyyy-MM-dd'T'HH:mm:ss");
        }
        if (dateRange?.to) {
          params.to = format(add(dateRange.to, { days: 1 }), "yyyy-MM-dd'T'HH:mm:ss");
        }
        const data = await getStructureDistributionStats(params);
        setRawData(data);
      } catch (error) {
        console.error("Failed to fetch structure distribution stats:", error);
        setRawData({});
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [dateRange]);

  const structureCharts = useMemo(() => {
    return Object.entries(rawData).map(([structureName, distribution]) => {
      const chartData = Object.entries(distribution).map(([name, value]) => ({
        name: t(`category_${name.toLowerCase().replace(/ /g, "_")}` as any, name),
        value: value,
        fill: "var(--color-fill)",
      }));
      
      const chartConfig = chartData.reduce((acc, entry, index) => {
        acc[entry.name] = {
          label: entry.name,
          color: colors[index % colors.length],
        };
        return acc;
      }, {} as ChartConfig);

      const totalItems = chartData.reduce((sum, item) => sum + item.value, 0);

      return {
        structureName,
        chartData,
        chartConfig,
        totalItems,
      };
    });
  }, [rawData, t, colors]);

  if (loading) {
    return <StructureDistributionChartsSkeleton />;
  }

  if (Object.keys(rawData).length === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>{t('structure_distribution_title', 'Distribution by Structure')}</CardTitle>
          <CardDescription>{t('structure_distribution_desc', 'Article distribution across different structures.')}</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-center py-12">{t('no_distribution_data', 'No distribution data available for the selected period.')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
       <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {structureCharts.map(({ structureName, chartData, chartConfig, totalItems }) => (
          <Card key={structureName} className="flex flex-col">
            <CardHeader>
              <CardTitle>{structureName}</CardTitle>
              <CardDescription>
                {t('total_distributed_items', 'Total distributed items: {{count}}', { count: totalItems })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              {totalItems > 0 ? (
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square h-full w-full"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} label>
                       {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">{t('no_items_for_structure', 'No items distributed to this structure.')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
  );
}

export function StructureDistributionChartsSkeleton() {
  return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <div className="mx-auto aspect-square h-full w-full">
                <Skeleton className="h-full w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
  );
}

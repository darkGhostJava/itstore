"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAllOperations } from "@/lib/data";
import type { Operation } from "@/lib/definitions";
import { useTheme } from "next-themes";
import { Skeleton } from "../ui/skeleton";
import { useTranslation } from "react-i18next";

export function OperationsChart() {
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const operations: Operation[] = await fetchAllOperations();
        const operationCounts = operations.reduce((acc, op) => {
          acc[op.type] = (acc[op.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const data = Object.entries(operationCounts).map(([name, total]) => ({
          name,
          total,
        }));
        setChartData(data);
      } catch (error) {
        console.error("Failed to fetch operations for chart:", error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const currentColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];
  
  if (loading) {
    return <OperationsChartSkeleton />;
  }

  return (
    <Card className="glass-card border-none bg-card/40 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('operations_overview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontWeight="medium"
            />
            <YAxis
              stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(var(--primary), 0.05)', radius: 4 }}
              contentStyle={{
                backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                border: '1px solid rgba(var(--border), 0.2)',
                backdropFilter: 'blur(8px)',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="total" label={{ position: 'top', fontSize: 10, fill: 'currentColor', fontWeight: 'bold' }} radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={currentColors[index % currentColors.length]} 
                  fillOpacity={0.8}
                  className="hover:fill-opacity-100 transition-all duration-300"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function OperationsChartSkeleton() {
    const { t } = useTranslation('common');
  return (
    <Card className="glass-card border-none bg-card/40 h-full">
      <CardHeader>
        <CardTitle>{t('operations_overview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[350px] w-full" />
      </CardContent>
    </Card>
  );
}
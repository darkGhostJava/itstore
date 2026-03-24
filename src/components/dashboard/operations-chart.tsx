
"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
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
  const [total, setTotal] = useState(0);
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

        const data = Object.entries(operationCounts).map(([name, value]) => ({
          name: t(name.toLowerCase() as any, name),
          value,
        }));
        
        setChartData(data);
        setTotal(operations.length);
      } catch (error) {
        console.error("Failed to fetch operations for chart:", error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [t]);

  const COLORS = [
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
      <CardContent className="flex flex-col items-center justify-center relative min-h-[350px]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0 mt-[-20px]">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
          <p className="text-3xl font-black">{total}</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: '8px',
                border: '1px solid rgba(var(--border), 0.2)',
                backdropFilter: 'blur(8px)',
                fontSize: '12px'
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">{value}</span>}
            />
          </PieChart>
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
        <Skeleton className="h-[350px] w-full rounded-full mx-auto max-w-[250px]" />
      </CardContent>
    </Card>
  );
}

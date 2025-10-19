"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOperations } from "@/lib/data";
import { useTheme } from "next-themes";
import { Skeleton } from "../ui/skeleton";

export function OperationsChart() {
  const { theme } = useTheme();
  
  const operationCounts = mockOperations.reduce((acc, op) => {
    acc[op.type] = (acc[op.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(operationCounts).map(([name, total]) => ({
    name,
    total,
  }));

  const colors = {
    light: {
      text: "#1e293b", // slate-800
      fill: "#90CAF9", // primary
    },
    dark: {
      text: "#f8fafc", // slate-50
      fill: "#90CAF9", // primary
    },
  };
  
  const currentColors = theme === 'dark' ? colors.dark : colors.light;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operations Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              stroke={currentColors.text}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={currentColors.text}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
             <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#020817' : '#ffffff',
                border: '1px solid #334155'
              }}
              cursor={{ fill: theme === 'dark' ? '#334155' : '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: currentColors.text }} />
            <Bar dataKey="total" fill={currentColors.fill} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function OperationsChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Operations Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[350px] w-full" />
            </CardContent>
        </Card>
    );
}

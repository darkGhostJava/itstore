
"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAllOperations } from "@/lib/data";
import type { Operation } from "@/lib/definitions";
import { useTheme } from "next-themes";
import { Skeleton } from "../ui/skeleton";

// Define colors for each operation type
const getPath = (x: number, y: number, width: number, height: number) => {
  return `M${x},${y + height}C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3}
  ${x + width / 2}, ${y}
  C${x + width / 2},${y + height / 3} ${x + (2 * width) / 3},${y + height} ${x + width}, ${y + height}
  Z`;
};

const TriangleBar = (props: any) => {
  const { fill, x, y, width, height } = props;

  return <path d={getPath(x, y, width, height)} stroke="none" fill={fill} />;
};


export function OperationsChart() {
  const { theme } = useTheme();
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

  const colors = {
    light: ["#90CAF9", "#80CBC4", "#FFE082", "#F48FB1", "#CE93D8"],
    dark: ["#90CAF9", "#80CBC4", "#FFE082", "#F48FB1", "#CE93D8"],
  };

  const currentColors = theme === 'dark' ? colors.dark : colors.light;
  
  if (loading) {
    return <OperationsChartSkeleton />;
  }

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
              stroke={theme === 'dark' ? '#f8fafc' : '#1e293b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={theme === 'dark' ? '#f8fafc' : '#1e293b'}
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
            <Bar dataKey="total" label={{ position: 'top' }} fill="#8884d8" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={currentColors[index % currentColors.length]} />
              ))}
            </Bar>
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

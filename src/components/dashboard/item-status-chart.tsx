
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
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { fetchAllItems } from "@/lib/data";
import { useTheme } from "next-themes";
import { Skeleton } from "../ui/skeleton";
import { Item } from "@/lib/definitions";

export function ItemStatusChart() {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const items: Item[] = await fetchAllItems();

        const statusCounts = items.reduce((acc, item) => {
          const status = item.status.replace(/_/g, " ");
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);


        const data = Object.entries(statusCounts)
          .map(([name, value]) => ({
            name,
            value,
          }))
          .sort((a, b) => b.value - a.value); 

        setChartData(data);
      } catch (error) {
        console.error("Failed to fetch items for status chart:", error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const colors = {
    light: ["#1E88E5", "#80CBC4", "#FFD54F", "#F06292", "#CE93D8", "#90CAF9"],
    dark: ["#90CAF9", "#80CBC4", "#FFE082", "#F48FB1", "#CE93D8", "#1E88E5"],
  };
  
  const currentColors = theme === 'dark' ? colors.dark : colors.light;

  const labelColor = theme === 'dark' ? '#f8fafc' : '#1e293b';

  if (loading) {
    return <ItemStatusChartSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Item Status Overview</CardTitle>
        <CardDescription>Total count of items by their current status</CardDescription>
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
               cursor={{ fill: theme === 'dark' ? '#334155' : '#e2e8f0' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" fill={labelColor} fontSize={12} />
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

export function ItemStatusChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Item Status Overview</CardTitle>
        <CardDescription>Total count of items by their current status</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[350px] w-full" />
      </CardContent>
    </Card>
  );
}

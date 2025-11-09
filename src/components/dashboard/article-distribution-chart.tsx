"use client";

import { useState, useEffect } from "react";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAllArticles } from "@/lib/data";
import type { Article } from "@/lib/definitions";
import { useTheme } from "next-themes";
import { Skeleton } from "../ui/skeleton";

export function ArticleDistributionChart() {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const { data: articles }: { data: Article[] } = await getAllArticles();
        const designationCounts = articles.reduce((acc, article) => {
          const designation = article.designation;
          acc[designation] = (acc[designation] || 0) + article.quantity;
          return acc;
        }, {} as Record<string, number>);

        const data = Object.entries(designationCounts).map(([name, value]) => ({
          name,
          value,
        }));
        setChartData(data);
      } catch (error) {
        console.error("Failed to fetch articles for chart:", error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const colors = {
    light: ["#90CAF9", "#80CBC4", "#FFE082", "#F48FB1", "#CE93D8", "#A5D6A7", "#B39DDB"],
    dark: ["#90CAF9", "#80CBC4", "#FFE082", "#F48FB1", "#CE93D8", "#A5D6A7", "#B39DDB"],
  };

  const currentColors = theme === 'dark' ? colors.dark : colors.light;
  
  if (loading) {
    return <ArticleDistributionChartSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Article Inventory</CardTitle>
        <CardDescription>Item count by designation</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#020817' : '#ffffff',
                border: '1px solid #334155'
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
              outerRadius={80}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={currentColors[index % currentColors.length]} />
              ))}
            </Pie>
            <Legend iconSize={10} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ArticleDistributionChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Article Inventory</CardTitle>
         <CardDescription>Item count by designation</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

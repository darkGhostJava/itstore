
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";
import { getArticlesInStock } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";
import Link from "next/link";

export  function ArticleStatsCards() {
  const [statsData, setStatsData] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getArticlesInStock();
        setStatsData(data);
      } catch (error) {
        console.error("Failed to fetch article stats:", error);
        setStatsData({}); // Set to empty object on error
      }
    };

    fetchStats();
  }, []);

  if (!statsData) return <ArticleStatsCardsSkeleton/>;
  
  const designations = Object.entries(statsData).map(([title, value]) => ({
    title,
    value,
    icon: Package,
  }));

  if (designations.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>No In-Stock Designations</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">There are currently no items in stock.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {designations.map((stat) => (
        <Card key={stat.title} className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href={`/articles?query=${encodeURIComponent(stat.title)}`}>
                View
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
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
          <CardFooter className="mt-auto">
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

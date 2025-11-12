"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { getInStockArticles } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Article } from "@/lib/definitions";
import React from "react";

// This component now shows the count per designation and links to the filtered articles page.
export function ArticleStatsCards() {
  const [designations, setDesignations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const articlesInStock = await getInStockArticles();

        const designationCounts: Record<string, number> = {};

        articlesInStock.forEach(article => {
          if(designationCounts[article.designation]) {
            designationCounts[article.designation] += article.quantity;
          } else {
            designationCounts[article.designation] = article.quantity;
          }
        });

        const designationData = Object.entries(designationCounts).map(([title, value]) => ({
          title,
          value,
          icon: Package,
        }));

        setDesignations(designationData);
      } catch (error) {
        console.error("Failed to fetch article stats:", error);
        setDesignations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <ArticleStatsCardsSkeleton />;
  }

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
        <Link key={stat.title} href={`/articles?designation=${encodeURIComponent(stat.title)}`}>
            <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
            </Card>
        </Link>
      ))}
    </div>
  );
}

export function ArticleStatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

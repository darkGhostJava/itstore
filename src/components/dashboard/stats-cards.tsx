import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Boxes,
  ArrowRightLeft,
  Wrench,
  Building,
  ArchiveX,
} from "lucide-react";
import { getStats } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";

type StatCard = {
  title: string;
  value: number;
  icon: React.ElementType;
};

export async function StatsCards() {
  const statsData = await getStats();

  const stats: StatCard[] = [
    { title: "Total Articles", value: statsData.totalArticles, icon: Package },
    { title: "Items in Stock", value: statsData.itemsInStock, icon: Boxes },
    { title: "Distributed Items", value: statsData.distributedItems, icon: ArrowRightLeft },
    { title: "Under Repair", value: statsData.underRepair, icon: Wrench },
    { title: "Reformed", value: statsData.reformedCount, icon: ArchiveX },
    { title: "Structures", value: statsData.structuresCount, icon: Building },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
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

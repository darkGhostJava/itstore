
"use client";

import { useState, useEffect, useMemo } from "react";
import { Pie, PieChart, Cell, Tooltip, Legend, LegendProps, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getStructureDistributionStats } from "@/lib/data";
import { Skeleton } from "../ui/skeleton";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { DateRange } from "react-day-picker";
import { add, format, startOfMonth, subMonths } from "date-fns";
import { HardDrive, Printer } from "lucide-react";

const CHART_COLORS = {
  light: ["#90CAF9", "#80CBC4", "#FFE082", "#F48FB1", "#CE93D8", "#BCAAA4", "#B0BEC5", "#FFAB91"],
  dark: ["#1E88E5", "#00897B", "#FFB300", "#D81B60", "#8E24AA", "#6D4C41", "#546E7A", "#F4511E"],
};

// Logic classification for Hardware vs Consumables
const HARDWARE_CATEGORIES = [
  "LAPTOP", "PRINTER", "SCREEN", "PC", "WORK_STATION", 
  "INVERTER", "SCANNER", "SERVER", "DATA_SHOW", 
  "WEB_CAM", "MULTIMEDIA", "KEYBOARD", "MOUSE", "SWITCH"
];

const CustomLegend = (props: LegendProps) => {
    const { payload } = props;
    if (!payload) return null;

    return (
        <div className="w-full grid grid-cols-1 gap-y-1 mt-4 text-[10px]">
            {payload.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="truncate text-muted-foreground uppercase tracking-tighter">
                          {entry.value}
                        </span>
                    </div>
                    <span className="font-bold text-foreground">{(entry.payload as any)?.value}</span>
                </div>
            ))}
        </div>
    );
};

export function StructureDistributionWrapper() {
  const { t } = useTranslation("common");

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 3)),
    to: new Date(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('structure_distribution_title')}</h2>
          <p className="text-sm text-muted-foreground">{t('structure_distribution_desc')}</p>
        </div>
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
      const hardwareItems: any[] = [];
      const consumableItems: any[] = [];

      Object.entries(distribution).forEach(([name, value]) => {
        const item = {
          name: t(`category_${name.toLowerCase().replace(/ /g, "_")}` as any, name),
          value: value,
        };

        if (HARDWARE_CATEGORIES.includes(name.toUpperCase())) {
          hardwareItems.push(item);
        } else {
          consumableItems.push(item);
        }
      });
      
      const totalHardware = hardwareItems.reduce((sum, item) => sum + item.value, 0);
      const totalConsumables = consumableItems.reduce((sum, item) => sum + item.value, 0);

      return {
        structureName,
        hardwareItems,
        consumableItems,
        totalHardware,
        totalConsumables,
      };
    });
  }, [rawData, t]);

  if (loading) {
    return <StructureDistributionChartsSkeleton />;
  }

  if (Object.keys(rawData).length === 0) {
    return (
       <Card className="border-dashed bg-muted/10">
        <CardContent>
            <p className="text-muted-foreground text-center py-24">{t('no_distribution_data')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
       <Carousel
        opts={{
            align: "start",
            loop: false,
        }}
        className="w-full px-10"
        >
        <CarouselContent>
            {structureCharts.map(({ structureName, hardwareItems, consumableItems, totalHardware, totalConsumables }) => (
                <CarouselItem key={structureName} className="md:basis-1/2 lg:basis-1/2 xl:basis-1/2">
                    <Card className="flex flex-col h-full glass-card border-none bg-card/40 hover:bg-card/60 transition-all">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xl font-black">{structureName}</CardTitle>
                          <CardDescription className="text-xs uppercase font-bold tracking-widest text-primary/60">
                            {t('detailed_distribution')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col md:flex-row items-start justify-around gap-8 pb-6 pt-4">
                          
                          {/* Hardware Circular Chart */}
                          <div className="flex flex-col items-center flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <HardDrive className="h-3 w-3 text-primary" />
                              {t('hardware')} ({totalHardware})
                            </div>
                            {totalHardware > 0 ? (
                              <div className="w-full flex flex-col items-center">
                                <ResponsiveContainer width="100%" height={140}>
                                  <PieChart>
                                      <Tooltip
                                          contentStyle={{
                                              backgroundColor: theme === 'dark' ? '#020817' : '#ffffff',
                                              border: '1px solid hsl(var(--border))',
                                              borderRadius: '8px',
                                              fontSize: '10px'
                                          }}
                                      />
                                      <Pie 
                                        data={hardwareItems} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={30} 
                                        outerRadius={50} 
                                        labelLine={false} 
                                        paddingAngle={4}
                                      >
                                        {hardwareItems.map((entry, index) => (
                                            <Cell key={`cell-hwd-${index}`} fill={colors[index % colors.length]} stroke="none" />
                                        ))}
                                      </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                                <CustomLegend payload={hardwareItems.map((item, index) => ({
                                  value: item.name,
                                  color: colors[index % colors.length],
                                  payload: item
                                }))} />
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-muted-foreground italic border border-dashed rounded-xl w-full h-[180px] bg-muted/5">
                                <HardDrive className="h-6 w-6 mb-2 opacity-10" />
                                {t('no_items')}
                              </div>
                            )}
                          </div>

                          <div className="hidden md:block w-px bg-border/20 self-stretch" />

                          {/* Consumables Circular Chart */}
                          <div className="flex flex-col items-center flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <Printer className="h-3 w-3 text-accent" />
                              {t('consumable')} ({totalConsumables})
                            </div>
                            {totalConsumables > 0 ? (
                              <div className="w-full flex flex-col items-center">
                                <ResponsiveContainer width="100%" height={140}>
                                  <PieChart>
                                      <Tooltip
                                          contentStyle={{
                                              backgroundColor: theme === 'dark' ? '#020817' : '#ffffff',
                                              border: '1px solid hsl(var(--border))',
                                              borderRadius: '8px',
                                              fontSize: '10px'
                                          }}
                                      />
                                      <Pie 
                                        data={consumableItems} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={30} 
                                        outerRadius={50} 
                                        labelLine={false} 
                                        paddingAngle={4}
                                      >
                                        {consumableItems.map((entry, index) => (
                                            <Cell key={`cell-cons-${index}`} fill={colors[(index + 4) % colors.length]} stroke="none" />
                                        ))}
                                      </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                                <CustomLegend payload={consumableItems.map((item, index) => ({
                                  value: item.name,
                                  color: colors[(index + 4) % colors.length],
                                  payload: item
                                }))} />
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-[10px] text-muted-foreground italic border border-dashed rounded-xl w-full h-[180px] bg-muted/5">
                                <Printer className="h-6 w-6 mb-2 opacity-10" />
                                {t('no_items')}
                              </div>
                            )}
                          </div>
                        </CardContent>
                    </Card>
                </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        </Carousel>
  );
}

export function StructureDistributionChartsSkeleton() {
  return (
      <div className="relative w-full px-10">
        <Carousel>
            <CarouselContent>
            {Array.from({ length: 2 }).map((_, i) => (
                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/2">
                    <div className="p-1">
                        <Card className="flex flex-col h-full p-6 bg-muted/20 border-none">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-8" />
                            <div className="flex flex-row gap-8 justify-around">
                                <div className="flex flex-col items-center gap-4">
                                  <Skeleton className="w-24 h-24 rounded-full" />
                                  <Skeleton className="h-12 w-20" />
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                  <Skeleton className="w-24 h-24 rounded-full" />
                                  <Skeleton className="h-12 w-20" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
      </div>
  );
}

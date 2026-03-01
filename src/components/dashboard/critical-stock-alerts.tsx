"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchItemsInStock } from "@/lib/data";
import { Article } from "@/lib/definitions";
import { AlertTriangle, ChevronRight, PackageX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function CriticalStockAlerts() {
  const { t } = useTranslation('common');
  const [criticalArticles, setCriticalArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAlerts = async () => {
      try {
        setLoading(true);
        // Fetch a large sample or specific endpoint if available to find low stock
        const result = await fetchItemsInStock({ pageIndex: 0, pageSize: 50 });
        const lowStock = result.data.filter(a => a.strategicStock && a.quantity <= a.strategicStock);
        setCriticalArticles(lowStock);
      } catch (error) {
        console.error("Failed to fetch critical stock alerts:", error);
      } finally {
        setLoading(false);
      }
    };
    getAlerts();
  }, []);

  if (loading) return <CriticalStockSkeleton />;
  if (criticalArticles.length === 0) return null;

  return (
    <Card className="border-none shadow-lg overflow-hidden bg-gradient-to-br from-red-500/5 via-background to-amber-500/5 border-l-4 border-l-destructive">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5 animate-pulse" />
          <CardTitle className="text-lg font-bold">{t('critical_stock_title')}</CardTitle>
        </div>
        <CardDescription>{t('critical_stock_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {criticalArticles.map((article, index) => {
              const isOutOfStock = article.quantity === 0;
              const linkHref = article.type === 'HARDWARE' ? '/hardware' : '/stock';
              
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`${linkHref}?query=${encodeURIComponent(article.designation)}`}>
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-md group",
                      isOutOfStock 
                        ? "bg-destructive/10 border-destructive/20 hover:bg-destructive/20" 
                        : "bg-background border-border hover:border-amber-500/50"
                    )}>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground truncate">
                          {article.model}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-lg font-black tracking-tighter",
                            isOutOfStock ? "text-destructive" : "text-amber-600"
                          )}>
                            {isOutOfStock ? t('out_of_stock') : t('low_stock_warning', { count: article.quantity })}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1 opacity-70">
                            {article.type === 'HARDWARE' ? 'HWD' : 'CNS'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-muted-foreground uppercase leading-none">Threshold</p>
                          <p className="font-mono font-bold text-sm leading-tight">{article.strategicStock}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

function CriticalStockSkeleton() {
  return (
    <Card className="border-none shadow-sm bg-muted/20">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </CardContent>
    </Card>
  );
}

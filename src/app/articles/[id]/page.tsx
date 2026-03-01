"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { Item, Article } from "@/lib/definitions";
import { StatusBadge } from "@/components/shared/status-badge";
import { fetchItemsForArticle, fetchArticleById } from "@/lib/data";
import { useTranslation } from "react-i18next";
import { 
  AlertTriangle, 
  Box, 
  History, 
  Info, 
  Layers, 
  Package, 
  ShieldAlert, 
  Tag, 
  TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import Link from "next/link";

const useItemColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<Item>[] = [
    {
      header: "#",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "serialNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('serial_number')} />
      ),
      cell: ({ row }) => (
        <Link href={`/items/${row.original.id}`} className="font-mono text-xs hover:underline">
          {row.original.serialNumber || 'N/A'}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('status')} />
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "budget",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('budget')} />
      ),
      cell: ({ row }) => {
        const budget = row.original.budget;
        if (!budget) return 'N/A';
        return <Badge variant="outline">{t(`budget_${budget.toLowerCase()}` as any, budget)}</Badge>;
      },
    },
  ];

  return columns;
};

export default function ArticleDetailPage() {
  const { t } = useTranslation('common');
  const params = useParams<{ id: string }>();
  const articleId = params.id ? parseInt(params.id, 10) : null;
  
  const [article, setArticle] = React.useState<Article | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoadingArticle, setIsLoadingArticle] = React.useState(true);
  const [isLoadingItems, setIsLoadingItems] = React.useState(true);
  
  const columns = useItemColumns();

  React.useEffect(() => {
    const getArticle = async () => {
      if (!articleId) return;
      try {
        setIsLoadingArticle(true);
        const data = await fetchArticleById(articleId);
        setArticle(data);
      } catch (error) {
        console.error("Failed to fetch article:", error);
        setArticle(null);
      } finally {
        setIsLoadingArticle(false);
      }
    };
    getArticle();
  }, [articleId]);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    if (!articleId) return;
    setIsLoadingItems(true);
    try {
      const result = await fetchItemsForArticle(articleId, { pageIndex, pageSize, query, sort });
      setItems(result.data);
      setPageCount(result.pageCount);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      setItems([]);
      setPageCount(0);
    } finally {
      setIsLoadingItems(false);
    }
  }, [articleId]);

  if (isLoadingArticle) {
    return (
      <div className="flex flex-col gap-8">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-64 bg-muted animate-pulse rounded" />
          <div className="md:col-span-2 h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!article) {
    notFound();
  }

  const isLowStock = article.strategicStock ? article.quantity <= article.strategicStock : false;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title={article.model} 
        actions={
          <Badge variant={article.type === "HARDWARE" ? "default" : "secondary"} className="h-8 px-4 text-sm">
            {t(article.type.toLowerCase() as any)}
          </Badge>
        }
      />

      {isLowStock && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-4">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-bold text-destructive">{t('low_stock_alert', 'Low Stock Alert')}</p>
              <p className="text-sm text-destructive/80">
                {t('low_stock_desc', 'Current stock ({{count}}) has reached or fallen below the strategic threshold ({{threshold}}).', { count: article.quantity, threshold: article.strategicStock })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-card overflow-hidden border-none bg-card/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-primary" />
                {t('specifications', 'Specifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" /> {t('category')}
                </span>
                <span className="font-semibold">{t(`category_${article.category.toLowerCase()}` as any, article.category)}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4" /> {t('designation')}
                </span>
                <span className="font-semibold text-right max-w-[150px] truncate">{article.designation}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" /> {t('current_stock', 'Current Stock')}
                </span>
                <span className={cn("text-xl font-bold", isLowStock ? "text-destructive" : "text-green-600")}>
                  {article.quantity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> {t('strategic_stock')}
                </span>
                <span className="font-mono font-medium">{article.strategicStock || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary/70">{t('quick_stats', 'Stock Snapshot')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold">{article.quantity}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('available_units', 'Total tracked units in system')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                {article.type === 'HARDWARE' ? t('individual_items', 'Individual Items') : t('inventory_details', 'Inventory Details')}
              </CardTitle>
              <CardDescription>
                {article.type === 'HARDWARE' 
                  ? t('hardware_items_desc', 'List of all serial numbers associated with this model.')
                  : t('consumable_items_desc', 'Inventory breakdown for this consumable article.')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={items}
                pageCount={pageCount}
                fetchData={fetchData}
                isLoading={isLoadingItems}
                filterKey="serialNumber" 
                filterPlaceholder={t('filter_by_serial_number_placeholder')}
                emptyStateMessage={
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <History className="h-10 w-10 mb-2" />
                    <p>{t('no_items_found')}</p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

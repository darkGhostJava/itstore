
"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { Item, Operation } from "@/lib/definitions";
import { useOperationsHistoryColumns } from "./item-history-columns";
import { fetchItemById, fetchOperationsForItem } from "@/lib/data";
import { StatusBadge } from "@/components/shared/status-badge";
import { HardDrive, History as HistoryIcon, Calendar, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ItemActions } from "./item-actions";

function ItemHistoryContent() {
  const { t } = useTranslation('common');
  const params = useParams<{ id: string }>();
  const itemId = params.id ? parseInt(params.id, 10) : null;
  
  const [item, setItem] = React.useState<Item | null>(null);
  const [data, setData] = React.useState<Operation[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingItem, setIsLoadingItem] = React.useState(true);
  
  const columns = useOperationsHistoryColumns();

  const getItem = React.useCallback(async () => {
    if (!itemId) return;
    try {
      setIsLoadingItem(true);
      const fetchedItem = await fetchItemById(itemId);
      setItem(fetchedItem);
    } catch (error) {
      console.error("Failed to fetch item:", error);
      setItem(null);
    } finally {
      setIsLoadingItem(false);
    }
  }, [itemId]);

  React.useEffect(() => {
    getItem();
  }, [getItem]);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    if (!itemId) return;
    setIsLoading(true);
    try {
      const result = await fetchOperationsForItem(itemId, { pageIndex, pageSize, query, sort });
      setData(result.data);
      setPageCount(result.pageCount);
    } catch(error) {
      console.error("Failed to fetch operations:", error);
      setData([]);
      setPageCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  const handleActionSuccess = () => {
    getItem(); // Refresh item status
    fetchData({ pageIndex: 0, pageSize: 10 }); // Refresh history
  };

  if (isLoadingItem) {
    return (
      <div className="flex flex-col gap-8 p-8 items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground animate-pulse">{t('loading_details', 'Loading item details...')}</p>
      </div>
    );
  }

  if (!item) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title={`${t('item_history', 'Item History')}: ${item.serialNumber || 'N/A'}`} 
        actions={<ItemActions item={item} onSuccess={handleActionSuccess} />}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-none bg-card/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary">
                <HardDrive className="h-5 w-5" />
                <CardTitle className="text-lg">{t('specifications', 'Specifications')}</CardTitle>
              </div>
              <CardDescription>{t('item_id', 'Item ID')}: #{item.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('article')}</p>
                <p className="font-bold text-sm">{item.article.model}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('designation')}</p>
                <p className="text-sm">
                  {t(`category_${item.article.designation.toLowerCase().replace(/ /g, "_")}` as any, item.article.designation)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('status')}</p>
                <StatusBadge status={item.status} />
              </div>
              {item.budget && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('budget')}</p>
                  <p className="text-sm font-medium">{t(`budget_${item.budget.toLowerCase()}` as any, item.budget)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-none bg-card/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary">
                <Info className="h-5 w-5" />
                <CardTitle className="text-lg">{t('meta_info', 'Meta Info')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('recorded_on', 'Recorded')}:</span>
                <span className="font-medium">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="glass-card border-none bg-card/40 overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-primary" />
                <CardTitle>{t('operation_history', 'Operation History')}</CardTitle>
              </div>
              <CardDescription>{t('operation_history_desc', 'Complete log of all movements for this serial number.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={data}
                pageCount={pageCount}
                fetchData={fetchData}
                isLoading={isLoading}
                filterKey="remarks" 
                filterPlaceholder={t('filter_by_remarks_placeholder')}
                emptyStateMessage={
                  <div className="flex flex-col items-center justify-center space-y-2 py-12">
                    <HistoryIcon className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground">{t('no_history_found', 'No movements recorded yet.')}</p>
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

export default function ItemHistoryPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center">Loading history...</div>}>
      <ItemHistoryContent />
    </React.Suspense>
  );
}

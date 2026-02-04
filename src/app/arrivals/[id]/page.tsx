
"use client";

import * as React from "react";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { Operation, Item } from "@/lib/definitions";
import { fetchArrivalById, fetchItemsByArrivalId } from "@/lib/data";
import { useTranslation } from "react-i18next";
import { format, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useHardwareColumns, useConsumableColumns, ArrivalTableItem } from "./item-columns";
import { Package, Calendar, User, Wallet, HardDrive, Printer } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ArrivalDetailContent() {
  const { t } = useTranslation('common');
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const arrivalId = params.id ? parseInt(params.id, 10) : null;
  
  const [arrival, setArrival] = React.useState<Operation | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  
  const [isLoadingArrival, setIsLoadingArrival] = React.useState(true);
  const [isLoadingItems, setIsLoadingItems] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);
  
  const hardwareColumns = useHardwareColumns();
  const consumableColumns = useConsumableColumns();

  React.useEffect(() => {
    setIsMounted(true);
    
    // Attempt to initialize arrival from transferred query params
    const un = searchParams.get('un');
    const bg = searchParams.get('bg');
    const dt = searchParams.get('dt');
    const rm = searchParams.get('rm');

    const getArrival = async () => {
      if (!arrivalId) return;
      try {
        setIsLoadingArrival(true);
        const fetchedArrival = await fetchArrivalById(arrivalId);
        setArrival(fetchedArrival);
      } catch (error) {
        console.error("Failed to fetch arrival metadata:", error);
        setArrival(null);
      } finally {
        setIsLoadingArrival(false);
      }
    };

    if (un && arrivalId) {
      // Data was successfully transferred via search params
      setArrival({
        id: arrivalId,
        user: { name: un } as any,
        budget: bg || undefined,
        date: dt || '',
        remarks: rm || '',
        type: 'ARRIVAL'
      });
      setIsLoadingArrival(false);
    } else {
      // Fallback: fetch from API if query params are missing (e.g. direct link)
      getArrival();
    }
  }, [arrivalId, searchParams]);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    if (!arrivalId) return;
    setIsLoadingItems(true);
    try {
      const result = await fetchItemsByArrivalId(arrivalId, { pageIndex, pageSize, query, sort });
      setItems(result.data);
      setPageCount(result.pageCount);
    } catch (error) {
      console.error("Failed to fetch arrival items:", error);
      setItems([]);
      setPageCount(0);
    } finally {
      setIsLoadingItems(false);
    }
  }, [arrivalId]);

  // Split items
  const hardwareItems = React.useMemo(() => {
    return items.filter(item => item.article.type === 'HARDWARE');
  }, [items]);

  // Group consumables per page
  const consumableItemsGrouped = React.useMemo(() => {
    const result: ArrivalTableItem[] = [];
    const consumableGroups: Record<number, ArrivalTableItem> = {};

    items.filter(item => item.article.type === 'CONSUMABLE').forEach((item) => {
      const articleId = item.article.id;
      if (consumableGroups[articleId]) {
        consumableGroups[articleId].groupCount = (consumableGroups[articleId].groupCount || 0) + 1;
      } else {
        consumableGroups[articleId] = { ...item, groupCount: 1 };
        result.push(consumableGroups[articleId]);
      }
    });

    return result;
  }, [items]);

  const parseSafeDate = (dateVal: any): Date | null => {
    if (!dateVal) return null;
    if (typeof dateVal === 'string' && dateVal.startsWith('[')) {
      try {
        const arr = JSON.parse(dateVal);
        return new Date(arr[0], arr[1] - 1, arr[2], arr[3] || 0, arr[4] || 0);
      } catch (e) { return null; }
    }
    if (Array.isArray(dateVal)) {
      return new Date(dateVal[0], dateVal[1] - 1, dateVal[2], dateVal[3] || 0, dateVal[4] || 0);
    }
    const d = new Date(dateVal);
    return isValid(d) ? d : null;
  };

  const formattedDate = React.useMemo(() => {
    if (!arrival?.date) return "";
    const d = parseSafeDate(arrival.date);
    return d ? format(d, "PPP p") : String(arrival.date);
  }, [arrival?.date]);

  if (!isMounted) return null;

  if (!isLoadingArrival && !arrival) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`${t('arrival_details', 'Arrival Details')} #${arrivalId}`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('information', 'Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingArrival ? (
                <div className="space-y-4">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{t('date')}:</span>
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{t('user')}:</span>
                    <span>{arrival?.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{t('budget')}:</span>
                    <Badge variant="secondary">
                      {arrival?.budget ? t(`budget_${arrival.budget.toLowerCase()}` as any, arrival.budget) : 'N/A'}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t text-sm">
                    <p className="font-semibold mb-1">{t('remarks')}:</p>
                    <p className="text-muted-foreground italic">{arrival?.remarks || t('no_remarks')}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="hardware" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="hardware" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  {t('hardware')}
                </TabsTrigger>
                <TabsTrigger value="consumables" className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  {t('consumable')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="hardware">
              <Card>
                <CardHeader>
                  <CardTitle>{t('hardware')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    columns={hardwareColumns} 
                    data={hardwareItems}
                    pageCount={pageCount}
                    fetchData={fetchData}
                    isLoading={isLoadingItems}
                    filterKey="serialNumber" 
                    filterPlaceholder={t('filter_by_serial_number_placeholder')}
                    emptyStateMessage={
                        <div className="flex flex-col items-center justify-center space-y-2 py-10">
                            <HardDrive className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">{t('no_hardware_found', 'No hardware items found in this page.')}</p>
                        </div>
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consumables">
              <Card>
                <CardHeader>
                  <CardTitle>{t('consumable')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    columns={consumableColumns} 
                    data={consumableItemsGrouped}
                    pageCount={pageCount}
                    fetchData={fetchData}
                    isLoading={isLoadingItems}
                    filterKey="serialNumber" 
                    filterPlaceholder={t('filter_by_serial_number_placeholder')}
                    emptyStateMessage={
                        <div className="flex flex-col items-center justify-center space-y-2 py-10">
                            <Printer className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">{t('no_consumables_found', 'No consumable items found in this page.')}</p>
                        </div>
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function ArrivalDetailPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center">Loading details...</div>}>
      <ArrivalDetailContent />
    </React.Suspense>
  );
}

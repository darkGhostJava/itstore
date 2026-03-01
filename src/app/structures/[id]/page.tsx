"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { Item, Structure, Operation } from "@/lib/definitions";
import { columns as itemColumns } from "./columns";
import { fetchItemsForStructure, fetchStructureById, fetchOperations } from "@/lib/data";
import { Building, User, History, HardDrive, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOperationsHistoryColumns } from "../../items/[id]/item-history-columns";
import { useTranslation } from "react-i18next";

export default function StructureDetailPage() {
  const { t } = useTranslation('common');
  const params = useParams<{ id: string }>();
  const structureId = params.id ? parseInt(params.id, 10) : null;
  
  const [structure, setStructure] = React.useState<Structure | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [history, setHistory] = React.useState<Operation[]>([]);
  
  const [itemsPageCount, setItemsPageCount] = React.useState(0);
  const [historyPageCount, setHistoryPageCount] = React.useState(0);
  
  const [isLoadingStructure, setIsLoadingStructure] = React.useState(true);
  const [isLoadingItems, setIsLoadingItems] = React.useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  
  const historyColumns = useOperationsHistoryColumns();

  React.useEffect(() => {
    const getStructure = async () => {
      if (!structureId) return;
      try {
        setIsLoadingStructure(true);
        const fetchedStructure = await fetchStructureById(structureId);
        setStructure(fetchedStructure);
      } catch (error) {
        console.error("Failed to fetch structure:", error);
        setStructure(null);
      } finally {
        setIsLoadingStructure(false);
      }
    };
    getStructure();
  }, [structureId]);


  const fetchItemsData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    if (!structureId) return;
    setIsLoadingItems(true);
    try {
      const result = await fetchItemsForStructure(structureId, { pageIndex, pageSize, query, sort });
      setItems(result.data);
      setItemsPageCount(result.pageCount);
    } catch(error) {
      console.error("Failed to fetch items:", error);
      setItems([]);
      setItemsPageCount(0);
    } finally {
      setIsLoadingItems(false);
    }
  }, [structureId]);

  const fetchHistoryData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    if (!structureId) return;
    setIsLoadingHistory(true);
    try {
      const result = await fetchOperations({ pageIndex, pageSize, query, sort, structureId });
      setHistory(result.data);
      setHistoryPageCount(result.pageCount);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setHistory([]);
      setHistoryPageCount(0);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [structureId]);

  if (isLoadingStructure) {
    return <div className="p-8 text-center animate-pulse">{t('loading_details', 'Loading structure details...')}</div>;
  }

  if (!structure) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`${structure.name}`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-none bg-card/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary">
                <Building className="h-5 w-5" />
                <CardTitle className="text-lg">{t('information')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('name')}</p>
                <p className="font-semibold">{structure.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('manager', 'Manager')}</p>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {structure.chef ? `${structure.chef.firstName} ${structure.chef.lastName}`: t('no_manager_assigned', 'No manager assigned.')}
                  </span>
                </div>
              </div>
              <div className="pt-2 grid grid-cols-2 gap-2 border-t border-border/50">
                <div className="bg-primary/5 p-2 rounded-lg text-center">
                  <p className="text-[9px] font-bold text-primary uppercase">{t('hardware')}</p>
                  <p className="text-lg font-black">{structure.materielCount || 0}</p>
                </div>
                <div className="bg-secondary/50 p-2 rounded-lg text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{t('consumable')}</p>
                  <p className="text-lg font-black">{structure.consCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                {t('distributed_items')}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                {t('operation_history')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-6">
              <Card className="glass-card border-none bg-card/40">
                <CardHeader>
                  <CardTitle>{t('distributed_items')}</CardTitle>
                  <CardDescription>{t('items_in_structure_desc', 'All items currently assigned to this structure.')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    columns={itemColumns} 
                    data={items}
                    pageCount={itemsPageCount}
                    fetchData={fetchItemsData}
                    isLoading={isLoadingItems}
                    filterKey="serialNumber" 
                    filterPlaceholder={t('filter_by_serial_number_placeholder')}
                    emptyStateMessage={
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mb-2 opacity-20" />
                        <p>{t('no_items_found')}</p>
                      </div>
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card className="glass-card border-none bg-card/40">
                <CardHeader>
                  <CardTitle>{t('operation_history')}</CardTitle>
                  <CardDescription>{t('operation_history_structure_desc', 'Full movement log for assets in this structure.')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    columns={historyColumns} 
                    data={history}
                    pageCount={historyPageCount}
                    fetchData={fetchHistoryData}
                    isLoading={isLoadingHistory}
                    filterKey="remarks" 
                    filterPlaceholder={t('filter_by_remarks_placeholder')}
                    emptyStateMessage={
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <History className="h-12 w-12 mb-2 opacity-20" />
                        <p>{t('no_history_found')}</p>
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

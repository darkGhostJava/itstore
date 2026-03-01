"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { Item, Person, Operation } from "@/lib/definitions";
import { columns as itemColumns } from "./columns";
import { fetchItemsForPerson, fetchPersonById, fetchOperations } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOperationsHistoryColumns } from "../../items/[id]/item-history-columns";
import { User, Building, Package, History } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PersonDetailPage() {
  const { t } = useTranslation('common');
  const params = useParams<{ id: string }>();
  const personId = params.id ? parseInt(params.id, 10) : null;
  
  const [person, setPerson] = React.useState<Person | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [history, setHistory] = React.useState<Operation[]>([]);
  const [itemsPageCount, setItemsPageCount] = React.useState(0);
  const [historyPageCount, setHistoryPageCount] = React.useState(0);
  
  const [isLoadingItems, setIsLoadingItems] = React.useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [isLoadingPerson, setIsLoadingPerson] = React.useState(true);
  
  const historyColumns = useOperationsHistoryColumns();

  React.useEffect(() => {
    const getPerson = async () => {
      if (!personId) return;
      try {
        setIsLoadingPerson(true);
        const fetchedPerson = await fetchPersonById(personId);
        setPerson(fetchedPerson);
      } catch (error) {
        console.error("Failed to fetch person:", error);
        setPerson(null);
      } finally {
        setIsLoadingPerson(false);
      }
    };
    getPerson();
  }, [personId]);


  const fetchItemsData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    if (!personId) return;
    setIsLoadingItems(true);
    try {
      const result = await fetchItemsForPerson(personId, { pageIndex, pageSize, query, sort });
      setItems(result.data);
      setItemsPageCount(result.pageCount);
    } catch(error) {
      console.error("Failed to fetch items:", error);
      setItems([]);
      setItemsPageCount(0);
    } finally {
      setIsLoadingItems(false);
    }
  }, [personId]);

  const fetchHistoryData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    if (!personId) return;
    setIsLoadingHistory(true);
    try {
      const result = await fetchOperations({ pageIndex, pageSize, query, sort, personId });
      setHistory(result.data);
      setHistoryPageCount(result.pageCount);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setHistory([]);
      setHistoryPageCount(0);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [personId]);

  if (isLoadingPerson) {
    return <div className="p-8 text-center animate-pulse">{t('loading_details', 'Loading person details...')}</div>;
  }

  if (!person) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`${person.firstName} ${person.lastName}`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-none bg-card/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary">
                <User className="h-5 w-5" />
                <CardTitle className="text-lg">{t('information')}</CardTitle>
              </div>
              <CardDescription>{person.grade} - {person.matricule}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('function')}</p>
                <p className="font-semibold">{t(`function_${person.function.toLowerCase()}` as any, person.function)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('structure')}</p>
                <div className="flex items-center gap-2">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{person.structure?.name || t('unknown')}</span>
                </div>
              </div>
              {person.pseudo && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('pseudo')}</p>
                  <code className="bg-primary/5 px-1.5 py-0.5 rounded text-primary font-mono">@{person.pseudo}</code>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
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
                  <CardDescription>{t('distributed_items_desc', 'All items currently assigned to this person.')}</CardDescription>
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
                  <CardDescription>{t('operation_history_desc', 'Complete movement log for this person.')}</CardDescription>
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

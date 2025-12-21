
"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { Item, Operation } from "@/lib/definitions";
import { columns as operationColumns } from "./columns";
import { fetchItemById, fetchOperationsForItem } from "@/lib/data";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ItemHistoryPage() {
  const params = useParams<{ id: string }>();
  const itemId = parseInt(params.id);
  const [item, setItem] = React.useState<Item | null>(null);

  const [data, setData] = React.useState<Operation[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingItem, setIsLoadingItem] = React.useState(true);
  
  React.useEffect(() => {
    const getItem = async () => {
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
    };
    getItem();
  }, [itemId]);


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

  React.useEffect(() => {
    if (itemId) {
      fetchData({ pageIndex: 0, pageSize: 10 });
    }
  }, [fetchData, itemId]);

  if (isLoadingItem) {
    return <div>Loading item details...</div>;
  }

  if (!item) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`History for ${item.serialNumber}`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>Serial Number: {item.serialNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-semibold">Article: </span> 
                <Button variant="link" asChild className="p-0 h-auto">
                    <Link href={`/articles/${item.article.id}`}>{item.article.model}</Link>
                </Button>
              </div>
              <div>
                <span className="font-semibold">Designation: </span> {item.article.designation}
              </div>
              <div>
                <span className="font-semibold">Status: </span> 
                <StatusBadge status={item.status} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
                <CardTitle>Operation History</CardTitle>
              <CardDescription>All recorded operations for this item.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={operationColumns} 
                data={data}
                pageCount={pageCount}
                fetchData={fetchData}
                isLoading={isLoading}
                filterKey="remarks" 
                filterPlaceholder="Filter by remarks..." 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

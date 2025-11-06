
"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { Item, Article } from "@/lib/definitions";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { fetchItemsForArticle } from "@/lib/data";
import { api } from "@/lib/api";

const itemColumns: ColumnDef<Item>[] = [
  {
    accessorKey: "serialNumber",
    header: "Serial Number",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const articleId = parseInt(params.id);
  const [article, setArticle] = React.useState<Article | null>(null);

  const [data, setData] = React.useState<Item[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingArticle, setIsLoadingArticle] = React.useState(true);
  
  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number }) => Promise<void>) | null>(null);

  React.useEffect(() => {
    const getArticle = async () => {
      if (!articleId) return;
      try {
        setIsLoadingArticle(true);
        const response = await api.get<Article>(`/articles/${articleId}`);
        setArticle(response.data);
      } catch (error) {
        console.error("Failed to fetch article:", error);
        setArticle(null);
      } finally {
        setIsLoadingArticle(false);
      }
    };
    getArticle();
  }, [articleId]);


  const fetchData = React.useCallback(async ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
    if (!articleId) return;
    setIsLoading(true);
    try {
      const result = await fetchItemsForArticle(articleId, { pageIndex, pageSize });
      setData(result.data);
      setPageCount(result.pageCount);
    } catch(error) {
      console.error("Failed to fetch items:", error);
      setData([]);
      setPageCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  fetchDataRef.current = fetchData;

  const handleSuccess = () => {
    if (fetchDataRef.current) {
      fetchDataRef.current({ pageIndex: 0, pageSize: 10 });
    }
  };


  if (isLoadingArticle) {
    // You can return a more detailed loader here
    return <div>Loading article details...</div>;
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={article.model} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
              <CardDescription>{article.designation}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-semibold">Model: </span> {article.model}
              </div>
              <div>
                <span className="font-semibold">Type: </span> 
                <Badge variant={article.type === "HARDWARE" ? "default" : "secondary"}>
                  {article.type}
                </Badge>
              </div>
              <div>
                <span className="font-semibold">Total Items: </span> {article.quantity}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Items</CardTitle>
                    {/* AddItems component will be created later and will use onSuccess */}
                    <Button size="sm" > 
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Items
                    </Button>
                </div>
              <CardDescription>Serial numbers and statuses for {article.model}.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={itemColumns} 
                data={data}
                pageCount={pageCount}
                fetchData={fetchData}
                isLoading={isLoading}
                filterKey="serialNumber" 
                filterPlaceholder="Filter by serial number..." 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

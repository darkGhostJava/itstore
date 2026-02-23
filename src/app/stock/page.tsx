
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { StockColumns } from "./columns";
import { fetchItemsInStock, exportStockStats } from "@/lib/data";
import type { Article } from "@/lib/definitions";
import { AddArticle } from "../articles/add-article";
import { useTranslation } from "react-i18next";
import { Boxes, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function StockPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const { t } = useTranslation("common");
  const columns = React.useMemo(() => StockColumns(t), [t]);
  const { toast } = useToast();

  const [data, setData] = React.useState<Article[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);
  
  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    setIsLoading(true);
    try {
      const result = await fetchItemsInStock({ pageIndex, pageSize, query, sort });
      setData(result.data);
      setPageCount(result.pageCount);
    }
    finally {
      setIsLoading(false);
    }
  }, []);
  
  React.useEffect(() => {
    fetchData({ pageIndex: 0, pageSize: 10, query: initialQuery });
  }, [fetchData, initialQuery]);

  fetchDataRef.current = fetchData;
  
  const handleSuccess = () => {
    if (fetchDataRef.current) {
       const currentPageIndex = 0; 
       const currentPageSize = 10;
       const currentQuery = initialQuery; 
       fetchDataRef.current({ pageIndex: currentPageIndex, pageSize: currentPageSize, query: currentQuery });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportStockStats();
      toast({ title: "Success", description: "Report downloaded successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate report." });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t('stock', 'Stock')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <FileDown className="mr-2 h-4 w-4" />
              {isExporting ? t('exporting') : t('export_to_word')}
            </Button>
            <AddArticle onSuccess={handleSuccess} />
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey="designation"
        filterPlaceholder={t('filter_by_designation_placeholder')}
        initialQuery={initialQuery}
        emptyStateMessage={
            <div className="flex flex-col items-center justify-center space-y-2">
                <Boxes className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No items found in stock.</p>
            </div>
        }
      />
    </div>
  );
}


export default function StockPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <StockPageContent />
    </React.Suspense>
  )
}

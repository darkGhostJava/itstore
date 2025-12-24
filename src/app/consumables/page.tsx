
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { ConsumablesColumns } from "./columns";
import { fetchArticles } from "@/lib/data";
import type { Article } from "@/lib/definitions";
import { AddArticle } from "../articles/add-article";
import { useTranslation } from "react-i18next";

function ConsumablesPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const { t } = useTranslation("common");
  const columns = ConsumablesColumns();

  const [data, setData] = React.useState<Article[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    setIsLoading(true);
    try {
      const result = await fetchArticles({ pageIndex, pageSize, query, type: 'CONSUMABLE', sort });
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
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t('consumables')}
        actions={
          <AddArticle onSuccess={handleSuccess} />
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
      />
    </div>
  );
}


export default function ConsumablesPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ConsumablesPageContent />
    </React.Suspense>
  )
}

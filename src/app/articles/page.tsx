
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { fetchArticles } from "@/lib/data";
import type { Article } from "@/lib/definitions";
import { AddArticle } from "./add-article";

function ArticlesPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [data, setData] = React.useState<Article[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query }: { pageIndex: number; pageSize: number; query?: string; }) => {
    setIsLoading(true);
    try {
      const result = await fetchArticles({ pageIndex, pageSize, query });
      setData(result.data);
      setPageCount(result.pageCount);
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  fetchDataRef.current = fetchData;
  
  const handleSuccess = () => {
    if (fetchDataRef.current) {
       // Refetch with current filters, not just the first page
       const currentPageIndex = 0; // Or get from table state if you want to stay on the same page
       const currentPageSize = 10; // Or get from table state
       const currentQuery = initialQuery; // Or get from input state
       fetchDataRef.current({ pageIndex: currentPageIndex, pageSize: currentPageSize, query: currentQuery });
    }
  };
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Articles"
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
        filterPlaceholder="Filter by designation..."
        initialQuery={initialQuery}
      />
    </div>
  );
}


export default function ArticlesPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ArticlesPageContent />
    </React.Suspense>
  )
}


"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { fetchArticles } from "@/lib/data";
import type { Article } from "@/lib/definitions";
import { AddArticle } from "./add-article";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ArticlesPageContent() {
  const searchParams = useSearchParams();
  const designationQuery = searchParams.get("designation") || "";

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
       fetchDataRef.current({ pageIndex: 0, pageSize: 10, query: designationQuery });
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
        initialQuery={designationQuery}
      />
    </div>
  );
}


export default function ArticlesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArticlesPageContent />
    </Suspense>
  )
}

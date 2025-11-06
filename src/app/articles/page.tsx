
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { fetchArticles } from "@/lib/data";
import type { Article } from "@/lib/definitions";
import { AddArticle } from "./add-article";

export default function ArticlesPage() {
  const [data, setData] = React.useState<Article[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Create a stable reference to the fetchData function
  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number }) => Promise<void>) | null>(null);


  const fetchData = React.useCallback(async ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
    setIsLoading(true);
    try {
      const result = await fetchArticles({ pageIndex, pageSize });
      setData(result.data);
      setPageCount(result.pageCount);
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  // Store the latest version of fetchData in the ref
  fetchDataRef.current = fetchData;
  
  const handleSuccess = () => {
    // Call the latest fetchData function from the ref
    if (fetchDataRef.current) {
       fetchDataRef.current({ pageIndex: 0, pageSize: 10 }); // Or use current pagination state
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
      />
    </div>
  );
}

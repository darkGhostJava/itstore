
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { fetchItems } from "@/lib/data";
import type { Item } from "@/lib/definitions";
import { ItemsTable } from "@/components/shared/items-table";
import { AddArticle } from "../articles/add-article";

export default function HardwarePage() {
  const [data, setData] = React.useState<Item[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query }: { pageIndex: number; pageSize: number; query?: string; }) => {
    setIsLoading(true);
    try {
      const result = await fetchItems("HARDWARE", { pageIndex, pageSize, query });
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
       const currentPageIndex = 0; 
       const currentPageSize = 10;
       fetchDataRef.current({ pageIndex: currentPageIndex, pageSize: currentPageSize });
    }
  };
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Hardware"
        actions={
          <AddArticle onSuccess={handleSuccess} />
        }
      />
      <ItemsTable
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
      />
    </div>
  );
}


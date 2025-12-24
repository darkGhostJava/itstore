
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { fetchItems } from "@/lib/data";
import type { Item } from "@/lib/definitions";
import { ItemsTable } from "@/components/shared/items-table";
import { AddArticle } from "../articles/add-article";
import { useTranslation } from "react-i18next";

function HardwarePageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const { t } = useTranslation("common");

  const [data, setData] = React.useState<Item[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    setIsLoading(true);
    try {
      const result = await fetchItems("HARDWARE", { pageIndex, pageSize, query, sort });
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
       fetchDataRef.current({ pageIndex: currentPageIndex, pageSize: currentPageSize });
    }
  };
  
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t('hardware')}
        actions={
          <AddArticle onSuccess={handleSuccess} />
        }
      />
      <ItemsTable
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        initialQuery={initialQuery}
        filterKey="designation"
        t={t}
      />
    </div>
  );
}

export default function HardwarePage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <HardwarePageContent />
        </React.Suspense>
    )
}

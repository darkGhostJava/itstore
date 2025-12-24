
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { useArrivalsColumns } from "./columns";
import { fetchArrivals } from "@/lib/data";
import type { Operation } from "@/lib/definitions";
import { AddArrival } from "./add-arrival";
import { useTranslation } from "react-i18next";
import { Truck } from "lucide-react";

export default function ArrivalsPage() {
  const [data, setData] = React.useState<Operation[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const { t } = useTranslation('common');
  const columns = useArrivalsColumns();
  
  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    setIsLoading(true);
    try {
      const result = await fetchArrivals({ pageIndex, pageSize, query, sort });
      setData(result.data);
      setPageCount(result.pageCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  fetchDataRef.current = fetchData;
  
  React.useEffect(() => {
    fetchData({ pageIndex: 0, pageSize: 10 });
  }, [fetchData]);

  const handleSuccess = () => {
    if (fetchDataRef.current) {
      fetchDataRef.current({ pageIndex: 0, pageSize: 10 });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t('arrivals')}
        actions={
          <AddArrival onSuccess={handleSuccess} />
        }
      />
      <DataTable 
        columns={columns} 
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey="remarks" 
        filterPlaceholder={t('filter_by_remarks_placeholder')}
        emptyStateMessage={
            <div className="flex flex-col items-center justify-center space-y-2">
                <Truck className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No arrivals have been recorded yet.</p>
            </div>
        }
      />
    </div>
  );
}

    

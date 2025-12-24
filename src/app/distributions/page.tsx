
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { useDistributionsColumns } from "./columns";
import { fetchDistributions } from "@/lib/data";
import { AddDistribution } from "./add-distribution";
import type { Distribution } from "@/lib/definitions";
import { useTranslation } from "react-i18next";

export default function DistributionsPage() {
  const [data, setData] = React.useState<Distribution[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const { t } = useTranslation('common');
  const columns = useDistributionsColumns();

  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; sort?: string }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?:string }) => {
    setIsLoading(true);
    try {
      const result = await fetchDistributions({ pageIndex, pageSize, query, sort });
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
        title={t('distributions')}
        actions={
          <AddDistribution onSuccess={handleSuccess} />
        }
      />
      <DataTable 
        columns={columns}
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey="serial number" 
        filterPlaceholder={t('filter_by_serial_number_placeholder')}
      />
    </div>
  );
}

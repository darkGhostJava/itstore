
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { fetchDistributions } from "@/lib/data";
import { AddDistribution } from "./add-distribution";
import type { Distribution } from "@/lib/definitions";

export default function DistributionsPage() {
  const [data, setData] = React.useState<Distribution[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
    setIsLoading(true);
    try {
      const result = await fetchDistributions({ pageIndex, pageSize });
      setData(result.data);
      setPageCount(result.pageCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  fetchDataRef.current = fetchData;

  const handleSuccess = () => {
    if (fetchDataRef.current) {
      fetchDataRef.current({ pageIndex: 0, pageSize: 10 });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Distributions"
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
        filterKey="remarks" 
        filterPlaceholder="Filter by remarks..."
      />
    </div>
  );
}

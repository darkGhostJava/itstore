
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { getReparationColumns } from "./columns";
import { fetchReparations } from "@/lib/data";
import type { Operation } from "@/lib/definitions";
import { AddReparation } from "./add-reparation";

export default function ReparationsPage() {
  const [data, setData] = React.useState<Operation[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query }: { pageIndex: number; pageSize: number; query?: string; }) => {
    setIsLoading(true);
    try {
      const result = await fetchReparations({ pageIndex, pageSize, query });
      setData(result.data);
      setPageCount(result.pageCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  fetchDataRef.current = fetchData;

  const handleSuccess = React.useCallback(() => {
    if (fetchDataRef.current) {
      fetchDataRef.current({ pageIndex: 0, pageSize: 10 });
    }
  }, []);

  const columns = React.useMemo(() => getReparationColumns({ onSuccess: handleSuccess }), [handleSuccess]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Repairs"
        actions={
          <AddReparation onSuccess={handleSuccess} />
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

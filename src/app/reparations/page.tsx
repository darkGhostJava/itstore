
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

  const fetchData = React.useCallback(async ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
    setIsLoading(true);
    const result = await fetchReparations({ pageIndex, pageSize });
    setData(result.data);
    setPageCount(result.pageCount);
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Repairs"
        actions={
          <AddReparation />
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

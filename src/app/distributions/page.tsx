"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { fetchDistributions } from "@/lib/data";
import { AddDistribution } from "./add-distribution";
import type { Operation } from "@/lib/definitions";

export default function DistributionsPage() {
  const [data, setData] = React.useState<Operation[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = fetchDistributions({ pageIndex, pageSize });
    setData(result.data);
    setPageCount(result.pageCount);
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Distributions"
        actions={
          <AddDistribution />
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

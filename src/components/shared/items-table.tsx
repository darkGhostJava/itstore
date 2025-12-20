
"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { type Item } from "@/lib/definitions";
import { getItemsColumns } from "./items-columns";

interface ItemsTableProps {
  data: Item[];
  pageCount: number;
  fetchData: (options: { pageIndex: number; pageSize: number; query?: string; }) => void;
  isLoading: boolean;
  initialQuery?: string;
  filterKey?: "serialNumber" | "designation";
}

export function ItemsTable({ data, pageCount, fetchData, isLoading, initialQuery, filterKey = "serialNumber" }: ItemsTableProps) {

  const handleSuccess = React.useCallback(() => {
    // Refetch data for the current view
    const currentPageIndex = 0; // Or get from table state if you want to stay on the same page
    const currentPageSize = 10; // Or get from table state
    fetchData({ pageIndex: currentPageIndex, pageSize: currentPageSize });
  }, [fetchData]);

  const columns = React.useMemo(() => getItemsColumns({ onSuccess: handleSuccess }), [handleSuccess]);

  return (
      <DataTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey={filterKey}
        filterPlaceholder={`Filter by ${filterKey}...`}
        initialQuery={initialQuery}
      />
  );
}

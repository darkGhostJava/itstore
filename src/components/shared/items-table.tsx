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
}

export function ItemsTable({ data, pageCount, fetchData, isLoading }: ItemsTableProps) {

  const handleSuccess = React.useCallback(() => {
    fetchData({ pageIndex: 0, pageSize: 10 });
  }, [fetchData]);

  const columns = React.useMemo(() => getItemsColumns({ onSuccess: handleSuccess }), [handleSuccess]);

  return (
      <DataTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey="serialNumber"
        filterPlaceholder="Filter by serial number..."
      />
  );
}


"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { type Item } from "@/lib/definitions";
import { getItemsColumns } from "./items-columns";
import { TFunction } from "i18next";
import { HardDrive, Printer } from "lucide-react";

interface ItemsTableProps {
  data: Item[];
  pageCount: number;
  fetchData: (options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => void;
  isLoading: boolean;
  initialQuery?: string;
  filterKey?: "serialNumber" | "designation";
  t: TFunction<"common", undefined>;
  itemType: "HARDWARE" | "CONSUMABLE";
}

export function ItemsTable({ data, pageCount, fetchData, isLoading, initialQuery, filterKey = "serialNumber", t, itemType }: ItemsTableProps) {

  const handleSuccess = React.useCallback(() => {
    // Refetch data for the current view
    const currentPageIndex = 0; // Or get from table state if you want to stay on the same page
    const currentPageSize = 10; // Or get from table state
    fetchData({ pageIndex: currentPageIndex, pageSize: currentPageSize });
  }, [fetchData]);

  const columns = React.useMemo(() => getItemsColumns({ onSuccess: handleSuccess, t }), [handleSuccess, t]);
  
  const placeholder = filterKey === 'serialNumber' ? t('filter_by_serial_number_placeholder') : t('filter_by_designation_placeholder');

  const EmptyIcon = itemType === "HARDWARE" ? HardDrive : Printer;

  return (
      <DataTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey={filterKey}
        filterPlaceholder={placeholder}
        initialQuery={initialQuery}
        emptyStateMessage={
            <div className="flex flex-col items-center justify-center space-y-2">
                <EmptyIcon className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No {itemType.toLowerCase()} items found.</p>
            </div>
        }
      />
  );
}

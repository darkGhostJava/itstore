
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { fetchOperations } from "@/lib/data";
import type { Operation } from "@/lib/definitions";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { useTranslation } from "react-i18next";

export default function OperationsPage() {
  const { t } = useTranslation('common');
  const [data, setData] = React.useState<Operation[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  const operationTypes = [
    { label: t("arrival"), value: "ARRIVAL" },
    { label: t("distribution"), value: "DISTRIBUTION" },
    { label: t("reparation"), value: "REPARATION" },
    { label: t("reversement"), value: "REVERSEMENT" },
    { label: t("reforme"), value: "REFORME" },
  ]

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    setIsLoading(true);
    const result = await fetchOperations({ pageIndex, pageSize, query, sort });
    setData(result.data);
    setPageCount(result.pageCount);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData({ pageIndex: 0, pageSize: 10 });
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t('operations_log')}
      />
      <DataTable 
        columns={columns} 
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey="remarks" 
        filterPlaceholder={t('filter_by_remarks_placeholder')}
        facetedFilters={
          <DataTableFacetedFilter
            column={null} // Pass null or a mock column, it's not used in this specific implementation
            title={t('type')}
            options={operationTypes}
          />
        }
      />
    </div>
  );
}

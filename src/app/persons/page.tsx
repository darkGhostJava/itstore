"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { usePersonsColumns } from "./columns";
import { fetchPersons } from "@/lib/data";
import type { Person } from "@/lib/definitions";
import { AddPerson } from "./add-person";
import { useTranslation } from "react-i18next";

export default function PersonsPage() {
  const { t } = useTranslation('common');
  const [data, setData] = React.useState<Person[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const columns = usePersonsColumns();

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    setIsLoading(true);
    const result = await fetchPersons({ pageIndex, pageSize, query, sort });
    setData(result.data);
    setPageCount(result.pageCount);
    setIsLoading(false);
  }, []);
  
  React.useEffect(() => {
    fetchData({ pageIndex: 0, pageSize: 10 });
  }, [fetchData]);

  const handleSuccess = () => {
    fetchData({ pageIndex: 0, pageSize: 10 });
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t('persons')}
        actions={
          <AddPerson onSuccess={handleSuccess} />
        }
      />
      <DataTable 
        columns={columns}
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey="lastName"
        filterPlaceholder="Filter by name..."
      />
    </div>
  );
}

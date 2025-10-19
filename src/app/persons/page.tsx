"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { fetchPersons } from "@/lib/data";
import type { Person } from "@/lib/definitions";

export default function PersonsPage() {
  const [data, setData] = React.useState<Person[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = fetchPersons({ pageIndex, pageSize });
    setData(result.data);
    setPageCount(result.pageCount);
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Persons"
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Person
          </Button>
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

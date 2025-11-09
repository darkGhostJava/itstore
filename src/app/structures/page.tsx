"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { fetchStructures } from "@/lib/data";
import type { Structure } from "@/lib/definitions";

export default function StructuresPage() {
    const [data, setData] = React.useState<Structure[]>([]);
    const [pageCount, setPageCount] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);

    const fetchData =  React.useCallback(async ({ pageIndex, pageSize, query }: { pageIndex: number; pageSize: number; query?: string; }) => {
        setIsLoading(true);
        const result = await fetchStructures({ pageIndex, pageSize, query });

        
        setData(result.data);
        setPageCount(result.pageCount);
        setIsLoading(false);
    }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Structures"
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Structure
          </Button>
        }
      />
      <DataTable 
        columns={columns}
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey="name" 
        filterPlaceholder="Filter by name..." 
    />
    </div>
  );
}

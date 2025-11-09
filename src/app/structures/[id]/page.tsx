
"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { Item, Structure } from "@/lib/definitions";
import { columns as itemColumns } from "./columns";
import { fetchItemsForStructure, fetchStructureById } from "@/lib/data";
import { Building } from "lucide-react";

export default function StructureDetailPage() {
  const params = useParams<{ id: string }>();
  const structureId = parseInt(params.id);
  const [structure, setStructure] = React.useState<Structure | null>(null);

  const [data, setData] = React.useState<Item[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingStructure, setIsLoadingStructure] = React.useState(true);
  
  React.useEffect(() => {
    const getStructure = async () => {
      if (!structureId) return;
      try {
        setIsLoadingStructure(true);
        const fetchedStructure = await fetchStructureById(structureId);
        setStructure(fetchedStructure);
      } catch (error) {
        console.error("Failed to fetch structure:", error);
        setStructure(null);
      } finally {
        setIsLoadingStructure(false);
      }
    };
    getStructure();
  }, [structureId]);


  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query }: { pageIndex: number; pageSize: number; query?: string; }) => {
    if (!structureId) return;
    setIsLoading(true);
    try {
      const result = await fetchItemsForStructure(structureId, { pageIndex, pageSize, query });
      setData(result.data);
      setPageCount(result.pageCount);
    } catch(error) {
      console.error("Failed to fetch items:", error);
      setData([]);
      setPageCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [structureId]);

  if (isLoadingStructure) {
    return <div>Loading structure details...</div>;
  }

  if (!structure) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`${structure.name}`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Structure Details</CardTitle>
               <CardDescription>
                {structure.chef ? `Managed by ${structure.chef.firstName} ${structure.chef.lastName}`: 'No manager assigned.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Name: </span>&nbsp;{structure.name}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
                <CardTitle>Items in Structure</CardTitle>
              <CardDescription>All items currently assigned to {structure.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={itemColumns} 
                data={data}
                pageCount={pageCount}
                fetchData={fetchData}
                isLoading={isLoading}
                filterKey="serialNumber" 
                filterPlaceholder="Filter by serial number..." 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

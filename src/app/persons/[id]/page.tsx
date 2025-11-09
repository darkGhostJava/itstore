
"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { Item, Person } from "@/lib/definitions";
import { columns as itemColumns } from "./columns";
import { fetchItemsForPerson, fetchPersonById } from "@/lib/data";

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const personId = parseInt(params.id);
  const [person, setPerson] = React.useState<Person | null>(null);

  const [data, setData] = React.useState<Item[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingPerson, setIsLoadingPerson] = React.useState(true);
  
  React.useEffect(() => {
    const getPerson = async () => {
      if (!personId) return;
      try {
        setIsLoadingPerson(true);
        const fetchedPerson = await fetchPersonById(personId);
        setPerson(fetchedPerson);
      } catch (error) {
        console.error("Failed to fetch person:", error);
        setPerson(null);
      } finally {
        setIsLoadingPerson(false);
      }
    };
    getPerson();
  }, [personId]);


  const fetchData = React.useCallback(async ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
    if (!personId) return;
    setIsLoading(true);
    try {
      const result = await fetchItemsForPerson(personId, { pageIndex, pageSize });
      setData(result.data);
      setPageCount(result.pageCount);
    } catch(error) {
      console.error("Failed to fetch items:", error);
      setData([]);
      setPageCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [personId]);

  if (isLoadingPerson) {
    return <div>Loading person details...</div>;
  }

  if (!person) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`${person.firstName} ${person.lastName}`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Person Details</CardTitle>
              <CardDescription>{person.grade} - {person.matricule}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-semibold">Function: </span> {person.function}
              </div>
              <div>
                <span className="font-semibold">Structure: </span> {person.structure?.name}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
                <CardTitle>Distributed Items</CardTitle>
              <CardDescription>All items currently assigned to {person.firstName} {person.lastName}.</CardDescription>
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

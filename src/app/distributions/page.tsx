import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { mockOperations } from "@/lib/data";

export default function DistributionsPage() {
  const distributionData = mockOperations.filter(op => op.type === "DISTRIBUTION");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Distributions"
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Distribution
          </Button>
        }
      />
      <DataTable data={distributionData} columns={columns} filterKey="remarks" filterPlaceholder="Filter by remarks..."/>
    </div>
  );
}

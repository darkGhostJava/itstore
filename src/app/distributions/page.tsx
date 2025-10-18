import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { mockOperations } from "@/lib/data";
import { AddDistribution } from "./add-distribution";

export default function DistributionsPage() {
  const distributionData = mockOperations.filter(op => op.type === "DISTRIBUTION");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Distributions"
        actions={
          <AddDistribution />
        }
      />
      <DataTable data={distributionData} columns={columns} filterKey="remarks" filterPlaceholder="Filter by remarks..."/>
    </div>
  );
}

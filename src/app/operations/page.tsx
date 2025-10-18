import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { mockOperations } from "@/lib/data";

export default function OperationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Operations Log"
      />
      <DataTable data={mockOperations} columns={columns} />
    </div>
  );
}

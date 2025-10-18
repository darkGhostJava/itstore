import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { mockStructures } from "@/lib/data";

export default function StructuresPage() {
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
      <DataTable data={mockStructures} columns={columns} />
    </div>
  );
}

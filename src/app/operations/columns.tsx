
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Operation } from "@/lib/definitions";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const columns: ColumnDef<Operation>[] = [
  {
    header: "#",
    cell: ({ row }) => {
      return row.index + 1;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.original.type;
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (type === "ARRIVAL") variant = "default";
      if (type === "DISTRIBUTION") variant = "secondary";
      if (type === "REPARATION") variant = "destructive";
      
      return <Badge variant={variant}>{type}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => format(new Date(row.original.date), "PPP p"),
  },
  {
    accessorKey: "user.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" sortKey="user.name" />
    ),
    cell: ({ row }) => {
      return row.original.user?.name || "Unknown";
    },
  },
  {
    accessorKey: "beneficiary.firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Beneficiary" sortKey="beneficiary.firstName" />
    ),
    cell: ({ row }) => {
      const person = row.original.beneficiary;
      return person ? `${person.firstName} ${person.lastName}` : "N/A";
    },
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Remarks" />
    ),
  },
    {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
        </div>
      );
    },
  },
];

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Operation } from "@/lib/definitions";
import { mockUsers, mockItems, mockArticles, mockPersons } from "@/lib/data";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const columns: ColumnDef<Operation>[] = [
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
    header: "User",
    accessorKey: "userId",
    cell: ({ row }) => {
      const user = mockUsers.find(u => u.id === row.original.userId);
      return user?.name || "Unknown";
    },
  },
  {
    header: "Beneficiary",
    accessorKey: "beneficiaryId",
    cell: ({ row }) => {
      const person = mockPersons.find(p => p.id === row.original.beneficiaryId);
      return person ? `${person.firstName} ${person.lastName}` : "N/A";
    },
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
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

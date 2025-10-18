"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Person } from "@/lib/definitions";
import { mockStructures } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<Person>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    header: "Name",
    cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
  },
  {
    accessorKey: "grade",
    header: "Grade",
  },
  {
    accessorKey: "matricule",
    header: "Matricule",
  },
  {
    header: "Structure",
    cell: ({ row }) => {
      const structure = mockStructures.find(s => s.id === row.original.structureId);
      return structure?.name || "N/A";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Edit Person</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete Person</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Structure } from "@/lib/definitions";
import { mockPersons, mockStructures } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export const columns: ColumnDef<Structure>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    header: "Chef",
    cell: ({ row }) => {
      const chef = mockPersons.find(p => p.id === row.original.chefId);
      return chef ? `${chef.firstName} ${chef.lastName}` : "Not Assigned";
    },
  },
  {
    header: "Parent Structure",
    cell: ({ row }) => {
      const parent = mockStructures.find(s => s.id === row.original.parentId);
      return parent?.name || "N/A";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit Structure</DropdownMenuItem>
            <DropdownMenuItem>Assign Chef</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

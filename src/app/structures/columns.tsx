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
import { api } from "@/lib/api";
import React from "react";

export const columns: ColumnDef<Structure>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    header: "Chef",
    accessorFn: (row) => `${row.chef?.firstName ?? ""} ${row.chef?.lastName ?? ""}`,

  },
  {
    header: "Items",
    cell: ({ row }) => {
      const [count, setCount] = React.useState<number | null>(null);

      React.useEffect(() => {
        api.get<number>(`/structures/${row.original.id}/items/count`)
          .then(res => setCount(res.data))
          .catch(() => setCount(0));
      }, [row.original.id]);

      return <span>{count ?? "..."}</span>;
    }
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

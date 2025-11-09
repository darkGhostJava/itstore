"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Structure } from "@/lib/definitions";
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
import Link from "next/link";

export const columns: ColumnDef<Structure>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    header: "Chef",
    accessorFn: (row) => row.chef ? `${row.chef.firstName} ${row.chef.lastName}` : "N/A",
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
      const structure = row.original;
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
            <DropdownMenuItem asChild>
              <Link href={`/structures/${structure.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Assign Chef</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

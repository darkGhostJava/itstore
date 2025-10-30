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

export const columns: ColumnDef<Operation>[] = [
  {
    header: "Article",
    cell: ({ row }) => {
      return row.original.item ? `${row.original.item.article.model} - ${row.original.item.article.designation}` : "N/A";
    },
  },
    {
    header: "Serial Number",
    cell: ({ row }) => {
      return row.original.item ? `${row.original.item.serialNumber}` : "N/A";
    },
  },
  {
    header: "Beneficiary",
    cell: ({ row }) => {
      return row.original.person ? `${row.original.person.firstName} ${row.original.person.lastName}` : "N/A";

    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(new Date(row.original.date), "PPP"),
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
  },
  {
    header: "User",
    cell: ({ row }) => {
      return row.original.user ? `${row.original.user.name}`: "N/A";

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
            <DropdownMenuItem>View Details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

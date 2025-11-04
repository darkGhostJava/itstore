"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Operation, Item } from "@/lib/definitions";
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
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => format(new Date(row.original.date), "PPP"),
  },
  {
    header: "Article",
    cell: ({ row }) => {
      // Assuming the backend returns items for an arrival operation
      const items = (row.original as any).items as Item[] | undefined;
      if (!items || items.length === 0) return "N/A";
      const article = items[0].article;
      return article ? `${article.model} - ${article.designation}` : "N/A";
    },
  },
  {
    header: "Count",
    cell: ({ row }) => {
       const items = (row.original as any).items as Item[] | undefined;
       return items?.length ?? 0;
    }
  },
  {
    header: "User",
    cell: ({ row }) => {
      return row.original.user?.name || "Unknown";
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

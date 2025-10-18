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
      const firstItemId = row.original.itemIds[0];
      const item = mockItems.find(i => i.id === firstItemId);
      const article = item ? mockArticles.find(a => a.id === item.articleId) : null;
      return article ? `${article.model} - ${article.designation}` : "N/A";
    },
  },
  {
    header: "Beneficiary",
    cell: ({ row }) => {
      const person = mockPersons.find(p => p.id === row.original.beneficiaryId);
      return person ? `${person.firstName} ${person.lastName}` : "N/A";
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
      const user = mockUsers.find(u => u.id === row.original.userId);
      return user?.name || "Unknown";
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

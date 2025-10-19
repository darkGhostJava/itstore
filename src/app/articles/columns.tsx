"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Article } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const columns: ColumnDef<Article>[] = [
  {
    accessorKey: "model",
    header: "Model",
  },
  {
    accessorKey: "designation",
    header: "Designation",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge variant={type === "HARDWARE" ? "default" : "secondary"}>
          {type}
        </Badge>
      );
    },
  },
  {
    header: "Items Count",
    cell: ({ row }) => {
      return row.original.quantity;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const article = row.original;

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
              <Link href={`/articles/${article.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Article</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

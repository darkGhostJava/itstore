
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Item } from "@/lib/definitions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { StatusBadge } from "./status-badge";
import Link from "next/link";
import { RepairItemDialog } from "@/app/reparations/repair-item-dialog";
import { ReformItemDialog } from "@/app/reparations/reform-item-dialog";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";


type ItemsColumnProps = {
  onSuccess: () => void;
}

export const getItemsColumns = ({ onSuccess }: ItemsColumnProps): ColumnDef<Item>[] => [
  {
    header: "#",
    cell: ({ row }) => {
      return row.index + 1;
    },
  },
  {
    id: "article.model",
    accessorKey: "article.model",
     header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Article" />
    ),
    cell: ({ row }) => {
      const { article } = row.original;
      return <Link href={`/articles/${article.id}`} className="hover:underline">{article.model}</Link>;
    },
  },
   {
    id: "article.designation",
    accessorKey: "article.designation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Designation" />
    ),
  },
  {
    accessorKey: "serialNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Serial Number" />
    ),
    cell: ({ row }) => {
        const item = row.original;
        return (
            <Button variant="link" asChild className="p-0 h-auto">
                <Link href={`/items/${item.id}`}>
                    {item.serialNumber}
                </Link>
            </Button>
        )
    }
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const { status } = row.original;
      return <StatusBadge status={status} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;
      
      const isUnderRepair = item.status === 'UNDER_REPAIR';

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
              <Link href={`/items/${item.id}`}>View History</Link>
            </DropdownMenuItem>
             {isUnderRepair && (
              <>
                <DropdownMenuSeparator />
                <RepairItemDialog item={item} onSuccess={onSuccess} />
                <ReformItemDialog item={item} onSuccess={onSuccess} />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

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
    header: "Article",
    cell: ({ row }) => {
      const { article } = row.original;
      return <Link href={`/articles/${article.id}`} className="hover:underline">{article.model}</Link>;
    },
  },
   {
    accessorKey: "article.designation",
    header: "Designation",
  },
  {
    accessorKey: "serialNumber",
    header: "Serial Number",
  },
  {
    accessorKey: "status",
    header: "Status",
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
              <Link href={`/articles/${item.article.id}`}>View Article</Link>
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

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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { RepairItemDialog } from "./repair-item-dialog";
import { ReformItemDialog } from "./reform-item-dialog";
import { StatusBadge } from "@/components/shared/status-badge";

type ReparationColumnProps = {
  onSuccess: () => void;
}

export const getReparationColumns = ({ onSuccess }: ReparationColumnProps): ColumnDef<Operation>[] => [
  {
    header: "Article",
    cell: ({ row }) => {
      const items = (row.original as any).items as Item[] | undefined;
      if (!items || items.length === 0) return "N/A";
      const article = items[0].article;
      return article ? `${article.model} - ${article.designation}` : "N/A";
    },
  },
  {
    header: "Serial Number",
     cell: ({ row }) => {
      const items = (row.original as any).items as Item[] | undefined;
      if (!items || items.length === 0) return "N/A";
      return items[0]?.serialNumber || 'N/A';
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
      return row.original.user?.name || "Unknown";
    },
  },
  {
    header: "Status",
    cell: ({ row }) => {
      const items = (row.original as any).items as Item[] | undefined;
      if (!items || items.length === 0) return "N/A";
      const status = items[0].status;
      return status ? <StatusBadge status={status} /> : "N/A";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const items = (row.original as any).items as Item[] | undefined;
      const item = items?.[0];
      
      if (!item || item.status !== 'UNDER_REPAIR') {
        return null;
      }

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
            <DropdownMenuSeparator />
            <RepairItemDialog item={item} onSuccess={onSuccess} />
            <ReformItemDialog item={item} onSuccess={onSuccess} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

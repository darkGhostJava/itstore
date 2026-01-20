
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
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { TFunction } from "i18next";
import { Badge } from "@/components/ui/badge";

export const StockColumns = (t: TFunction): ColumnDef<Article>[] => {
  return [
    {
      header: "#",
      cell: ({ row }) => {
        return row.index + 1;
      },
    },
    {
      accessorKey: "model",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('model')} />
      ),
    },
    {
      accessorKey: "designation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('designation')} />
      ),
      cell: ({ row }) => {
        const designation = row.getValue("designation") as string;
        const translationKey = `category_${designation.toLowerCase().replace(/ /g, "_")}` as any;
        return t(translationKey, designation);
      }
    },
     {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('type')} />
      ),
      cell: ({row}) => {
        const type = row.original.type;
        return <Badge variant={type === "HARDWARE" ? "default" : "secondary"}>{t(type.toLowerCase() as "hardware" | "consumable")}</Badge>
      }
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('quantity')} />
      ),
    },
    {
      accessorKey: "budget",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('budget')} />
      ),
      cell: ({ row }) => {
        const budget = row.original.budget;
        if (!budget) return 'N/A';
        const budgetKey = `budget_${budget.toLowerCase()}` as const;
        return t(budgetKey, budget);
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const article = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t('open_menu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
              <DropdownMenuItem>Edit Article</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};

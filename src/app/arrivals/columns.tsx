
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Operation } from "@/lib/definitions";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";
import Link from "next/link";

export const useArrivalsColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<Operation>[] = [
    {
      header: "#",
      cell: ({ row }) => {
        return row.index + 1;
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('date')} />
      ),
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.date), "PPP p");
        } catch (e) {
          return String(row.original.date);
        }
      },
    },
    {
      id: "article",
      accessorFn: (row) => row.items?.[0]?.article?.model,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('article')} />
      ),
      cell: ({ row }) => {
        const items = row.original.items;
        if (!items || items.length === 0) return "N/A";
        const article = items[0].article;
        return article ? `${article.model} - ${article.designation}` : "N/A";
      },
    },
    {
      id: "count",
      accessorFn: (row) => row.items?.length,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('count')} />
      ),
      cell: ({ row }) => {
        const items = row.original.items;
        return items?.length ?? 0;
      }
    },
    {
      id: "user",
      accessorFn: row => row.user?.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('user')} />
      ),
      cell: ({ row }) => {
        return row.original.user?.name || t('unknown');
      },
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('remarks')} />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const arrival = row.original;
        
        // Serialize date if it's an array/object for the URL
        const dateStr = Array.isArray(arrival.date) ? JSON.stringify(arrival.date) : arrival.date;

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
              <DropdownMenuItem asChild>
                <Link href={{
                  pathname: `/arrivals/${arrival.id}`,
                  query: {
                    un: arrival.user?.name,
                    bg: arrival.budget,
                    dt: dateStr,
                    rm: arrival.remarks
                  }
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('view_details')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
};

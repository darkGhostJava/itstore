
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Person } from "@/lib/definitions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";

export const usePersonsColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<Person>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "#",
      cell: ({ row }) => {
        return row.index + 1;
      },
    },
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('first_name')} />
      ),
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('last_name')} />
      ),
    },
    {
      accessorKey: "pseudo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('pseudo')} />
      ),
    },
    {
      accessorKey: "grade",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('grade')} />
      ),
    },
    {
      accessorKey: "matricule",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('matricule')} />
      ),
    },
    {
      id: "structure",
      accessorFn: (row) => row.structure?.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('structure')} />
      ),
      cell: ({ row }) => row.original.structure?.name ?? "N/A",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const person = row.original;
        return (
          <div className="text-right">
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
                  <Link href={`/persons/${person.id}`}>{t('view_details')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>{t('edit_person', 'Edit Person')}</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">{t('delete_person', 'Delete Person')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return columns;
};

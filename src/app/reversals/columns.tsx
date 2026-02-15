
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Refund } from "@/lib/definitions";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";
import Link from "next/link";

export const useReversalsColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<Refund>[] = [
    {
      header: "#",
      cell: ({ row }) => row.index + 1,
    },
    {
      id: "date",
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('date')} />
      ),
      cell: ({ row }) => row.original.date ? format(new Date(row.original.date), "PPP") : "N/A",
    },
    {
      id: "article",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('article')} />
      ),
      cell: ({ row }) => {
        const item = row.original.item;
        if (!item) return "N/A";
        const article = item.article;
        return (
            <Button variant="link" asChild className="p-0 h-auto">
                <Link href={`/articles/${article.id}`}>{article.model} - {article.designation}</Link>
            </Button>
        );
      },
    },
    {
      id: "serialNumber",
      accessorKey: "item.serialNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('serial_number')} />
      ),
      cell: ({ row }) => {
        const item = row.original.item;
        if (!item) return "N/A";
        return (
            <Button variant="link" asChild className="p-0 h-auto">
                <Link href={`/items/${item.id}`}>{item.serialNumber}</Link>
            </Button>
        );
      }
    },
    {
      id: "beneficiary",
      accessorKey: "person",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('beneficiary')} />
      ),
      cell: ({ row }) => {
        const person = row.original.person;
        if (!person) return t('unknown');
        return (
            <Button variant="link" asChild className="p-0 h-auto">
                <Link href={`/persons/${person.id}`}>{person.firstName} {person.lastName}</Link>
            </Button>
        )
      },
    },
    {
      id: "structure",
      accessorKey: "person.structure.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('structure')} />
      ),
      cell: ({ row }) => {
        const structure = row.original.person?.structure;
        if (!structure) return t('unknown');
        return (
            <Button variant="link" asChild className="p-0 h-auto">
                <Link href={`/structures/${structure.id}`}>{structure.name}</Link>
            </Button>
        )
      },
    },
    {
      id: "user",
      accessorKey: "user.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('user')} />
      ),
      cell: ({ row }) => row.original.user?.name || t('unknown'),
    },
    {
      id: "remarks",
      accessorKey: "remarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('remarks')} />
      ),
    },
    {
      id: "attestation",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('attestation_status', 'Attestation')} />,
      cell: ({ row }) => {
        const isSigned = row.original.isSigned || !!row.original.dechargeId;
        return isSigned ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">{t('signed', 'Signed')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <XCircle className="h-4 w-4" />
            <span className="text-xs">{t('none', 'None')}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
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
              <DropdownMenuItem>{t('view_details')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
};

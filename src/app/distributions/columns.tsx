"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Distribution } from "@/lib/definitions";
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
import { MoreHorizontal, CheckCircle2, XCircle, Eye } from "lucide-react";
import { UploadAttestation } from "./upload-attestation";
import { DownloadAttestation } from "./download-attestation";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";
import Link from "next/link";

export const useDistributionsColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<Distribution>[] = [
    {
      header: "#",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
    },
    {
      id: "date",
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('date')} />,
      cell: ({ row }) => {
        try {
          return format(new Date(row.original.date), "PPP");
        } catch (e) {
          return String(row.original.date);
        }
      },
    },
    {
      id: "article",
      accessorFn: row => `${row.item.article.model} - ${row.item.article.designation}`,
      header: t('article'),
      enableSorting: false, 
      cell: ({ row }) => {
        const item = row.original.item;
        if (!item) return "N/A";
        return (
          <div className="flex flex-col">
            <span className="font-semibold">{item.article.model}</span>
            <span className="text-xs text-muted-foreground">{item.article.designation}</span>
          </div>
        )
      },
    },
    {
      id: "serialNumber",
      accessorKey: "item.serialNumber",
      header: t('serial_number'),
      enableSorting: false, 
      cell: ({ row }) => {
        const item = row.original.item;
        if (!item) return "N/A";
        return (
            <Button variant="link" asChild className="p-0 h-auto font-mono text-xs">
                <Link href={`/items/${item.id}`}>{item.serialNumber}</Link>
            </Button>
        )
      },
    },
    {
      id: "beneficiary",
      accessorKey: "person",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('beneficiary')} />,
      cell: ({ row }) => {
        const person = row.original.person;
        if (!person) return "N/A";
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
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('structure')} />,
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
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('user')} />,
      cell: ({ row }) => row.original.user?.name || "N/A",
    },
    {
      id: "isSigned",
      accessorKey: "isSigned",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('attestation_status', 'Attestation')} />,
      cell: ({ row }) => {
        const isSigned = row.original.isSigned;
        return isSigned ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">{t('signed', 'Signed')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <XCircle className="h-4 w-4" />
            <span className="text-xs">{t('not_signed', 'Not Signed')}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const distribution = row.original;
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
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                {t('view_details')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <UploadAttestation distribution={distribution} />
              <DownloadAttestation distribution={distribution} />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
  return columns;
};

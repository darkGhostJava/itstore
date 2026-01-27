
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
import { MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { UploadAttestation } from "./upload-attestation";
import { DownloadAttestation } from "./download-attestation";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";

export const useDistributionsColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<Distribution>[] = [
    {
      header: "#",
      cell: ({ row }) => {
        return row.index + 1;
      },
    },
    {
      id: "item.article.model",
      accessorKey: "item.article.model",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('article')} />
      ),
      cell: ({ row }) => {
        return row.original.item ? `${row.original.item.article.model} - ${row.original.item.article.designation}` : "N/A";
      },
    },
    {
      id: "item.serialNumber",
      accessorKey: "item.serialNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('serial_number')} />
      ),
      cell: ({ row }) => {
        return row.original.item ? `${row.original.item.serialNumber}` : "N/A";
      },
    },
    {
      id: "person.firstName",
      accessorKey: "person.firstName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('beneficiary')} />
      ),
      cell: ({ row }) => {
        return row.original.person ? `${row.original.person.firstName} ${row.original.person.lastName}` : "N/A";
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('date')} />
      ),
      cell: ({ row }) => format(new Date(row.original.date), "PPP"),
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('remarks')} />
      ),
    },
    {
      id: "user.name",
      accessorKey: "user.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('user')} />
      ),
      cell: ({ row }) => {
        return row.original.user ? `${row.original.user.name}`: "N/A";
      },
    },
    {
      id: "isSigned",
      accessorKey: "isSigned",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('attestation_status', 'Attestation')} />
      ),
      cell: ({ row }) => {
        const isSigned = row.original.isSigned;
        return isSigned ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t('signed', 'Signed')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{t('not_signed', 'Not Signed')}</span>
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
              <DropdownMenuItem>{t('view_details')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <UploadAttestation distribution={distribution} />
              <DownloadAttestation distribution={distribution} />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return columns;
};

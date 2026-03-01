"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Item } from "@/lib/definitions";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/shared/status-badge";

export type ArrivalTableItem = Item & {
  groupCount?: number;
};

export const useHardwareColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<ArrivalTableItem>[] = [
    {
      header: "#",
      cell: ({ row }) => row.index + 1,
    },
    {
      id: "article",
      accessorFn: (row) => row.article.model,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('article')} />
      ),
      cell: ({ row }) => {
        const article = row.original.article;
        return (
          <div className="flex flex-col">
            <span className="font-semibold">{article.model}</span>
            <span className="text-xs text-muted-foreground">{article.designation}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "serialNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('serial_number')} />
      ),
      cell: ({ row }) => {
        const sn = row.original.serialNumber;
        return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{sn || 'N/A'}</code>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('status')} />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return <StatusBadge status={status} />;
      },
    },
  ];

  return columns;
};

export const useConsumableColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<ArrivalTableItem>[] = [
    {
      header: "#",
      cell: ({ row }) => row.index + 1,
    },
    {
      id: "article",
      accessorFn: (row) => row.article.model,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('article')} />
      ),
      cell: ({ row }) => {
        const article = row.original.article;
        return (
          <div className="flex flex-col">
            <span className="font-semibold">{article.model}</span>
            <span className="text-xs text-muted-foreground">{article.designation}</span>
          </div>
        );
      },
    },
    {
      id: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('quantity')} />
      ),
      cell: ({ row }) => {
        return <span className="font-bold text-lg">{row.original.groupCount || 1}</span>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('status')} />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return <StatusBadge status={status} />;
      },
    },
  ];

  return columns;
};

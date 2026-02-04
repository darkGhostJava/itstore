
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Item } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";

export const useArrivalItemColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<Item>[] = [
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
            <Link href={`/articles/${article.id}`} className="font-semibold hover:underline">
              {article.model}
            </Link>
            <span className="text-xs text-muted-foreground">{article.designation}</span>
          </div>
        );
      },
    },
    {
      id: "type",
      accessorFn: (row) => row.article.type,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('type')} />
      ),
      cell: ({ row }) => {
        const type = row.original.article.type;
        return (
          <Badge variant={type === "HARDWARE" ? "default" : "secondary"}>
            {t(type.toLowerCase() as any)}
          </Badge>
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
        if (!sn || row.original.article.type === 'CONSUMABLE') {
          return <span className="text-muted-foreground italic">N/A</span>;
        }
        return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{sn}</code>;
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

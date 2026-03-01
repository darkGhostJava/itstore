"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Operation } from "@/lib/definitions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";

export const useOperationsHistoryColumns = () => {
  const { t } = useTranslation('common');

  const columns: ColumnDef<Operation>[] = [
    {
      header: "#",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('type')} />
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        if (type === "ARRIVAL") variant = "default";
        if (type === "DISTRIBUTION") variant = "secondary";
        if (type === "REPAIR") variant = "destructive";
        
        return <Badge variant={variant}>{t(type.toLowerCase() as any, type)}</Badge>;
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
      id: "beneficiary",
      accessorFn: (row) => row.person || row.beneficiary,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('beneficiary')} />
      ),
      cell: ({ row }) => {
        const person = row.original.person || row.original.beneficiary;
        return person ? `${person.firstName} ${person.lastName}` : "N/A";
      },
    },
    {
      accessorKey: "user.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('user')} />
      ),
      cell: ({ row }) => row.original.user?.name || t('unknown'),
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('remarks')} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground italic line-clamp-1 max-w-[200px]" title={row.original.remarks}>
          {row.original.remarks || t('no_remarks')}
        </span>
      )
    },
  ];

  return columns;
};

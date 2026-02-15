
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
import { MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { RepairItemDialog } from "./repair-item-dialog";
import { ReformItemDialog } from "./reform-item-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";

type ReparationColumnProps = {
  onSuccess: () => void;
}

export const getReparationColumns = ({ onSuccess }: ReparationColumnProps): ColumnDef<Operation>[] => {
  const { t } = useTranslation('common');

  return [
    {
      header: "#",
      cell: ({ row }) => {
        return row.index + 1;
      },
    },
    {
      id: 'article',
      accessorFn: (row) => (row as any).items?.[0]?.article?.model,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('article')}/>
      ),
      cell: ({ row }) => {
        const items = (row.original as any).items as Item[] | undefined;
        if (!items || items.length === 0) return "N/A";
        const article = items[0].article;
        return article ? `${article.model} - ${article.designation}` : "N/A";
      },
    },
    {
      id: 'serialNumber',
      accessorFn: (row) => (row as any).items?.[0]?.serialNumber,
       header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('serial_number')} />
      ),
       cell: ({ row }) => {
        const items = (row.original as any).items as Item[] | undefined;
        if (!items || items.length === 0) return "N/A";
        return items[0]?.serialNumber || 'N/A';
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
      id: "user",
      accessorFn: (row) => row.user?.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('user')} />
      ),
      cell: ({ row }) => {
        return row.original.user?.name || t('unknown');
      },
    },
    {
      id: "attestation",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('attestation_status', 'Attestation')} />,
      cell: ({ row }) => {
        const isSigned = row.original.isSigned || !!row.original.decharge;
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
      id: 'status',
      accessorFn: (row) => (row as any).items?.[0]?.status,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('status')} />
      ),
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
                <span className="sr-only">{t('open_menu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
              <DropdownMenuItem>{t('view_details')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <RepairItemDialog item={item} onSuccess={onSuccess} />
              <ReformItemDialog item={item} onSuccess={onSuccess} />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};

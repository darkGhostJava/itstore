
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, FileDown, CheckCircle2, XCircle } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export const useArrivalsColumns = () => {
  const { t } = useTranslation('common');

  const handleDownloadAttestation = async (id: number) => {
    try {
      const response = await api.get(`/arrivals/${id}/attestation`, {
        responseType: "blob",
      });
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attestation_arrival_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('download_failed_toast_desc'),
      });
    }
  };

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
          const dateVal = row.original.date;
          if (Array.isArray(dateVal)) {
            return format(new Date(dateVal[0], dateVal[1] - 1, dateVal[2], dateVal[3] || 0, dateVal[4] || 0), "PPP p");
          }
          return format(new Date(dateVal), "PPP p");
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
        return <span className="font-medium">{items?.length ?? 0}</span>;
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
      id: "budget",
      accessorKey: "budget",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('budget')} />
      ),
      cell: ({ row }) => {
        const arrival = row.original;
        const budget = arrival.budget || arrival.items?.[0]?.budget || arrival.items?.[0]?.article?.budget;
        if (!budget) return 'N/A';
        const budgetKey = `budget_${budget.toLowerCase()}` as any;
        return <Badge variant="secondary">{t(budgetKey, budget)}</Badge>;
      }
    },
    {
      id: "attestation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('attestation_status', 'Attestation')} />
      ),
      cell: ({ row }) => {
        const isSigned = row.original.isSigned || !!row.original.decharge;
        return isSigned ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">{t('uploaded', 'Uploaded')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <XCircle className="h-4 w-4" />
            <span className="text-xs">{t('none', 'None')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('remarks')} />
      ),
      cell: ({ row }) => <span className="text-muted-foreground italic truncate max-w-[150px] block">{row.original.remarks || t('no_remarks')}</span>
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const arrival = row.original;
        const dateStr = Array.isArray(arrival.date) ? JSON.stringify(arrival.date) : arrival.date;
        const budget = arrival.budget || arrival.items?.[0]?.budget || arrival.items?.[0]?.article?.budget;

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
                    bg: budget,
                    dt: dateStr,
                    rm: arrival.remarks
                  }
                }}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('view_details')}
                </Link>
              </DropdownMenuItem>
              {(arrival.isSigned || !!arrival.decharge) && (
                <DropdownMenuItem onClick={() => handleDownloadAttestation(arrival.id)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  {t('download_attestation')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
};


"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Operation } from "@/lib/definitions";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useTranslation } from "react-i18next";

const TranslatedHeader = ({ column, titleKey }: { column: any, titleKey: string }) => {
  const { t } = useTranslation('common');
  return <DataTableColumnHeader column={column} title={t(titleKey)} />;
};

export const columns: ColumnDef<Operation>[] = [
  {
    header: "#",
    cell: ({ row }) => {
      return row.index + 1;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => <TranslatedHeader column={column} titleKey="type" />,
    cell: ({ row }) => {
      const type = row.original.type;
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (type === "ARRIVAL") variant = "default";
      if (type === "DISTRIBUTION") variant = "secondary";
      if (type === "REPAIR") variant = "destructive";
      
      return <Badge variant={variant}>{type}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => <TranslatedHeader column={column} titleKey="date" />,
    cell: ({ row }) => format(new Date(row.original.date), "PPP p"),
  },
  {
    accessorKey: "user.name",
    header: ({ column }) => <TranslatedHeader column={column} titleKey="user" />,
    cell: ({ row }) => {
      const { t } = useTranslation('common');
      return row.original.user?.name || t('unknown');
    },
  },
  {
    accessorKey: "person.lastName",
    header: ({ column }) => <TranslatedHeader column={column} titleKey="beneficiary" />,
    cell: ({ row }) => {
      const person = row.original.person;
      return person ? `${person.firstName} ${person.lastName}` : "N/A";
    },
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => <TranslatedHeader column={column} titleKey="remarks" />,
  },
    {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
        </div>
      );
    },
  },
];

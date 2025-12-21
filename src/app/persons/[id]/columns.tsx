
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Item } from "@/lib/definitions";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "serialNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Serial Number" />
    ),
  },
  {
    header: "Article",
    accessorKey: "article.model",
     header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Article" />
    ),
    cell: ({ row }) => {
        const article = row.original.article;
        return (
            <Button variant="link" asChild>
                <Link href={`/articles/${article.id}`}>
                    {article.model}
                </Link>
            </Button>
        )
    }
  },
  {
      accessorKey: "article.designation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Designation" />
      ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

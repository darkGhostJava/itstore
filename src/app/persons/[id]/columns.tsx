
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Item } from "@/lib/definitions";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "serialNumber",
    header: "Serial Number",
  },
  {
    header: "Article",
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
      header: "Designation"
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];


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
import { MoreHorizontal } from "lucide-react";
import { UploadAttestation } from "./upload-attestation";
import { DownloadAttestation } from "./download-attestation";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

export const columns: ColumnDef<Distribution>[] = [
  {
    header: "#",
    cell: ({ row }) => {
      return row.index + 1;
    },
  },
  {
    accessorKey: "item.article.model",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Article" />
    ),
    cell: ({ row }) => {
      return row.original.item ? `${row.original.item.article.model} - ${row.original.item.article.designation}` : "N/A";
    },
  },
  {
    accessorKey: "item.serialNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Serial Number" />
    ),
    cell: ({ row }) => {
      return row.original.item ? `${row.original.item.serialNumber}` : "N/A";
    },
  },
  {
    accessorKey: "person.firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Beneficiary" />
    ),
    cell: ({ row }) => {
      return row.original.person ? `${row.original.person.firstName} ${row.original.person.lastName}` : "N/A";
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => format(new Date(row.original.date), "PPP"),
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Remarks" />
    ),
  },
  {
    accessorKey: "user.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      return row.original.user ? `${row.original.user.name}`: "N/A";
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
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <UploadAttestation distribution={distribution} />
            <DownloadAttestation distribution={distribution} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

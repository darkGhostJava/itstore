
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table"
import { Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  fetchData: (options: { pageIndex: number, pageSize: number, query?: string, sort?: string }) => void
  isLoading?: boolean
  filterKey?: string
  filterPlaceholder?: string
  facetedFilters?: React.ReactNode
  initialQuery?: string;
  emptyStateMessage?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns = [],
  data = [],
  pageCount = 0,
  fetchData,
  isLoading = false,
  filterKey,
  filterPlaceholder,
  facetedFilters,
  initialQuery = "",
  emptyStateMessage = "No data available."
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    })

  const [query, setQuery] = React.useState(initialQuery);
  const debouncedQuery = useDebounce(query, 500);

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );
  
  // Create refs to store previous sorting and query values
  const prevSortingRef = React.useRef(sorting);
  const prevDebouncedQueryRef = React.useRef(debouncedQuery);

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  React.useEffect(() => {
    // Check if sorting or query has changed since the last render
    const sortChanged = JSON.stringify(prevSortingRef.current) !== JSON.stringify(sorting);
    const queryChanged = prevDebouncedQueryRef.current !== debouncedQuery;
    
    // If sorting or filtering changed, we need to fetch page 0.
    const pageToFetch = (sortChanged || queryChanged) ? 0 : pageIndex;
    
    let sortString: string | undefined = undefined;
    if (sorting.length > 0) {
      const sort = sorting[0];
      const direction = sort.desc ? 'desc' : 'asc';
      sortString = `${sort.id},${direction}`;
    }

    // Call the fetchData prop with the correct page index and other params.
    fetchData({ pageIndex: pageToFetch, pageSize, query: debouncedQuery, sort: sortString });
    
    // If we're fetching a different page index than the one in state, update the state.
    // This happens when a sort/filter change resets the page to 0.
    if (pageToFetch !== pageIndex) {
      setPagination(p => ({ ...p, pageIndex: pageToFetch }));
    }

    // Update refs for the next render.
    prevSortingRef.current = sorting;
    prevDebouncedQueryRef.current = debouncedQuery;
  }, [pageIndex, pageSize, debouncedQuery, sorting, fetchData]);


  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        filterKey={filterKey}
        filterPlaceholder={filterPlaceholder}
        facetedFilters={facetedFilters}
        query={query}
        onQueryChange={setQuery}
      />
      <div className="rounded-md border relative">
         {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={cn(isLoading && "opacity-50")}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

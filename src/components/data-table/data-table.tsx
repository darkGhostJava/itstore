
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
  OnChangeFn,
} from "@tanstack/react-table"
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const MotionTableRow = motion(TableRow);

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
    },
  }),
};

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

  // We use a ref for fetchData to keep the fetching effect stable
  const fetchDataRef = React.useRef(fetchData);
  React.useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Track the last fetched parameters to prevent infinite loops
  const lastFetchedParamsRef = React.useRef<string>("");

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const onSortingChange: OnChangeFn<SortingState> = React.useCallback((updater) => {
    setSorting(updater);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const onPaginationChange: OnChangeFn<PaginationState> = React.useCallback((updater) => {
    setPagination(updater);
  }, []);

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
    onSortingChange: onSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Reset page when query changes
  React.useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }));
  }, [debouncedQuery]);

  // Main data fetching effect
  React.useEffect(() => {
    let sortString: string | undefined = undefined;
    if (sorting.length > 0) {
      const sort = sorting[0];
      const direction = sort.desc ? 'desc' : 'asc';
      sortString = `${sort.id},${direction}`;
    }

    const currentParams = JSON.stringify({ pageIndex, pageSize, debouncedQuery, sortString });
    
    if (currentParams !== lastFetchedParamsRef.current) {
      lastFetchedParamsRef.current = currentParams;
      fetchDataRef.current({ 
        pageIndex, 
        pageSize, 
        query: debouncedQuery, 
        sort: sortString 
      });
    }
  }, [pageIndex, pageSize, debouncedQuery, sorting]);

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
      <div className="rounded-md border relative bg-card overflow-hidden">
         <AnimatePresence>
           {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
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
          <TableBody className={cn(isLoading && "opacity-50 transition-opacity")}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, i) => (
                <MotionTableRow
                  key={row.id}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="show"
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </MotionTableRow>
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

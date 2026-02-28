"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { useReparationColumns } from "./columns";
import { fetchReparations, exportReparationsStats } from "@/lib/data";
import type { Operation } from "@/lib/definitions";
import { AddReparation } from "./add-reparation";
import { useTranslation } from "react-i18next";
import { Wrench, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, add } from "date-fns";

export default function ReparationsPage() {
  const [data, setData] = React.useState<Operation[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  
  const { t } = useTranslation('common');
  const { toast } = useToast();

  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; sort?:string; from?: string; to?: string; }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort, from, to }: { pageIndex: number; pageSize: number; query?: string; sort?: string; from?: string; to?: string; }) => {
    setIsLoading(true);
    try {
      const result = await fetchReparations({ pageIndex, pageSize, query, sort, from, to });
      setData(result.data);
      setPageCount(result.pageCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  fetchDataRef.current = fetchData;
  
  const handleSuccess = React.useCallback(() => {
    if (fetchDataRef.current) {
      fetchDataRef.current({ pageIndex: 0, pageSize: 10 });
    }
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportReparationsStats();
      toast({ title: "Success", description: "Report downloaded successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate report." });
    } finally {
      setIsExporting(false);
    }
  };

  const columns = useReparationColumns({ onSuccess: handleSuccess });

  const fromDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd'T'HH:mm:ss") : undefined;
  const toDate = dateRange?.to ? format(add(dateRange.to, { days: 1 }), "yyyy-MM-dd'T'HH:mm:ss") : undefined;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t('reparations')}
        actions={
          <div className="flex items-center gap-2">
            <DateRangePicker date={dateRange} setDate={setDateRange} />
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <FileDown className="mr-2 h-4 w-4" />
              {isExporting ? t('exporting') : t('export_to_word')}
            </Button>
            <AddReparation onSuccess={handleSuccess} />
          </div>
        }
      />
      <DataTable 
        columns={columns} 
        data={data}
        pageCount={pageCount}
        fetchData={fetchData}
        isLoading={isLoading}
        filterKey="serial number" 
        filterPlaceholder={t('filter_by_serial_number_placeholder')}
        startDate={fromDate}
        endDate={toDate}
        emptyStateMessage={
            <div className="flex flex-col items-center justify-center space-y-2">
                <Wrench className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No items currently under repair.</p>
            </div>
        }
      />
    </div>
  );
}

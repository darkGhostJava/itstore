
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { useDistributionsColumns } from "./columns";
import { fetchDistributions, exportDistributionsStats } from "@/lib/data";
import { AddDistribution } from "./add-distribution";
import type { Distribution } from "@/lib/definitions";
import { useTranslation } from "react-i18next";
import { ArrowRightLeft, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DistributionsPage() {
  const [data, setData] = React.useState<Distribution[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);
  const { t } = useTranslation('common');
  const columns = useDistributionsColumns();
  const { toast } = useToast();

  const fetchDataRef = React.useRef<((options: { pageIndex: number; pageSize: number; query?: string; sort?: string }) => Promise<void>) | null>(null);

  const fetchData = React.useCallback(async ({ pageIndex, pageSize, query, sort }: { pageIndex: number; pageSize: number; query?: string; sort?:string }) => {
    setIsLoading(true);
    try {
      const result = await fetchDistributions({ pageIndex, pageSize, query, sort });
      setData(result.data);
      setPageCount(result.pageCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  fetchDataRef.current = fetchData;
  
  React.useEffect(() => {
    fetchData({ pageIndex: 0, pageSize: 10 });
  }, [fetchData]);

  const handleSuccess = () => {
    if (fetchDataRef.current) {
      fetchDataRef.current({ pageIndex: 0, pageSize: 10 });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportDistributionsStats();
      toast({ title: "Success", description: "Report downloaded successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate report." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t('distributions')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <FileDown className="mr-2 h-4 w-4" />
              {isExporting ? t('exporting') : t('export_to_word')}
            </Button>
            <AddDistribution onSuccess={handleSuccess} />
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
        emptyStateMessage={
            <div className="flex flex-col items-center justify-center space-y-2">
                <ArrowRightLeft className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No distributions have been made yet.</p>
            </div>
        }
      />
    </div>
  );
}


"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { Operation } from "@/lib/definitions";
import { fetchArrivalById } from "@/lib/data";
import { useTranslation } from "react-i18next";
import { format, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useArrivalItemColumns } from "./item-columns";
import { Package, Calendar, User, Wallet } from "lucide-react";

export default function ArrivalDetailPage() {
  const { t } = useTranslation('common');
  const params = useParams<{ id: string }>();
  const arrivalId = parseInt(params.id);
  const [arrival, setArrival] = React.useState<Operation | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);
  
  const columns = useArrivalItemColumns();

  React.useEffect(() => {
    setIsMounted(true);
    const getArrival = async () => {
      if (!arrivalId) return;
      try {
        setIsLoading(true);
        const fetchedArrival = await fetchArrivalById(arrivalId);
        setArrival(fetchedArrival);
      } catch (error) {
        console.error("Failed to fetch arrival:", error);
        setArrival(null);
      } finally {
        setIsLoading(false);
      }
    };
    getArrival();
  }, [arrivalId]);

  // Handle Spring Boot array dates [yyyy, mm, dd, hh, mm, ss] or standard strings
  const parseSafeDate = (dateVal: any): Date | null => {
    if (!dateVal) return null;
    if (Array.isArray(dateVal)) {
      return new Date(dateVal[0], dateVal[1] - 1, dateVal[2], dateVal[3] || 0, dateVal[4] || 0);
    }
    const d = new Date(dateVal);
    return isValid(d) ? d : null;
  };

  const formattedDate = React.useMemo(() => {
    if (!arrival?.date) return "";
    const d = parseSafeDate(arrival.date);
    return d ? format(d, "PPP p") : String(arrival.date);
  }, [arrival?.date]);

  if (!isMounted || isLoading) {
    return <div className="p-8 text-center">{t('loading', 'Loading details...')}</div>;
  }

  if (!arrival) {
    notFound();
  }

  const items = arrival.items || [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`${t('arrival_details', 'Arrival Details')} #${arrival.id}`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('information', 'Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{t('date')}:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{t('user')}:</span>
                <span>{arrival.user?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{t('budget')}:</span>
                <Badge variant="secondary">
                  {arrival.budget ? t(`budget_${arrival.budget.toLowerCase()}` as any, arrival.budget) : 'N/A'}
                </Badge>
              </div>
              <div className="pt-2 border-t text-sm">
                <p className="font-semibold mb-1">{t('remarks')}:</p>
                <p className="text-muted-foreground italic">{arrival.remarks || t('no_remarks')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('total_items', 'Total Items')}</CardDescription>
              <CardTitle className="text-4xl">{items.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('arrived_articles')}</CardTitle>
              <CardDescription>{t('arrived_articles_list_desc', 'List of all individual items received in this shipment.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={items}
                pageCount={1}
                fetchData={() => {}} // Local data, no pagination needed for detail view currently
                isLoading={false}
                filterKey="serialNumber" 
                filterPlaceholder={t('filter_by_serial_number_placeholder')}
                emptyStateMessage={
                    <div className="flex flex-col items-center justify-center space-y-2 py-10">
                        <Package className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">{t('no_items_found', 'No items found in this arrival.')}</p>
                    </div>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Operation } from "@/lib/definitions";
import { fetchArrivalById } from "@/lib/data"; // Re-using arrival fetcher as it returns generic Operation with items
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Building, Package } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DistributionDetailPage() {
  const { t } = useTranslation('common');
  const params = useParams<{ id: string }>();
  const id = params.id ? parseInt(params.id, 10) : null;
  
  const [data, setData] = React.useState<Operation | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const getData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        // Assuming backend provides a similar structure for distribution detail
        const result = await fetchArrivalById(id);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch distribution:", error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    getData();
  }, [id]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`${t('distribution')} #${id}`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{t('date')}:</span>
                <span>{format(new Date(data.date), "PPP p")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{t('beneficiary')}:</span>
                <span>{data.person?.firstName} {data.person?.lastName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{t('structure')}:</span>
                <span>{data.person?.structure?.name || 'N/A'}</span>
              </div>
              <div className="pt-2 border-t text-sm">
                <p className="font-semibold mb-1">{t('remarks')}:</p>
                <p className="text-muted-foreground italic">{data.remarks || t('no_remarks')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('distributed_items')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('article')}</TableHead>
                    <TableHead>{t('serial_number')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.article.model}</div>
                        <div className="text-xs text-muted-foreground">{item.article.designation}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.serialNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

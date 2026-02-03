
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Operation } from "@/lib/definitions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";

interface ViewArrivalDetailsDialogProps {
  arrival: Operation;
}

export function ViewArrivalDetailsDialog({ arrival }: ViewArrivalDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('common');
  const items = arrival.items || [];

  // Group items by article
  const groupedItems = items.reduce((acc, item) => {
    const key = item.article.id;
    if (!acc[key]) {
      acc[key] = {
        article: item.article,
        serials: [],
        count: 0
      };
    }
    if (item.serialNumber) {
      acc[key].serials.push(item.serialNumber);
    }
    acc[key].count++;
    return acc;
  }, {} as Record<number, { article: any, serials: string[], count: number }>);

  return (
    <>
      <DropdownMenuItem onSelect={(e) => {
        e.preventDefault();
        setOpen(true);
      }}>
        <Eye className="mr-2 h-4 w-4" />
        {t('view_details')}
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('arrival_details', 'Arrival Details')} - #{arrival.id}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6 bg-muted/30 p-4 rounded-lg">
            <div className="space-y-1">
              <p className="font-semibold text-muted-foreground">{t('date')}</p>
              <p className="font-medium">{format(new Date(arrival.date), "PPP p")}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-muted-foreground">{t('user')}</p>
              <p className="font-medium">{arrival.user?.name}</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-muted-foreground">{t('budget')}</p>
              <Badge variant="secondary">
                  {arrival.budget ? t(`budget_${arrival.budget.toLowerCase()}` as any, arrival.budget) : 'N/A'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-muted-foreground">{t('remarks')}</p>
              <p className="italic text-muted-foreground">{arrival.remarks || t('no_remarks')}</p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <h3 className="font-semibold px-1">{t('arrived_articles')}</h3>
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[300px]">{t('article')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead>{t('details', 'Details')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(groupedItems).length > 0 ? (
                    Object.values(groupedItems).map(({ article, serials, count }) => (
                      <TableRow key={article.id}>
                        <TableCell className="align-top">
                          <div className="font-semibold">{article.model}</div>
                          <div className="text-xs text-muted-foreground">{article.designation}</div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant={article.type === 'HARDWARE' ? 'default' : 'secondary'}>
                            {t(article.type.toLowerCase() as any)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {article.type === 'HARDWARE' ? (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {serials.map(s => (
                                <Badge key={s} variant="outline" className="text-[10px] font-mono py-0">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="font-medium text-lg">
                              {count} <span className="text-sm font-normal text-muted-foreground">units</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                        No items found in this operation.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

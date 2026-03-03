
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Item, Person, Structure } from "@/lib/definitions";
import { getAllDirections, getPersonsByIdStructure, registerReversals } from "@/lib/data";
import { api } from "@/lib/api";
import { ArrowRightLeft, Undo2, Loader2 } from "lucide-react";

interface ItemActionsProps {
  item: Item;
  onSuccess: () => void;
}

const distributeFormSchema = z.object({
  directionId: z.string().min(1, "direction_is_required"),
  personId: z.string().min(1, "beneficiary_is_required"),
  remarks: z.string().optional(),
});

const refundFormSchema = z.object({
  remarks: z.string().min(1, "remarks_are_required"),
});

export function ItemActions({ item, onSuccess }: ItemActionsProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);

  const isInStock = item.status === 'IN_STOCK' || item.status === 'IN_STOCK_NEW';
  const isDistributed = item.status === 'DISTRIBUTED';

  const distributeForm = useForm<z.infer<typeof distributeFormSchema>>({
    resolver: zodResolver(distributeFormSchema),
    defaultValues: { directionId: "", personId: "", remarks: "" },
  });

  const refundForm = useForm<z.infer<typeof refundFormSchema>>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: { remarks: "" },
  });

  // Load directions when dialog opens
  useEffect(() => {
    if (distributeOpen) {
      (async () => {
        try {
          const res = await getAllDirections();
          setDirections(res.data || []);
        } catch (error) {
          console.error("Failed to load directions", error);
        }
      })();
    }
  }, [distributeOpen]);

  const selectedDirectionId = distributeForm.watch("directionId");

  // Load persons when direction is selected
  useEffect(() => {
    if (selectedDirectionId) {
      (async () => {
        try {
          const res = await getPersonsByIdStructure(parseInt(selectedDirectionId, 10));
          setPersons(res || []);
        } catch (error) {
          console.error("Failed to load persons", error);
          setPersons([]);
        }
      })();
    } else {
      setPersons([]);
    }
  }, [selectedDirectionId]);

  async function onDistributeSubmit(values: z.infer<typeof distributeFormSchema>) {
    if (!item.serialNumber && item.article.type === 'HARDWARE') {
      toast({ title: t('error'), description: "Hardware must have a serial number to be distributed.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        personId: parseInt(values.personId, 10),
        remarks: values.remarks || "",
        userId: 1, // Current logged-in user placeholder
        hardwares: item.article.type === 'HARDWARE' ? { [item.article.id]: [item.serialNumber!] } : {},
        consumables: item.article.type === 'CONSUMABLE' ? { [item.article.id]: 1 } : {},
        subDirectionId: parseInt(values.directionId, 10),
      };

      const response = await api.post("/distributions", payload, {
        responseType: "arraybuffer",
      });

      // Handle PDF download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `decharge_${item.serialNumber || 'item'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: t('distribution_added_toast_title'), description: t('distribution_added_toast_desc') });
      setDistributeOpen(false);
      distributeForm.reset();
      onSuccess();
    } catch (error) {
      console.error("Distribution error:", error);
      toast({ title: t('error'), description: t('add_distribution_error'), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function onRefundSubmit(values: z.infer<typeof refundFormSchema>) {
    setLoading(true);
    try {
      const payload = {
        itemIds: [item.id],
        personId: 1, // Placeholder for the system/current holder
        remarks: values.remarks,
      };

      await registerReversals(payload);

      toast({ title: t('reversal_added_toast_title'), description: t('reversal_added_toast_desc') });
      setRefundOpen(false);
      refundForm.reset();
      onSuccess();
    } catch (error) {
      console.error("Refund error:", error);
      toast({ title: t('error'), description: t('add_reversal_error'), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {isInStock && (
        <Dialog open={distributeOpen} onOpenChange={setDistributeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md">
              <ArrowRightLeft className="h-4 w-4" />
              {t('add_distribution')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('add_new_distribution')}</DialogTitle>
              <DialogDescription>{t('add_new_distribution_desc')}</DialogDescription>
            </DialogHeader>
            <Form {...distributeForm}>
              <form onSubmit={distributeForm.handleSubmit(onDistributeSubmit)} className="space-y-4">
                <FormField
                  control={distributeForm.control}
                  name="directionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('structure')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_structure_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {directions.map((d) => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage>{distributeForm.formState.errors.directionId && t(distributeForm.formState.errors.directionId.message as any)}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={distributeForm.control}
                  name="personId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('beneficiary')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDirectionId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_beneficiary_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {persons.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.grade} {p.firstName} {p.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage>{distributeForm.formState.errors.personId && t(distributeForm.formState.errors.personId.message as any)}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={distributeForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('remarks')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('add_remarks_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('saving')}</> : t('save_distribution')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {isDistributed && (
        <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 shadow-sm">
              <Undo2 className="h-4 w-4" />
              {t('add_reversal')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('add_new_reversal')}</DialogTitle>
              <DialogDescription>{t('add_reversal_desc')}</DialogDescription>
            </DialogHeader>
            <Form {...refundForm}>
              <form onSubmit={refundForm.handleSubmit(onRefundSubmit)} className="space-y-4">
                <FormField
                  control={refundForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('remarks')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('add_remarks_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage>{refundForm.formState.errors.remarks && t(refundForm.formState.errors.remarks.message as any)}</FormMessage>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={loading} variant="destructive" className="w-full">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('saving')}</> : t('save_reversal')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

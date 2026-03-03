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
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Item, Person, Structure } from "@/lib/definitions";
import { getAllDirections, getPersonsByIdStructure, registerReversals, searchPersons, getSubDirectionsOfDirection } from "@/lib/data";
import { api } from "@/lib/api";
import { ArrowRightLeft, Undo2, Check, ChevronsUpDown, User, Package, Hash } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";

interface ItemActionsProps {
  item: Item;
  onSuccess: () => void;
}

const distributeFormSchema = z.object({
  directionId: z.string().min(1, "direction_is_required"),
  subDirectionId: z.string().optional(),
  personId: z.string().min(1, "beneficiary_is_required"),
  remarks: z.string().optional(),
});

const refundFormSchema = z.object({
  structureId: z.string().min(1, "direction_is_required"),
  personId: z.string().min(1, "beneficiary_is_required"),
  remarks: z.string().min(1, "remarks_are_required"),
  attestationId: z.string().optional(),
});

export function ItemActions({ item, onSuccess }: ItemActionsProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [directions, setDirections] = useState<Structure[]>([]);
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  
  // Distribution Specific States
  const [distPersons, setDistPersons] = useState<Person[]>([]);
  const [distSearch, setDistSearch] = useState("");
  const [isDistPopoverOpen, setDistPopoverOpen] = useState(false);

  // Refund Specific States
  const [refundPersons, setRefundPersons] = useState<Person[]>([]);
  const [refundSearch, setRefundSearch] = useState("");
  const [isRefundPopoverOpen, setRefundPopoverOpen] = useState(false);

  const isInStock = item.status === 'IN_STOCK' || item.status === 'IN_STOCK_NEW' || item.status === 'REPAIRED';
  const isDistributed = item.status === 'DISTRIBUTED';

  const distributeForm = useForm<z.infer<typeof distributeFormSchema>>({
    resolver: zodResolver(distributeFormSchema),
    defaultValues: { directionId: "", subDirectionId: "", personId: "", remarks: "" },
  });

  const refundForm = useForm<z.infer<typeof refundFormSchema>>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: { structureId: "", personId: "", remarks: "", attestationId: "" },
  });

  // Load directions globally when either modal opens
  useEffect(() => {
    if (distributeOpen || refundOpen) {
      (async () => {
        try {
          const res = await getAllDirections();
          setDirections(res.data || []);
        } catch (error) {
          console.error("Failed to load directions", error);
        }
      })();
    }
  }, [distributeOpen, refundOpen]);

  // DISTRIBUTION: Handle direction change
  const selectedDistDirectionId = distributeForm.watch("directionId");
  useEffect(() => {
    if (selectedDistDirectionId) {
      (async () => {
        const [subRes, personsRes] = await Promise.all([
          getSubDirectionsOfDirection(parseInt(selectedDistDirectionId, 10)),
          getPersonsByIdStructure(parseInt(selectedDistDirectionId, 10))
        ]);
        setSubDirections(subRes.data || []);
        setDistPersons(personsRes || []);
      })();
    } else {
      setSubDirections([]);
      setDistPersons([]);
    }
  }, [selectedDistDirectionId]);

  // DISTRIBUTION: Person search logic
  useEffect(() => {
    const fetchDistData = async () => {
        if (distSearch && selectedDistDirectionId) {
            const res = await searchPersons(distSearch, selectedDistDirectionId);
            setDistPersons(res.data || []);
        } else if (selectedDistDirectionId) {
            const personsRes = await getPersonsByIdStructure(parseInt(selectedDistDirectionId, 10));
            setDistPersons(personsRes);
        }
    };

    if (isDistPopoverOpen && selectedDistDirectionId) {
        const debounce = setTimeout(fetchDistData, 300);
        return () => clearTimeout(debounce);
    }
  }, [distSearch, selectedDistDirectionId, isDistPopoverOpen]);

  // REFUND: Handle direction change
  const selectedRefundDirectionId = refundForm.watch("structureId");
  useEffect(() => {
    if (selectedRefundDirectionId) {
      (async () => {
        const personsRes = await getPersonsByIdStructure(parseInt(selectedRefundDirectionId, 10));
        setRefundPersons(personsRes || []);
      })();
    } else {
      setRefundPersons([]);
    }
  }, [selectedRefundDirectionId]);

  // REFUND: Person search logic
  useEffect(() => {
    const fetchRefundData = async () => {
        if (refundSearch && selectedRefundDirectionId) {
            const res = await searchPersons(refundSearch, selectedRefundDirectionId);
            setRefundPersons(res.data || []);
        } else if (selectedRefundDirectionId) {
            const personsRes = await getPersonsByIdStructure(parseInt(selectedRefundDirectionId, 10));
            setRefundPersons(personsRes);
        }
    };

    if (isRefundPopoverOpen && selectedRefundDirectionId) {
        const debounce = setTimeout(fetchRefundData, 300);
        return () => clearTimeout(debounce);
    }
  }, [refundSearch, selectedRefundDirectionId, isRefundPopoverOpen]);

  async function onDistributeSubmit(values: z.infer<typeof distributeFormSchema>) {
    setLoading(true);
    try {
      const payload = {
        personId: parseInt(values.personId, 10),
        remarks: values.remarks || "",
        userId: 1,
        hardwares: item.article.type === 'HARDWARE' ? { [item.article.id]: [item.serialNumber!] } : {},
        consumables: item.article.type === 'CONSUMABLE' ? { [item.article.id]: 1 } : {},
        subDirectionId: values.subDirectionId ? parseInt(values.subDirectionId, 10) : parseInt(values.directionId, 10),
      };

      const response = await api.post("/distributions", payload, {
        responseType: "arraybuffer",
      });

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
        personId: parseInt(values.personId, 10),
        remarks: values.remarks,
        attestationId: values.attestationId,
      };

      await registerReversals(payload);

      toast({ title: t('reversal_added_toast_title'), description: t('reversal_added_toast_desc') });
      setRefundOpen(false);
      refundForm.reset();
      onSuccess();
    } catch (error) {
      toast({ title: t('error'), description: t('add_reversal_error'), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {/* Distribute Modal */}
      {isInStock && (
        <Dialog open={distributeOpen} onOpenChange={setDistributeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg hover:scale-105 transition-transform">
              <ArrowRightLeft className="h-4 w-4" />
              {t('add_distribution')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>{t('add_new_distribution')}</DialogTitle>
              <DialogDescription>{t('add_new_distribution_desc')}</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[80vh] p-6 pt-2">
              <div className="mb-6 p-4 rounded-xl border bg-muted/30 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-background shadow-sm border border-border/50">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-bold leading-tight">{item.article.model}</p>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">{item.article.designation} — {item.serialNumber || 'N/A'}</span>
                </div>
                <Badge className="ml-auto text-[10px] px-2 h-5" variant="secondary">READY</Badge>
              </div>

              <Form {...distributeForm}>
                <form onSubmit={distributeForm.handleSubmit(onDistributeSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={distributeForm.control}
                      name="directionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('structure')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder={t('select_structure_placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {directions.map((d) => (
                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={distributeForm.control}
                      name="subDirectionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {t('sub_direction')} <span className="lowercase italic font-normal">({t('optional')})</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDistDirectionId || subDirections.length === 0}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder={t('select_sub_direction_placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subDirections.map((sub) => (
                                <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={distributeForm.control}
                    name="personId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('beneficiary')}</FormLabel>
                        <Popover open={isDistPopoverOpen} onOpenChange={setDistPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={!selectedDistDirectionId}
                                className={cn("w-full justify-between h-12 text-left bg-background font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value
                                  ? distPersons.find((p) => p.id.toString() === field.value)?.firstName + " " + distPersons.find((p) => p.id.toString() === field.value)?.lastName || "Loading..."
                                  : t('select_beneficiary_placeholder')}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput placeholder={t('search_person_placeholder')} onValueChange={setDistSearch} />
                              <CommandList>
                                <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                                <CommandGroup>
                                  {distPersons.map((person) => (
                                    <CommandItem key={person.id} value={person.id.toString()} onSelect={() => { distributeForm.setValue("personId", person.id.toString()); setDistPopoverOpen(false); }} className="py-3">
                                      <Check className={cn("mr-2 h-4 w-4 text-primary", person.id.toString() === field.value ? "opacity-100" : "opacity-0")} />
                                      <div className="flex flex-col">
                                        <span className="font-semibold">{person.grade} {person.firstName} {person.lastName}</span>
                                        {person.pseudo && <span className="text-[10px] text-primary/70 font-mono">@{person.pseudo}</span>}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={distributeForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('remarks')}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t('add_remarks_placeholder')} {...field} className="min-h-[100px] resize-none bg-background rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={loading || !selectedDistDirectionId} size="lg" className="w-full h-12 text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 rounded-xl">
                      {loading ? t('saving') : t('confirm_distribution')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* Refund (Reversal) Modal */}
      {isDistributed && (
        <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 shadow-sm border-primary/20 text-primary hover:bg-primary/5">
              <Undo2 className="h-4 w-4" />
              {t('add_reversal')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>{t('add_new_reversal')}</DialogTitle>
              <DialogDescription>{t('add_reversal_desc')}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh] p-6 pt-2">
              <div className="mb-6 p-4 rounded-xl border bg-muted/30 flex items-center gap-4 border-amber-500/20">
                <div className="p-2.5 rounded-lg bg-background shadow-sm border border-border/50">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-bold leading-tight">{item.article.model}</p>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">{item.article.designation} — {item.serialNumber || 'N/A'}</span>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <Form {...refundForm}>
                <form onSubmit={refundForm.handleSubmit(onRefundSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={refundForm.control}
                      name="structureId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('structure')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder={t('select_structure_placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {directions.map((d) => (
                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={refundForm.control}
                      name="attestationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Hash className="h-3 w-3" />
                            {t('attestation_id')}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ATT-2024-001" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={refundForm.control}
                    name="personId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('returned_by')}</FormLabel>
                        <Popover open={isRefundPopoverOpen} onOpenChange={setRefundPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={!selectedRefundDirectionId}
                                className={cn("w-full justify-between h-12 text-left bg-background font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value
                                  ? refundPersons.find((p) => p.id.toString() === field.value)?.firstName + " " + refundPersons.find((p) => p.id.toString() === field.value)?.lastName || "Loading..."
                                  : t('select_beneficiary_placeholder')}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput placeholder={t('search_person_placeholder')} onValueChange={setRefundSearch} />
                              <CommandList>
                                <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                                <CommandGroup>
                                  {refundPersons.map((person) => (
                                    <CommandItem key={person.id} value={person.id.toString()} onSelect={() => { refundForm.setValue("personId", person.id.toString()); setRefundPopoverOpen(false); }} className="py-3">
                                      <Check className={cn("mr-2 h-4 w-4 text-primary", person.id.toString() === field.value ? "opacity-100" : "opacity-0")} />
                                      <div className="flex flex-col">
                                        <span className="font-semibold">{person.grade} {person.firstName} {person.lastName}</span>
                                        {person.pseudo && <span className="text-[10px] text-primary/70 font-mono">@{person.pseudo}</span>}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={refundForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('remarks')}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t('add_remarks_placeholder')} {...field} className="bg-background resize-none min-h-[100px] rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={loading || !selectedRefundDirectionId} size="lg" className="w-full h-12 text-sm font-bold uppercase tracking-widest shadow-xl rounded-xl">
                      {loading ? t('saving') : t('save_reversal')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
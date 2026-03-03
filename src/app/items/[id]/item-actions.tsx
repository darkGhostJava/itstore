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
import { ArrowRightLeft, Undo2, Loader2, Check, ChevronsUpDown, ChevronRight, ChevronLeft, User, Package, FileText, Hash } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";

interface ItemActionsProps {
  item: Item;
  onSuccess: () => void;
}

const steps = [
  { id: "beneficiary", title: "Beneficiary", icon: User },
  { id: "articles", title: "Articles", icon: Package },
  { id: "review", title: "Review", icon: FileText },
];

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
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [directions, setDirections] = useState<Structure[]>([]);
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  
  const [personSearch, setPersonSearch] = useState("");
  const [isPersonPopoverOpen, setPersonPopoverOpen] = useState(false);

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

  // Load directions
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
      setStep(0);
    }
  }, [distributeOpen, refundOpen]);

  // Handle Distribute logic
  const selectedDirectionId = distributeForm.watch("directionId");
  useEffect(() => {
    if (selectedDirectionId) {
      (async () => {
        const [subRes, personsRes] = await Promise.all([
          getSubDirectionsOfDirection(parseInt(selectedDirectionId, 10)),
          getPersonsByIdStructure(parseInt(selectedDirectionId, 10))
        ]);
        setSubDirections(subRes.data || []);
        setPersons(personsRes || []);
      })();
    } else {
      setSubDirections([]);
      setPersons([]);
    }
  }, [selectedDirectionId]);

  // Handle Refund logic
  const refundDirectionId = refundForm.watch("structureId");
  useEffect(() => {
    if (refundDirectionId) {
      (async () => {
        const personsRes = await getPersonsByIdStructure(parseInt(refundDirectionId, 10));
        setPersons(personsRes || []);
      })();
    } else {
      setPersons([]);
    }
  }, [refundDirectionId]);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 0) fieldsToValidate = ["directionId", "personId"];
    const isValid = await distributeForm.trigger(fieldsToValidate);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

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
      {isInStock && (
        <Dialog open={distributeOpen} onOpenChange={setDistributeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg hover:scale-105 transition-transform">
              <ArrowRightLeft className="h-4 w-4" />
              {t('add_distribution')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-hidden p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>{t('add_new_distribution')}</DialogTitle>
              <DialogDescription>{t('add_new_distribution_desc')}</DialogDescription>
            </DialogHeader>

            {/* Wizard Progress */}
            <div className="px-6 py-4 flex items-center justify-between bg-muted/30 border-y">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-initial">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    step === i ? "bg-primary text-primary-foreground shadow-md scale-110" : (step > i ? "bg-green-500 text-white" : "bg-muted text-muted-foreground")
                  )}>
                    {step > i ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn("text-xs font-medium", step === i ? "text-primary font-bold" : "text-muted-foreground")}>
                    {t(s.id as any, s.title)}
                  </span>
                  {i < steps.length - 1 && <div className="h-px bg-border flex-1 mx-2" />}
                </div>
              ))}
            </div>

            <ScrollArea className="max-h-[60vh] p-6">
              <Form {...distributeForm}>
                <form onSubmit={distributeForm.handleSubmit(onDistributeSubmit)} className="space-y-6">
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={distributeForm.control}
                            name="directionId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('structure')}</FormLabel>
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
                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  {t('sub_direction')} <span className="text-[10px] font-normal lowercase italic">({t('optional')})</span>
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDirectionId || subDirections.length === 0}>
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
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('beneficiary')}</FormLabel>
                              <Popover open={isPersonPopoverOpen} onOpenChange={setPersonPopoverOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      disabled={!selectedDirectionId}
                                      className={cn("w-full justify-between h-12 text-left bg-background", !field.value && "text-muted-foreground")}
                                    >
                                      {field.value
                                        ? persons.find((p) => p.id.toString() === field.value)?.firstName + " " + persons.find((p) => p.id.toString() === field.value)?.lastName
                                        : t('select_beneficiary_placeholder')}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                                  <Command shouldFilter={false}>
                                    <CommandInput placeholder={t('search_person_placeholder')} onValueChange={setPersonSearch} />
                                    <CommandList>
                                      <ScrollArea className="max-h-56">
                                        <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                                        <CommandGroup>
                                          {persons.map((person) => (
                                            <CommandItem key={person.id} value={person.id.toString()} onSelect={() => { distributeForm.setValue("personId", person.id.toString()); setPersonPopoverOpen(false); }} className="py-3">
                                              <Check className={cn("mr-2 h-4 w-4 text-primary", person.id.toString() === field.value ? "opacity-100" : "opacity-0")} />
                                              <div className="flex flex-col">
                                                <span className="font-semibold">{person.grade} {person.firstName} {person.lastName}</span>
                                                {person.pseudo && <span className="text-[10px] text-primary/70 font-mono tracking-tighter">@{person.pseudo}</span>}
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </ScrollArea>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}

                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="rounded-xl border bg-card p-4 shadow-sm relative group border-primary/30">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm leading-tight">{item.article.model}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{item.article.designation}</span>
                            </div>
                            <Badge variant="secondary" className="ml-auto font-mono text-[10px]">{item.serialNumber || 'N/A'}</Badge>
                          </div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl text-center border-2 border-dashed">
                          <p className="text-xs text-muted-foreground">{t('distributing_single_item_confirm', 'You are distributing this specific item.')}</p>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="rounded-2xl border bg-primary/5 p-5 space-y-4 shadow-sm border-primary/10">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t('summary', 'Summary')}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('beneficiary')}</p>
                              <p className="font-semibold text-lg">
                                {persons.find(p => p.id.toString() === distributeForm.getValues('personId'))?.firstName} {persons.find(p => p.id.toString() === distributeForm.getValues('personId'))?.lastName}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('article')}</p>
                              <p className="font-semibold text-lg">{item.article.model}</p>
                            </div>
                          </div>
                        </div>
                        <FormField
                          control={distributeForm.control}
                          name="remarks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('remarks')}</FormLabel>
                              <FormControl>
                                <Textarea placeholder={t('add_remarks_placeholder')} {...field} className="min-h-[150px] bg-muted/20 border-muted focus:bg-background transition-all rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </Form>
            </ScrollArea>

            <DialogFooter className="p-6 pt-4 flex flex-row items-center justify-between border-t bg-muted/10">
              <Button variant="ghost" onClick={step === 0 ? () => setDistributeOpen(false) : prevStep} disabled={loading} className="gap-2 rounded-xl">
                {step === 0 ? t('cancel') : <><ChevronLeft className="h-4 w-4" /> {t('back')}</>}
              </Button>
              <Button onClick={step === steps.length - 1 ? distributeForm.handleSubmit(onDistributeSubmit) : nextStep} disabled={loading} className="gap-2 shadow-xl hover:shadow-primary/20 transition-all rounded-xl h-11 px-6">
                {loading ? t('saving') : (step === steps.length - 1 ? t('confirm_distribution', 'Finish & Download PDF') : <>{t('next')} <ChevronRight className="h-4 w-4" /></>)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDistributed && (
        <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 shadow-sm border-primary/20 text-primary hover:bg-primary/5">
              <Undo2 className="h-4 w-4" />
              {t('add_reversal')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>{t('add_new_reversal')}</DialogTitle>
              <DialogDescription>{t('add_reversal_desc')}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 p-6">
              <Form {...refundForm}>
                <form onSubmit={refundForm.handleSubmit(onRefundSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={refundForm.control}
                      name="structureId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('structure')}</FormLabel>
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
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Hash className="h-3.5 w-3.5" />
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
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('beneficiary')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!refundDirectionId || persons.length === 0}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder={t('select_beneficiary_placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {persons.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.grade} {p.firstName} {p.lastName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-4 border-t">
                    <FormLabel className="text-sm font-bold uppercase tracking-widest text-primary">{t('articles_to_return')}</FormLabel>
                    <div className="rounded-xl border bg-muted/30 p-4 relative group hover:shadow-sm transition-all border-primary/20">
                      <div className="flex flex-col gap-2">
                        <div className="font-bold text-sm">{item.article.model} — <span className="text-[10px] text-muted-foreground uppercase">{item.article.designation}</span></div>
                        <div className="flex flex-wrap gap-3 text-xs mt-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">{t('serial_number')}:</span>
                            <Badge variant="secondary" className="px-1.5 py-0 h-5 font-mono">{item.serialNumber || 'N/A'}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">{t('status')}:</span>
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={refundForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('remarks')}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t('add_remarks_placeholder')} {...field} className="bg-background resize-none min-h-[100px] rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="pt-6 border-t">
                    <Button type="submit" disabled={loading || !refundDirectionId} size="lg" className="w-full shadow-lg shadow-primary/20 h-12 text-sm font-bold tracking-widest uppercase rounded-xl">
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

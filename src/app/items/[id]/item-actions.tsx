"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { 
  getAllDirections, 
  getPersonsByIdStructure, 
  registerReversals, 
  searchPersons, 
  getSubDirectionsOfDirection,
  registerReparations,
  markItemAsRepaired,
  markItemAsReformed
} from "@/lib/data";
import { api } from "@/lib/api";
import { ArrowRightLeft, Undo2, Check, ChevronsUpDown, Wrench, ArchiveX, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ItemActionsProps {
  item: Item;
  onSuccess: () => void;
}

const personSelectionSchema = z.object({
  structureId: z.string().min(1, "direction_is_required"),
  personId: z.string().min(1, "beneficiary_is_required"),
  remarks: z.string().optional(),
  attestationId: z.string().optional(),
});

const distributeFormSchema = z.object({
  directionId: z.string().min(1, "direction_is_required"),
  subDirectionId: z.string().optional(),
  personId: z.string().min(1, "beneficiary_is_required"),
  remarks: z.string().optional(),
});

export function ItemActions({ item, onSuccess }: ItemActionsProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [repairOpen, setRepairOpen] = useState(false);
  const [repairedAlertOpen, setRepairedAlertOpen] = useState(false);
  const [reformedAlertOpen, setReformedAlertOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [directions, setDirections] = useState<Structure[]>([]);
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  
  // Person Registry to resolve names even when search list changes
  const [personRegistry, setPersonRegistry] = useState<Record<string, Person>>({});

  // Search States
  const [distPersons, setDistPersons] = useState<Person[]>([]);
  const [distSearch, setDistSearch] = useState("");
  const [isDistPopoverOpen, setDistPopoverOpen] = useState(false);
  const [isDistSearching, setIsDistSearching] = useState(false);

  const [refundPersons, setRefundPersons] = useState<Person[]>([]);
  const [refundSearch, setRefundSearch] = useState("");
  const [isRefundPopoverOpen, setRefundPopoverOpen] = useState(false);
  const [isRefundSearching, setIsRefundSearching] = useState(false);

  const [repairPersons, setRepairPersons] = useState<Person[]>([]);
  const [repairSearch, setRepairSearch] = useState("");
  const [isRepairPopoverOpen, setRepairPopoverOpen] = useState(false);
  const [isRepairSearching, setIsRepairSearching] = useState(false);

  const isInStock = item.status === 'IN_STOCK' || item.status === 'IN_STOCK_NEW' || item.status === 'REPAIRED';
  const isDistributed = item.status === 'DISTRIBUTED';
  const isUnderRepair = item.status === 'UNDER_REPAIR';

  const distributeForm = useForm<z.infer<typeof distributeFormSchema>>({
    resolver: zodResolver(distributeFormSchema),
    defaultValues: { directionId: "", subDirectionId: "", personId: "", remarks: "" },
  });

  const refundForm = useForm<z.infer<typeof personSelectionSchema>>({
    resolver: zodResolver(personSelectionSchema),
    defaultValues: { structureId: "", personId: "", remarks: "", attestationId: "" },
  });

  const repairForm = useForm<z.infer<typeof personSelectionSchema>>({
    resolver: zodResolver(personSelectionSchema),
    defaultValues: { structureId: "", personId: "", remarks: "", attestationId: "" },
  });

  // Helper to update registry
  const updateRegistry = useCallback((list: Person[]) => {
    setPersonRegistry(prev => {
      const next = { ...prev };
      list.forEach(p => {
        next[p.id.toString()] = p;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (distributeOpen || refundOpen || repairOpen) {
      (async () => {
        try {
          const res = await getAllDirections();
          setDirections(res.data || []);
        } catch (error) { console.error(error); }
      })();
    }
  }, [distributeOpen, refundOpen, repairOpen]);

  // --- Distribute Logic ---
  const selectedDistDir = distributeForm.watch("directionId");
  useEffect(() => {
    if (selectedDistDir) {
      distributeForm.setValue("personId", "");
      (async () => {
        const [subRes, personsRes] = await Promise.all([
          getSubDirectionsOfDirection(parseInt(selectedDistDir, 10)),
          getPersonsByIdStructure(parseInt(selectedDistDir, 10))
        ]);
        setSubDirections(subRes.data || []);
        setDistPersons(personsRes || []);
        updateRegistry(personsRes || []);
      })();
    }
  }, [selectedDistDir, distributeForm, updateRegistry]);

  useEffect(() => {
    if (isDistPopoverOpen && selectedDistDir && distSearch) {
      const delayDebounce = setTimeout(async () => {
        setIsDistSearching(true);
        try {
          const res = await searchPersons(distSearch, selectedDistDir);
          setDistPersons(res.data || []);
          updateRegistry(res.data || []);
        } finally {
          setIsDistSearching(false);
        }
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else if (isDistPopoverOpen && selectedDistDir && !distSearch) {
        getPersonsByIdStructure(parseInt(selectedDistDir, 10)).then(res => {
            setDistPersons(res || []);
            updateRegistry(res || []);
        });
    }
  }, [distSearch, selectedDistDir, isDistPopoverOpen, updateRegistry]);

  // --- Refund Logic ---
  const selectedRefundDir = refundForm.watch("structureId");
  useEffect(() => {
    if (selectedRefundDir) {
      refundForm.setValue("personId", "");
      (async () => {
        const personsRes = await getPersonsByIdStructure(parseInt(selectedRefundDir, 10));
        setRefundPersons(personsRes || []);
        updateRegistry(personsRes || []);
      })();
    }
  }, [selectedRefundDir, refundForm, updateRegistry]);

  useEffect(() => {
    if (isRefundPopoverOpen && selectedRefundDir && refundSearch) {
      const delayDebounce = setTimeout(async () => {
        setIsRefundSearching(true);
        try {
          const res = await searchPersons(refundSearch, selectedRefundDir);
          setRefundPersons(res.data || []);
          updateRegistry(res.data || []);
        } finally {
          setIsRefundSearching(false);
        }
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else if (isRefundPopoverOpen && selectedRefundDir && !refundSearch) {
        getPersonsByIdStructure(parseInt(selectedRefundDir, 10)).then(res => {
            setRefundPersons(res || []);
            updateRegistry(res || []);
        });
    }
  }, [refundSearch, selectedRefundDir, isRefundPopoverOpen, updateRegistry]);

  // --- Repair Logic ---
  const selectedRepairDir = repairForm.watch("structureId");
  useEffect(() => {
    if (selectedRepairDir) {
      repairForm.setValue("personId", "");
      (async () => {
        const personsRes = await getPersonsByIdStructure(parseInt(selectedRepairDir, 10));
        setRepairPersons(personsRes || []);
        updateRegistry(personsRes || []);
      })();
    }
  }, [selectedRepairDir, repairForm, updateRegistry]);

  useEffect(() => {
    if (isRepairPopoverOpen && selectedRepairDir && repairSearch) {
      const delayDebounce = setTimeout(async () => {
        setIsRepairSearching(true);
        try {
          const res = await searchPersons(repairSearch, selectedRepairDir);
          setRepairPersons(res.data || []);
          updateRegistry(res.data || []);
        } finally {
          setIsRepairSearching(false);
        }
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else if (isRepairPopoverOpen && selectedRepairDir && !repairSearch) {
        getPersonsByIdStructure(parseInt(selectedRepairDir, 10)).then(res => {
            setRepairPersons(res || []);
            updateRegistry(res || []);
        });
    }
  }, [repairSearch, selectedRepairDir, isRepairPopoverOpen, updateRegistry]);

  // Resolver for button text
  const getSelectedPersonName = (id: string) => {
    const person = personRegistry[id];
    return person ? `${person.grade} ${person.firstName} ${person.lastName}` : t('select_beneficiary_placeholder');
  };

  async function onDistributeSubmit(values: z.infer<typeof distributeFormSchema>) {
    setLoading(true);
    try {
      const payload = {
        personId: parseInt(values.personId, 10),
        remarks: values.remarks || "",
        userId: 1,
        hardwares: { [item.article.id]: [item.serialNumber!] },
        consumables: {},
        subDirectionId: values.subDirectionId ? parseInt(values.subDirectionId, 10) : parseInt(values.directionId, 10),
      };
      const response = await api.post("/distributions", payload, { responseType: "arraybuffer" });
      downloadPdf(response.data, `dist_${item.serialNumber}.pdf`);
      toast({ title: t('distribution_added_toast_title'), description: t('distribution_added_toast_desc') });
      setDistributeOpen(false);
      onSuccess();
    } catch (e) { toast({ title: t('error'), description: t('add_distribution_error'), variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function onRefundSubmit(values: z.infer<typeof personSelectionSchema>) {
    setLoading(true);
    try {
      await registerReversals({
        itemIds: [item.id],
        personId: parseInt(values.personId, 10),
        remarks: values.remarks || "",
        attestationId: values.attestationId,
      });
      toast({ title: t('reversal_added_toast_title'), description: t('reversal_added_toast_desc') });
      setRefundOpen(false);
      onSuccess();
    } catch (e) { toast({ title: t('error'), description: t('add_reversal_error'), variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function onRepairSubmit(values: z.infer<typeof personSelectionSchema>) {
    setLoading(true);
    try {
      await registerReparations({
        attestationId: values.attestationId,
        reparations: [{ itemId: item.id, remarks: values.remarks || "N/A", userId: 1 }]
      });
      toast({ title: t('reparation_added_toast_title'), description: t('reparation_added_toast_desc') });
      setRepairOpen(false);
      onSuccess();
    } catch (e) { toast({ title: t('error'), description: t('add_reparation_error'), variant: "destructive" }); }
    finally { setLoading(false); }
  }

  const handleMarkRepaired = async () => {
    setLoading(true);
    try {
      await markItemAsRepaired(item.id, 1);
      toast({ title: t('success'), description: t('repaired') });
      setRepairedAlertOpen(false);
      onSuccess();
    } catch (e) { toast({ title: t('error'), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleMarkReformed = async () => {
    setLoading(true);
    try {
      await markItemAsReformed(item.id, 1);
      toast({ title: t('success'), description: t('reformed') });
      setReformedAlertOpen(false);
      onSuccess();
    } catch (e) { toast({ title: t('error'), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const downloadPdf = (data: any, name: string) => {
    const blob = new Blob([data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Distribute Modal */}
      {isInStock && (
        <Dialog open={distributeOpen} onOpenChange={setDistributeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg hover:scale-105 transition-transform">
              <ArrowRightLeft className="h-4 w-4" />
              {t('add_distribution')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{t('add_new_distribution')}</DialogTitle>
              <DialogDescription>{t('add_new_distribution_desc')}</DialogDescription>
            </DialogHeader>
            
            <div className="bg-muted/30 p-4 rounded-xl border mb-2 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('item_to_assign', 'Item to Assign')}</span>
                    <span className="font-bold text-sm">{item.article.model}</span>
                </div>
                <code className="text-xs bg-background px-2 py-1 rounded border font-mono">{item.serialNumber}</code>
            </div>

            <Form {...distributeForm}>
              <form onSubmit={distributeForm.handleSubmit(onDistributeSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={distributeForm.control} name="directionId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('structure')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-11"><SelectValue placeholder={t('select_structure_placeholder')} /></SelectTrigger></FormControl>
                        <SelectContent>{directions.map((d) => (<SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={distributeForm.control} name="subDirectionId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sub_direction')} ({t('optional')})</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDistDir || subDirections.length === 0}>
                        <FormControl><SelectTrigger className="h-11"><SelectValue placeholder={t('select_sub_direction_placeholder')} /></SelectTrigger></FormControl>
                        <SelectContent>{subDirections.map((sub) => (<SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                
                <FormField control={distributeForm.control} name="personId" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('beneficiary')}</FormLabel>
                    <Popover open={isDistPopoverOpen} onOpenChange={setDistPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" disabled={!selectedDistDir} className={cn("w-full justify-between h-11 text-left bg-background", !field.value && "text-muted-foreground")}>
                            {field.value ? getSelectedPersonName(field.value) : t('select_beneficiary_placeholder')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder={t('search_person_placeholder')} value={distSearch} onValueChange={setDistSearch} />
                          <CommandList>
                            {isDistSearching ? (
                                <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Searching...</div>
                            ) : (
                                <>
                                    <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                                    <CommandGroup>
                                        {distPersons.map((p) => (
                                            <CommandItem key={p.id} value={p.id.toString()} onSelect={() => { distributeForm.setValue("personId", p.id.toString()); setDistPopoverOpen(false); }}>
                                                <Check className={cn("mr-2 h-4 w-4 text-primary", p.id.toString() === field.value ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col">
                                                    <span>{p.grade} {p.firstName} {p.lastName}</span>
                                                    {p.pseudo && <span className="text-[10px] text-muted-foreground font-mono">@{p.pseudo}</span>}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={distributeForm.control} name="remarks" render={({ field }) => (
                  <FormItem><FormLabel>{t('remarks')}</FormLabel><FormControl><Textarea placeholder={t('add_remarks_placeholder')} {...field} className="bg-muted/20 min-h-[100px]" /></FormControl></FormItem>
                )} />
                <Button type="submit" disabled={loading} className="w-full h-12 font-bold uppercase shadow-xl">{loading ? t('saving') : t('confirm_distribution')}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Refund (Reversal) Modal */}
      {isDistributed && (
        <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
              <Undo2 className="h-4 w-4" />
              {t('add_reversal')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{t('add_new_reversal')}</DialogTitle>
              <DialogDescription>{t('add_reversal_desc')}</DialogDescription>
            </DialogHeader>

            <div className="bg-muted/30 p-4 rounded-xl border mb-2 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('item_to_return', 'Item to Return')}</span>
                    <span className="font-bold text-sm">{item.article.model}</span>
                </div>
                <code className="text-xs bg-background px-2 py-1 rounded border font-mono">{item.serialNumber}</code>
            </div>

            <Form {...refundForm}>
              <form onSubmit={refundForm.handleSubmit(onRefundSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={refundForm.control} name="structureId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('structure')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-11"><SelectValue placeholder={t('select_structure_placeholder')} /></SelectTrigger></FormControl>
                        <SelectContent>{directions.map((d) => (<SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={refundForm.control} name="attestationId" render={({ field }) => (
                    <FormItem><FormLabel>{t('attestation_id')}</FormLabel><FormControl><Input placeholder="ATT-..." {...field} className="h-11" /></FormControl></FormItem>
                  )} />
                </div>

                <FormField control={refundForm.control} name="personId" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('returned_by')}</FormLabel>
                    <Popover open={isRefundPopoverOpen} onOpenChange={setRefundPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" disabled={!selectedRefundDir} className={cn("w-full justify-between h-11 text-left bg-background", !field.value && "text-muted-foreground")}>
                            {field.value ? getSelectedPersonName(field.value) : t('select_beneficiary_placeholder')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder={t('search_person_placeholder')} value={refundSearch} onValueChange={setRefundSearch} />
                          <CommandList>
                            {isRefundSearching ? (
                                <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Searching...</div>
                            ) : (
                                <>
                                    <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                                    <CommandGroup>
                                        {refundPersons.map((p) => (
                                            <CommandItem key={p.id} value={p.id.toString()} onSelect={() => { refundForm.setValue("personId", p.id.toString()); setRefundPopoverOpen(false); }}>
                                                <Check className={cn("mr-2 h-4 w-4 text-primary", p.id.toString() === field.value ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col">
                                                    <span>{p.grade} {p.firstName} {p.lastName}</span>
                                                    {p.pseudo && <span className="text-[10px] text-muted-foreground font-mono">@{p.pseudo}</span>}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={refundForm.control} name="remarks" render={({ field }) => (
                  <FormItem><FormLabel>{t('remarks')}</FormLabel><FormControl><Textarea placeholder={t('add_remarks_placeholder')} {...field} className="bg-muted/20 min-h-[100px]" /></FormControl></FormItem>
                )} />
                <Button type="submit" disabled={loading} className="w-full h-12 font-bold uppercase shadow-xl">{loading ? t('saving') : t('save_reversal')}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Send to Repair Modal */}
      {(isInStock || isDistributed) && (
        <Dialog open={repairOpen} onOpenChange={setRepairOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 border-red-500/20 text-red-600 hover:bg-red-500/5">
              <Wrench className="h-4 w-4" />
              {t('reparation')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{t('register_for_repair')}</DialogTitle>
              <DialogDescription>{t('register_for_repair_desc')}</DialogDescription>
            </DialogHeader>

            <div className="bg-muted/30 p-4 rounded-xl border mb-2 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('item_to_repair', 'Item to Repair')}</span>
                    <span className="font-bold text-sm">{item.article.model}</span>
                </div>
                <code className="text-xs bg-background px-2 py-1 rounded border font-mono">{item.serialNumber}</code>
            </div>

            <Form {...repairForm}>
              <form onSubmit={repairForm.handleSubmit(onRepairSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={repairForm.control} name="structureId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('structure')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-11"><SelectValue placeholder={t('select_structure_placeholder')} /></SelectTrigger></FormControl>
                        <SelectContent>{directions.map((d) => (<SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={repairForm.control} name="attestationId" render={({ field }) => (
                    <FormItem><FormLabel>{t('attestation_id')}</FormLabel><FormControl><Input placeholder="REP-..." {...field} className="h-11" /></FormControl></FormItem>
                  )} />
                </div>

                <FormField control={repairForm.control} name="personId" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('returned_by')}</FormLabel>
                    <Popover open={isRepairPopoverOpen} onOpenChange={setRepairPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" disabled={!selectedRepairDir} className={cn("w-full justify-between h-11 text-left bg-background", !field.value && "text-muted-foreground")}>
                            {field.value ? getSelectedPersonName(field.value) : t('select_beneficiary_placeholder')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder={t('search_person_placeholder')} value={repairSearch} onValueChange={setRepairSearch} />
                          <CommandList>
                            {isRepairSearching ? (
                                <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Searching...</div>
                            ) : (
                                <>
                                    <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                                    <CommandGroup>
                                        {repairPersons.map((p) => (
                                            <CommandItem key={p.id} value={p.id.toString()} onSelect={() => { repairForm.setValue("personId", p.id.toString()); setRepairPopoverOpen(false); }}>
                                                <Check className={cn("mr-2 h-4 w-4 text-primary", p.id.toString() === field.value ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col">
                                                    <span>{p.grade} {p.firstName} {p.lastName}</span>
                                                    {p.pseudo && <span className="text-[10px] text-muted-foreground font-mono">@{p.pseudo}</span>}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={repairForm.control} name="remarks" render={({ field }) => (
                  <FormItem><FormLabel>{t('repair_remarks')}</FormLabel><FormControl><Textarea placeholder={t('repair_remarks_placeholder')} {...field} className="bg-muted/20 min-h-[100px]" /></FormControl></FormItem>
                )} />
                <Button type="submit" disabled={loading} className="w-full h-12 font-bold uppercase shadow-xl bg-red-600 hover:bg-red-700 text-white">{loading ? t('saving') : t('register_for_repair')}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Status updates for items already in Repair */}
      {isUnderRepair && (
        <>
          <AlertDialog open={repairedAlertOpen} onOpenChange={setRepairedAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Check className="h-4 w-4" />
                {t('repaired')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('repaired')}</AlertDialogTitle>
                <AlertDialogDescription>Mark this item as repaired and return it to stock?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkRepaired} className="bg-green-600 hover:bg-green-700">Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={reformedAlertOpen} onOpenChange={setReformedAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <ArchiveX className="h-4 w-4" />
                {t('reforme')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('reforme')}</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to mark this item as reformed? This action is permanent.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkReformed} className="bg-destructive hover:bg-destructive/90">Confirm Reform</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
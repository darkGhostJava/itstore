"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useForm, UseFormReturn } from "react-hook-form";
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
import { ArrowRightLeft, Undo2, Check, ChevronsUpDown, Wrench, ArchiveX, Loader2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ItemActionsProps {
  item: Item;
  onSuccess: () => void;
}

const actionFormSchema = z.object({
  directionId: z.string().min(1, "direction_is_required"),
  subDirectionId: z.string().optional(),
  personId: z.string().min(1, "beneficiary_is_required"),
  remarks: z.string().optional(),
  attestationId: z.string().optional(),
});

type ActionFormValues = z.infer<typeof actionFormSchema>;

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
  const [personRegistry, setPersonRegistry] = useState<Record<string, Person>>({});

  const isInStock = item.status === 'IN_STOCK' || item.status === 'IN_STOCK_NEW' || item.status === 'REPAIRED';
  const isDistributed = item.status === 'DISTRIBUTED';
  const isUnderRepair = item.status === 'UNDER_REPAIR';

  const distributeForm = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: { directionId: "", subDirectionId: "", personId: "", remarks: "" },
  });

  const refundForm = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: { directionId: "", subDirectionId: "", personId: "", remarks: "", attestationId: "" },
  });

  const repairForm = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: { directionId: "", subDirectionId: "", personId: "", remarks: "", attestationId: "" },
  });

  useEffect(() => {
    if (distributeOpen || refundOpen || repairOpen) {
      (async () => {
        const res = await getAllDirections();
        setDirections(res.data || []);
      })();
    }
  }, [distributeOpen, refundOpen, repairOpen]);

  const updateRegistry = useCallback((list: Person[]) => {
    setPersonRegistry(prev => {
      const next = { ...prev };
      list.forEach(p => { next[p.id.toString()] = p; });
      return next;
    });
  }, []);

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

  const handleRepaired = async () => {
    setLoading(true);
    try {
      await markItemAsRepaired(item.id, 1);
      toast({ title: t('success') });
      setRepairedAlertOpen(false);
      onSuccess();
    } catch (e) { toast({ title: t('error'), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleReformed = async () => {
    setLoading(true);
    try {
      await markItemAsReformed(item.id, 1);
      toast({ title: t('success') });
      setReformedAlertOpen(false);
      onSuccess();
    } catch (e) { toast({ title: t('error'), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {isInStock && (
        <GenericActionModal 
          title={t('add_new_distribution')}
          description={t('add_new_distribution_desc')}
          triggerIcon={<ArrowRightLeft className="h-4 w-4" />}
          triggerText={t('add_distribution')}
          item={item}
          open={distributeOpen}
          setOpen={setDistributeOpen}
          form={distributeForm}
          directions={directions}
          loading={loading}
          updateRegistry={updateRegistry}
          personRegistry={personRegistry}
          onSubmit={async (values: ActionFormValues) => {
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
              toast({ title: t('distribution_added_toast_title') });
              setDistributeOpen(false);
              onSuccess();
            } catch (e) { toast({ title: t('error'), variant: "destructive" }); }
            finally { setLoading(false); }
          }}
        />
      )}

      {isDistributed && (
        <GenericActionModal 
          title={t('add_new_reversal')}
          description={t('add_reversal_desc')}
          triggerIcon={<Undo2 className="h-4 w-4" />}
          triggerText={t('add_reversal')}
          variant="outline"
          item={item}
          open={refundOpen}
          setOpen={setRefundOpen}
          form={refundForm}
          directions={directions}
          loading={loading}
          updateRegistry={updateRegistry}
          personRegistry={personRegistry}
          onSubmit={async (values: ActionFormValues) => {
            setLoading(true);
            try {
              await registerReversals({
                itemIds: [item.id],
                personId: parseInt(values.personId, 10),
                remarks: values.remarks || "",
                attestationId: values.attestationId,
              });
              toast({ title: t('reversal_added_toast_title') });
              setRefundOpen(false);
              onSuccess();
            } catch (e) { toast({ title: t('error'), variant: "destructive" }); }
            finally { setLoading(false); }
          }}
        />
      )}

      {(isInStock || isDistributed) && (
        <GenericActionModal 
          title={t('register_for_repair')}
          description={t('register_for_repair_desc')}
          triggerIcon={<Wrench className="h-4 w-4" />}
          triggerText={t('reparation')}
          variant="outline"
          className="border-red-500/20 text-red-600 hover:bg-red-500/5"
          submitColor="bg-red-600 hover:bg-red-700"
          item={item}
          open={repairOpen}
          setOpen={setRepairOpen}
          form={repairForm}
          directions={directions}
          loading={loading}
          updateRegistry={updateRegistry}
          personRegistry={personRegistry}
          onSubmit={async (values: ActionFormValues) => {
            setLoading(true);
            try {
              await registerReparations({
                attestationId: values.attestationId,
                reparations: [{ itemId: item.id, remarks: values.remarks || "N/A", userId: 1 }]
              });
              toast({ title: t('reparation_added_toast_title') });
              setRepairOpen(false);
              onSuccess();
            } catch (e) { toast({ title: t('error'), variant: "destructive" }); }
            finally { setLoading(false); }
          }}
        />
      )}

      {isUnderRepair && (
        <>
          <AlertDialog open={repairedAlertOpen} onOpenChange={setRepairedAlertOpen}>
            <AlertDialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700 text-white gap-2"><Check className="h-4 w-4" />{t('repaired')}</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('repaired')}</AlertDialogTitle><AlertDialogDescription>Mark this item as repaired and return it to stock?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleRepaired} className="bg-green-600 hover:bg-green-700">Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
          <AlertDialog open={reformedAlertOpen} onOpenChange={setReformedAlertOpen}>
            <AlertDialogTrigger asChild><Button variant="destructive" className="gap-2"><ArchiveX className="h-4 w-4" />{t('reforme')}</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('reforme')}</AlertDialogTitle><AlertDialogDescription>Are you sure you want to mark this item as reformed? This action is permanent.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleReformed} className="bg-destructive">Confirm Reform</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function GenericActionModal({ title, description, triggerIcon, triggerText, variant = "default", className, submitColor, item, open, setOpen, form, directions, loading, updateRegistry, personRegistry, onSubmit }: {
  title: string;
  description: string;
  triggerIcon: React.ReactNode;
  triggerText: string;
  variant?: any;
  className?: string;
  submitColor?: string;
  item: Item;
  open: boolean;
  setOpen: (open: boolean) => void;
  form: UseFormReturn<ActionFormValues>;
  directions: Structure[];
  loading: boolean;
  updateRegistry: (list: Person[]) => void;
  personRegistry: Record<string, Person>;
  onSubmit: (values: ActionFormValues) => Promise<void>;
}) {
  const { t } = useTranslation('common');
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const selectedDir = form.watch("directionId");
  const selectedSubDir = form.watch("subDirectionId");

  useEffect(() => {
    if (selectedDir && selectedDir !== "") {
      (async () => {
        const subRes = await getSubDirectionsOfDirection(parseInt(selectedDir, 10));
        setSubDirections(subRes.data || []);
      })();
    } else {
      setSubDirections([]);
    }
  }, [selectedDir]);

  const refreshPersons = useCallback(async (searchQuery?: string) => {
    const targetId = selectedSubDir || selectedDir;
    if (!targetId || targetId === "") {
      setPersons([]);
      return;
    }

    setIsSearching(true);
    try {
      if (searchQuery && searchQuery.trim().length > 0) {
        const res = await searchPersons(searchQuery, targetId);
        const data = res.data || [];
        setPersons(data);
        updateRegistry(data);
      } else {
        const res = await getPersonsByIdStructure(parseInt(targetId, 10));
        const data = res || [];
        setPersons(data);
        updateRegistry(data);
      }
    } finally { setIsSearching(false); }
  }, [selectedDir, selectedSubDir, updateRegistry]);

  useEffect(() => {
    if (isPopoverOpen) {
      const delay = setTimeout(() => refreshPersons(search), 300);
      return () => clearTimeout(delay);
    }
  }, [search, isPopoverOpen, refreshPersons]);

  useEffect(() => {
    form.setValue("personId", "");
    refreshPersons();
  }, [selectedDir, selectedSubDir, refreshPersons, form]);

  const getPersonName = (id: string) => {
    const p = personRegistry[id];
    return p ? `${p.grade} ${p.firstName} ${p.lastName}` : t('select_beneficiary_placeholder');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={cn("gap-2 shadow-lg hover:scale-105 transition-transform", className)}>
          {triggerIcon}
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2">
          <div className="bg-muted/30 p-4 rounded-xl border flex items-center justify-between">
              <div className="flex flex-col"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('article')}</span><span className="font-bold text-sm">{item.article.model}</span></div>
              <code className="text-xs bg-background px-2 py-1 rounded border font-mono">{item.serialNumber}</code>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="directionId" render={({ field }) => (
                <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">{t('structure')}</FormLabel><Select onValueChange={(v) => { field.onChange(v); form.setValue("subDirectionId", ""); }} value={field.value}><FormControl><SelectTrigger className="h-11"><SelectValue placeholder={t('select_structure_placeholder')} /></SelectTrigger></FormControl><SelectContent>{directions.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}</SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="subDirectionId" render={({ field }) => (
                <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">{t('sub_direction')} ({t('optional')})</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!selectedDir || subDirections.length === 0}><FormControl><SelectTrigger className="h-11"><SelectValue placeholder={t('select_sub_direction_placeholder')} /></SelectTrigger></FormControl><SelectContent>{subDirections.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent></Select></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <FormField control={form.control} name="personId" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">{t('beneficiary')}</FormLabel>
                  <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" disabled={!selectedDir} className={cn("w-full justify-between h-11 text-left bg-background", !field.value && "text-muted-foreground")}>{field.value ? getPersonName(field.value) : t('select_beneficiary_placeholder')}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput placeholder={t('search_person_placeholder')} value={search} onValueChange={setSearch} />
                        <CommandList>
                          {isSearching ? <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> {t('searching')}</div> : <><CommandEmpty>{t('no_person_found')}</CommandEmpty><CommandGroup>{persons.map((p: any) => <CommandItem key={p.id} value={p.id.toString()} onSelect={() => { form.setValue("personId", p.id.toString()); setPopoverOpen(false); }} className="py-2"><Check className={cn("mr-2 h-4 w-4 text-primary", p.id.toString() === field.value ? "opacity-100" : "opacity-0")} /><div className="flex flex-col"><span>{p.grade} {p.firstName} {p.lastName}</span>{p.pseudo && <span className="text-[10px] text-muted-foreground font-mono">@{p.pseudo}</span>}</div></CommandItem>)}</CommandGroup></>}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {form.getValues('attestationId') !== undefined && (
                <FormField control={form.control} name="attestationId" render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">{t('attestation_id')}</FormLabel><FormControl><Input placeholder="ATT-..." {...field} className="h-11" /></FormControl></FormItem>)} />
              )}
              <FormField control={form.control} name="remarks" render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">{t('remarks')}</FormLabel><FormControl><Textarea placeholder={t('add_remarks_placeholder')} {...field} className="bg-muted/20 min-h-[80px]" /></FormControl></FormItem>)} />
            </div>
            <Button type="submit" disabled={loading} className={cn("w-full h-12 font-bold uppercase shadow-xl", submitColor)}>{loading ? t('saving') : t('confirm_distribution')}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
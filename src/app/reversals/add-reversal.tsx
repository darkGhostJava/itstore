"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Undo2, Check, ChevronsUpDown, Trash2, Search, Hash, Loader2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  searchPersons,
  registerReversals,
  getAllDirections,
  getSubDirectionsOfDirection,
  getPersonsByIdStructure,
  fetchItemsForStructure,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Item, Person, Structure } from "@/lib/definitions";
import { ItemSchema } from "@/lib/schemas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const reversalItemSchema = z.object({
  item: ItemSchema,
});

const reversalFormSchema = z.object({
  structureId: z.string().min(1, "direction_is_required"),
  subDirectionId: z.string().optional(),
  personId: z.string().min(1, "beneficiary_is_required"),
  remarks: z.string().min(1, "remarks_are_required"),
  attestationId: z.string().optional(),
  reversals: z.array(reversalItemSchema).min(1, "at_least_one_article_is_required"),
});

type ReversalFormValues = z.infer<typeof reversalFormSchema>;

interface AddReversalProps {
  onSuccess?: () => void;
}

export function AddReversal({ onSuccess }: AddReversalProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [directions, setDirections] = useState<Structure[]>([]);
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [personRegistry, setPersonRegistry] = useState<Record<string, Person>>({});
  const [structureItems, setStructureItems] = useState<Item[]>([]);
  
  const [personSearch, setPersonSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [isPersonPopoverOpen, setPersonPopoverOpen] = useState(false);
  const [isItemPopoverOpen, setItemPopoverOpen] = useState(false);
  const [isSearchingPersons, setIsSearchingPersons] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const form = useForm<ReversalFormValues>({
    resolver: zodResolver(reversalFormSchema),
    defaultValues: {
      structureId: "",
      subDirectionId: "",
      personId: "",
      remarks: "",
      attestationId: "",
      reversals: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reversals",
  });
  
  const selectedStructureId = form.watch("structureId");
  const selectedSubDirectionId = form.watch("subDirectionId");

  useEffect(() => {
    if (open) {
      (async () => {
        const res = await getAllDirections();
        setDirections(res.data || []);
      })();
    }
  }, [open]);

  useEffect(() => {
    if (selectedStructureId && selectedStructureId !== "") {
      (async () => {
        const res = await getSubDirectionsOfDirection(parseInt(selectedStructureId, 10));
        setSubDirections(res.data || []);
      })();
    } else {
      setSubDirections([]);
    }
  }, [selectedStructureId]);

  const updateRegistry = useCallback((list: Person[]) => {
    setPersonRegistry(prev => {
      const next = { ...prev };
      list.forEach(p => { next[p.id.toString()] = p; });
      return next;
    });
  }, []);

  const refreshPersons = useCallback(async (searchQuery?: string) => {
    const targetId = selectedSubDirectionId || selectedStructureId;
    if (!targetId || targetId === "") {
      setPersons([]);
      return;
    }

    setIsSearchingPersons(true);
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
    } finally { setIsSearchingPersons(false); }
  }, [selectedStructureId, selectedSubDirectionId, updateRegistry]);

  useEffect(() => {
    if (isPersonPopoverOpen) {
      const debounce = setTimeout(() => refreshPersons(personSearch), 300);
      return () => clearTimeout(debounce);
    }
  }, [personSearch, isPersonPopoverOpen, refreshPersons]);

  useEffect(() => {
    form.setValue("personId", "");
    form.setValue("reversals", []);
    setStructureItems([]);
    refreshPersons();

    const targetId = selectedSubDirectionId || selectedStructureId;
    if (targetId && targetId !== "") {
      (async () => {
        setIsLoadingItems(true);
        try {
          const res = await fetchItemsForStructure(parseInt(targetId, 10), { pageIndex: 0, pageSize: 1000 });
          setStructureItems(res.data || []);
        } catch (error) {
          console.error("Failed to fetch structure items", error);
          setStructureItems([]);
        } finally {
          setIsLoadingItems(false);
        }
      })();
    }
  }, [selectedStructureId, selectedSubDirectionId, refreshPersons, form]);

  async function onSubmit(values: ReversalFormValues) {
    setLoading(true);
    try {
      const payload = {
        itemIds: values.reversals.map(rev => rev.item.id),
        personId: parseInt(values.personId, 10),
        remarks: values.remarks,
        attestationId: values.attestationId,
      };

      await registerReversals(payload);

      toast({
        title: t('reversal_added_toast_title'),
        description: t('reversal_added_toast_desc'),
      });

      form.reset();
      remove();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error registering reversal:", error);
      toast({
        title: t('error'),
        description: t('add_reversal_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSelectItem = (item: Item) => {
    const alreadyAdded = fields.some(f => f.item.id === item.id);
    if (!alreadyAdded) {
        append({ item: item });
        setItemPopoverOpen(false);
        setItemSearch("");
    } else {
        toast({
            title: t('item_already_added'),
            description: t('item_already_added_desc'),
            variant: "destructive"
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Undo2 className="mr-2 h-4 w-4" />
          {t('add_reversal')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{t('add_new_reversal')}</DialogTitle>
          <DialogDescription>
            {t('add_reversal_desc')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="structureId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('structure')}</FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); form.setValue("subDirectionId", ""); }} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={t('select_structure_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {directions.map((structure) => (
                            <SelectItem key={`dir-${structure.id}`} value={structure.id.toString()}>
                              {structure.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subDirectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('sub_direction')} ({t('optional')})</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedStructureId || subDirections.length === 0}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder={t('select_sub_direction_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subDirections.map((sub) => (
                            <SelectItem key={`sub-${sub.id}`} value={sub.id.toString()}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
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
                            disabled={!selectedStructureId}
                            className={cn(
                              "w-full justify-between h-11 text-left bg-background",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? (personRegistry[field.value]?.firstName + " " + personRegistry[field.value]?.lastName)
                              : t('select_beneficiary_placeholder')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder={t('search_person_placeholder')} value={personSearch} onValueChange={setPersonSearch} />
                          <CommandList>
                            {isSearchingPersons ? (
                              <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> {t('searching')}
                              </div>
                            ) : (
                              <>
                                <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                                <CommandGroup>
                                  {persons.map((person) => (
                                    <CommandItem
                                      key={`rev-person-${person.id}`}
                                      value={person.id.toString()}
                                      onSelect={() => {
                                        form.setValue("personId", person.id.toString());
                                        setPersonPopoverOpen(false);
                                      }}
                                      className="py-2"
                                    >
                                      <Check className={cn("mr-2 h-4 w-4 text-primary", person.id.toString() === field.value ? "opacity-100" : "opacity-0")} />
                                      <div className="flex flex-col">
                                        <span>{person.grade} {person.firstName} {person.lastName}</span>
                                        {person.pseudo && <span className="text-[10px] text-muted-foreground font-mono">@{person.pseudo}</span>}
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
                )}
              />

              {(selectedStructureId || selectedSubDirectionId) && (
                <div className="space-y-4 pt-4 border-t">
                    <FormLabel className="text-sm font-bold uppercase tracking-widest text-primary">{t('articles_to_return')}</FormLabel>
                    
                    <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={`rev-item-${field.item.id}`} className="rounded-xl border bg-muted/30 p-4 space-y-2 relative group hover:shadow-sm transition-all">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        
                        <div className="flex flex-col gap-2">
                            <div className="font-bold text-sm">{field.item.article.model} — <span className="text-[10px] text-muted-foreground uppercase">{field.item.article.designation}</span></div>
                            <div className="flex flex-wrap gap-3 text-xs mt-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">{t('serial_number')}:</span>
                                    <Badge variant="secondary" className="px-1.5 py-0 h-5 font-mono">{field.item.serialNumber}</Badge>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">{t('status')}:</span>
                                    <StatusBadge status={field.item.status} />
                                </div>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>

                    <div className="relative space-y-3 pt-2 bg-primary/5 p-4 rounded-xl border border-primary/10">
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-primary/80">{t('search_item_in_structure')}</FormLabel>
                        <Popover open={isItemPopoverOpen} onOpenChange={setItemPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isLoadingItems}
                              className="w-full justify-between h-11 bg-background border-none shadow-sm"
                            >
                              {isLoadingItems ? t('loading_items') : t('search_add_serial_placeholder')}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder={t('filter_by_serial_number_placeholder')} 
                                onValueChange={setItemSearch}
                              />
                              <ScrollArea className="max-h-64">
                                <CommandEmpty>{t('no_items_found')}</CommandEmpty>
                                <CommandGroup>
                                  <CommandList>
                                    {structureItems
                                      .filter(item => item.serialNumber?.toLowerCase().includes(itemSearch.toLowerCase()))
                                      .map((item) => (
                                      <CommandItem
                                        key={`item-rev-res-${item.id}`}
                                        value={item.id.toString()}
                                        onSelect={() => handleSelectItem(item)}
                                        className="p-3 border-b last:border-0"
                                      >
                                        <div className="flex flex-col w-full">
                                          <div className="flex justify-between items-center w-full">
                                            <span className="font-bold">{item.serialNumber}</span>
                                            <Badge variant="outline" className="text-[10px]">{item.article.model}</Badge>
                                          </div>
                                          <span className="text-[10px] text-muted-foreground">{item.article.designation}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandList>
                                </CommandGroup>
                              </ScrollArea>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
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

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('remarks')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('add_remarks_placeholder')} {...field} className="bg-background resize-none min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-6 border-t">
                <Button type="submit" disabled={loading || !selectedStructureId || fields.length === 0} size="lg" className="w-full shadow-lg shadow-primary/20 h-12 text-sm font-bold tracking-widest uppercase">
                  {loading ? t('saving') : t('save_reversal')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
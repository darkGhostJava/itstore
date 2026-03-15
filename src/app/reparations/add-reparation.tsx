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
import { PlusCircle, Trash2, Hash, Search, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getAllDirections,
  getSubDirectionsOfDirection,
  getPersonsByIdStructure,
  searchPersons,
  searchItemsBySerialNumberAndPerson,
  registerReparations,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Item, Person, Structure } from "@/lib/definitions";
import { ItemSchema } from "@/lib/schemas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const reparationItemSchema = z.object({
  item: ItemSchema,
  remarks: z.string().min(1, "Remarks are required."),
});

const reparationFormSchema = z.object({
  structureId: z.string().min(1, "direction_is_required"),
  subDirectionId: z.string().optional(),
  personId: z.string().min(1, "beneficiary_is_required"),
  attestationId: z.string().optional(),
  reparations: z.array(reparationItemSchema).min(1, "at_least_one_article_is_required"),
});

type ReparationFormValues = z.infer<typeof reparationFormSchema>;

interface AddReparationProps {
  onSuccess?: () => void;
}

export function AddReparation({ onSuccess }: AddReparationProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState<Structure[]>([]);
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [personRegistry, setPersonRegistry] = useState<Record<string, Person>>({});
  const [searchedItems, setSearchedItems] = useState<Item[]>([]);
  
  const [personSearch, setPersonSearch] = useState("");
  const [isPersonPopoverOpen, setPersonPopoverOpen] = useState(false);
  const [isSearchingPersons, setIsSearchingPersons] = useState(false);

  const form = useForm<ReparationFormValues>({
    resolver: zodResolver(reparationFormSchema),
    defaultValues: {
      structureId: "",
      subDirectionId: "",
      personId: "",
      attestationId: "",
      reparations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reparations",
  });
  
  const selectedStructureId = form.watch("structureId");
  const selectedSubDirectionId = form.watch("subDirectionId");
  const selectedPersonId = form.watch("personId");

  useEffect(() => {
    if (open) {
      (async () => {
        const res = await getAllDirections();
        setDirections(res.data || []);
      })();
    }
  }, [open]);

  useEffect(() => {
    if (selectedStructureId) {
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
    refreshPersons();
  }, [selectedStructureId, selectedSubDirectionId, refreshPersons, form]);

  async function onSubmit(values: ReparationFormValues) {
    setLoading(true);
    try {
      const repairsPayload = values.reparations.map(rep => ({
        itemId: rep.item.id,
        remarks: rep.remarks,
        userId: 1,
      }));

      await registerReparations({
        attestationId: values.attestationId,
        reparations: repairsPayload
      });

      toast({
        title: t('reparation_added_toast_title'),
        description: t('reparation_added_toast_desc'),
      });

      form.reset();
      remove();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error registering repair:", error);
      toast({
        title: t('error'),
        description: t('add_reparation_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleItemSearch = async (query: string) => {
    if (query.length > 1 && selectedPersonId) {
      const res = await searchItemsBySerialNumberAndPerson(parseInt(selectedPersonId), query);
      setSearchedItems(res);
    } else {
      setSearchedItems([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hover:scale-105 transition-transform shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('reparation')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{t('register_for_repair')}</DialogTitle>
          <DialogDescription>
            {t('register_for_repair_desc')}
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
                            <SelectItem key={`rep-dir-${structure.id}`} value={structure.id.toString()}>
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
                            <SelectItem key={`rep-sub-${sub.id}`} value={sub.id.toString()}>
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
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('returned_by')}</FormLabel>
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
                                      key={`rep-person-${person.id}`}
                                      value={person.id.toString()}
                                      onSelect={() => {
                                        form.setValue("personId", person.id.toString());
                                        setPersonPopoverOpen(false);
                                      }}
                                      className="py-2"
                                    >
                                      <Check className={cn("mr-2 h-4 w-4 text-primary", person.id.toString() === field.value ? "opacity-100" : "opacity-0")} />
                                      <div className="flex flex-col">
                                        <span className="font-semibold">{person.grade} {person.firstName} {person.lastName}</span>
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

              <div className="space-y-4 pt-4 border-t">
                <FormLabel className="text-sm font-bold uppercase tracking-widest text-primary">{t('items_to_repair')}</FormLabel>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-xl border bg-muted/30 p-4 space-y-4 relative shadow-sm hover:shadow-md transition-all group">
                       <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      
                      <div className="space-y-2">
                        <div className="font-bold text-sm">{(field as any).item.article.model} — <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{(field as any).item.article.designation}</span></div>
                        <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground">{t('serial_number')}:</span>
                                <code className="bg-background px-1.5 py-0.5 rounded border font-mono">{(field as any).item.serialNumber}</code>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground">{t('status')}:</span>
                                <StatusBadge status={(field as any).item.status} />
                            </div>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`reparations.${index}.remarks`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase">{t('repair_remarks')}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t('repair_remarks_placeholder')}
                                {...field}
                                className="bg-background resize-none min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>

                <div className="relative space-y-3 pt-2 bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <FormLabel htmlFor="item-search" className="text-xs font-bold uppercase tracking-widest text-primary/80">{t('search_item_by_serial')}</FormLabel>
                   <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="item-search"
                      placeholder={t('search_add_serial_placeholder')}
                      onChange={(e) => handleItemSearch(e.target.value)}
                      onBlur={() => setTimeout(() => setSearchedItems([]), 150)}
                      className="pl-9 h-11 bg-background border-none shadow-sm"
                      disabled={!selectedPersonId}
                    />
                    {searchedItems.length > 0 && (
                      <div className="absolute z-50 w-full left-0 rounded-xl border bg-popover shadow-2xl mt-1 overflow-hidden">
                        <ScrollArea className="max-h-56">
                          {searchedItems.map((item) => (
                            <div
                              key={`rep-search-item-${item.id}`}
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-accent border-b last:border-0"
                              onMouseDown={() => {
                                append({ item: item, remarks: "" });
                                setSearchedItems([]);
                                const searchInput = document.getElementById('item-search');
                                if (searchInput) (searchInput as HTMLInputElement).value = "";
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{item.serialNumber}</span>
                                <span className="text-[10px] text-muted-foreground">{item.article.model}</span>
                              </div>
                              <StatusBadge status={item.status} />
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                  {!selectedPersonId && <div className="text-[10px] text-muted-foreground italic">{t('select_person_to_search_items')}</div>}
                </div>
              </div>
              
              <DialogFooter className="pt-6 border-t">
                <Button type="submit" disabled={loading || fields.length === 0} size="lg" className="w-full shadow-lg shadow-primary/20 h-12 text-sm font-bold tracking-widest uppercase">
                  {loading ? t('saving') : t('register_for_repair')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
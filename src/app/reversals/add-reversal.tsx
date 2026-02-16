
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
  FormDescription,
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
import { Undo2, Check, ChevronsUpDown, Trash2, Search, FileDigit } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  searchPersons,
  registerReversals,
  getAllDirections,
  getPersonsByIdStructure,
  fetchItemsForStructure,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Item, Person, Structure } from "@/lib/definitions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const reversalItemSchema = z.object({
  item: z.any().refine(val => val, { message: "article_is_required" }),
});

const reversalFormSchema = z.object({
  structureId: z.string().min(1, "direction_is_required"),
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
  const [persons, setPersons] = useState<Person[]>([]);
  const [structureItems, setStructureItems] = useState<Item[]>([]);
  
  const [personSearch, setPersonSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [isPersonPopoverOpen, setPersonPopoverOpen] = useState(false);
  const [isItemPopoverOpen, setItemPopoverOpen] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const form = useForm<ReversalFormValues>({
    resolver: zodResolver(reversalFormSchema),
    defaultValues: {
      structureId: "",
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
    form.setValue("personId", "");
    form.setValue("reversals", []);
    setPersons([]);
    setStructureItems([]);

    if (selectedStructureId) {
      (async () => {
        const personsRes = await getPersonsByIdStructure(parseInt(selectedStructureId, 10));
        // De-duplicate persons
        const uniquePersons = personsRes.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        setPersons(uniquePersons);
      })();

      (async () => {
        setIsLoadingItems(true);
        try {
          const res = await fetchItemsForStructure(parseInt(selectedStructureId, 10), { pageIndex: 0, pageSize: 1000 });
          const items = res.data || [];
          // De-duplicate items
          const uniqueItems = items.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
          setStructureItems(uniqueItems);
        } catch (error) {
          console.error("Failed to fetch structure items", error);
          setStructureItems([]);
        } finally {
          setIsLoadingItems(false);
        }
      })();
    }
  }, [selectedStructureId, form]);

  useEffect(() => {
    const fetchBeneficiaries = async () => {
        if (personSearch && selectedStructureId) {
            const res = await searchPersons(personSearch, selectedStructureId);
            const data = res.data || [];
            const uniqueData = data.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
            setPersons(uniqueData);
        } else if (selectedStructureId) {
            const res = await getPersonsByIdStructure(parseInt(selectedStructureId, 10));
            const uniqueData = res.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
            setPersons(uniqueData);
        }
    };

    if (isPersonPopoverOpen && selectedStructureId) {
        const debounce = setTimeout(fetchBeneficiaries, 300);
        return () => clearTimeout(debounce);
    }
}, [personSearch, selectedStructureId, isPersonPopoverOpen]);

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
            title: t('item_already_added', 'Item already added'),
            description: t('item_already_added_desc', 'This item is already in the list to be returned.'),
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

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('add_new_reversal')}</DialogTitle>
          <DialogDescription>
            {t('add_reversal_desc')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="structureId"
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
                  name="attestationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileDigit className="h-3.5 w-3.5" />
                        {t('attestation_id', 'Attestation ID')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ATT-2024-001" {...field} />
                      </FormControl>
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
                    <FormLabel>{t('beneficiary')}</FormLabel>
                    <Popover open={isPersonPopoverOpen} onOpenChange={setPersonPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={!selectedStructureId}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? persons.find(
                                  (p) => p.id.toString() === field.value
                                )?.firstName + " " + persons.find(
                                  (p) => p.id.toString() === field.value
                                )?.lastName || t('select_beneficiary_placeholder')
                              : t('select_beneficiary_placeholder')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder={t('search_person_placeholder')}
                            onValueChange={setPersonSearch}
                            disabled={!selectedStructureId}
                          />
                           <ScrollArea className="max-h-56">
                          <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                            <CommandGroup>
                              <CommandList>
                                {persons.map((person) => (
                                  <CommandItem
                                    value={person.id.toString()}
                                    key={`person-${person.id}`}
                                    onSelect={() => {
                                      form.setValue("personId", person.id.toString());
                                      setPersonPopoverOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        person.id.toString() === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{person.grade} {person.firstName} {person.lastName} ({person.pseudo})</span>
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
                  </FormItem>
                )}
              />

              {selectedStructureId && (
                <div className="space-y-4 pt-4 border-t">
                    <FormLabel>{t('articles_to_return')}</FormLabel>
                    
                    <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="rounded-md border p-4 space-y-2 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        
                        <div>
                            <p className="font-semibold text-sm">{field.item.article.model} - <span className="text-xs text-muted-foreground">{field.item.article.designation}</span></p>
                            <p className="text-sm">{t('serial_number')}: <Badge variant="secondary">{field.item.serialNumber}</Badge></p>
                            <p className="text-sm">{t('status')}: <StatusBadge status={field.item.status} /></p>
                        </div>
                        </div>
                    ))}
                    </div>

                    <div className="space-y-2">
                        <FormLabel>{t('search_item_in_structure', 'Search Item in Structure')}</FormLabel>
                        <Popover open={isItemPopoverOpen} onOpenChange={setItemPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isLoadingItems}
                              className="w-full justify-between"
                            >
                              {isLoadingItems ? t('loading_items', 'Loading items...') : t('search_add_serial_placeholder')}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder={t('filter_by_serial_number_placeholder')} 
                                onValueChange={setItemSearch}
                              />
                              <ScrollArea className="max-h-64">
                                <CommandEmpty>{t('no_items_found', 'No items found.')}</CommandEmpty>
                                <CommandGroup>
                                  <CommandList>
                                    {structureItems
                                      .filter(item => item.serialNumber?.toLowerCase().includes(itemSearch.toLowerCase()))
                                      .map((item) => (
                                      <CommandItem
                                        key={`item-${item.id}`}
                                        value={item.id.toString()}
                                        onSelect={() => handleSelectItem(item)}
                                      >
                                        <div className="flex flex-col w-full">
                                          <div className="flex justify-between items-center w-full">
                                            <span className="font-medium">{item.serialNumber}</span>
                                            <Badge variant="outline" className="text-[10px]">{item.article.model}</Badge>
                                          </div>
                                          <span className="text-xs text-muted-foreground">{item.article.designation}</span>
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

              <FormField
                control={form.control}
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
                <Button type="submit" disabled={loading || !selectedPersonId || fields.length === 0}>
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

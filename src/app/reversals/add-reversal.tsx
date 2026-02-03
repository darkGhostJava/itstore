
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
import { PlusCircle, Trash2, Undo2, Check, ChevronsUpDown } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  searchPersons,
  fetchItemsForPerson,
  registerReversals,
  getAllDirections,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Item, Person, Structure } from "@/lib/definitions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const reversalItemSchema = z.object({
  item: z.any().refine(val => val, { message: "article_is_required" }),
  remarks: z.string().min(1, "remarks_are_required"),
});

const reversalFormSchema = z.object({
  personId: z.string().min(1, "beneficiary_is_required"),
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
  const [persons, setPersons] = useState<Person[]>([]);
  const [personItems, setPersonItems] = useState<Item[]>([]);
  const [personSearch, setPersonSearch] = useState("");
  const [isPersonPopoverOpen, setPersonPopoverOpen] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const form = useForm<ReversalFormValues>({
    resolver: zodResolver(reversalFormSchema),
    defaultValues: {
      personId: "",
      reversals: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reversals",
  });
  
  const selectedPersonId = form.watch("personId");

  // Fetch persons when searching
  useEffect(() => {
    const fetchDebouncedPersons = async () => {
      if (personSearch.length > 1) {
        const res = await searchPersons(personSearch, ""); // empty structureId to search globally
        setPersons(res.data || []);
      }
    };

    if (isPersonPopoverOpen) {
        const timeout = setTimeout(fetchDebouncedPersons, 300);
        return () => clearTimeout(timeout);
    }
  }, [personSearch, isPersonPopoverOpen]);

  // Fetch distributed items for selected person
  useEffect(() => {
    const loadItems = async () => {
      if (selectedPersonId) {
        setIsLoadingItems(true);
        try {
          const res = await fetchItemsForPerson(parseInt(selectedPersonId, 10), { pageIndex: 0, pageSize: 100 });
          setPersonItems(res.data || []);
        } catch (error) {
          console.error("Failed to fetch person items", error);
          setPersonItems([]);
        } finally {
          setIsLoadingItems(false);
        }
      } else {
        setPersonItems([]);
      }
    };
    loadItems();
  }, [selectedPersonId]);


  async function onSubmit(values: ReversalFormValues) {
    setLoading(true);
    try {
      const payload = values.reversals.map(rev => ({
        itemId: rev.item.id,
        personId: parseInt(values.personId, 10),
        remarks: rev.remarks,
      }));

      await registerReversals(payload);

      toast({
        title: t('reversal_added_toast_title'),
        description: t('reversal_added_toast_desc'),
      });

      form.reset();
      remove();
      setOpen(false);
      onSuccess?.(); // Trigger refresh
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
        append({ item: item, remarks: "" });
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
               {/* Beneficiary Search */}
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
                        <Command filter={(value, search) => 1}>
                          <CommandInput
                            placeholder={t('search_person_placeholder')}
                            onValueChange={setPersonSearch}
                          />
                           <ScrollArea className="max-h-56">
                          <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                            <CommandGroup>
                              {persons.map((person) => (
                                <CommandItem
                                  value={`${person.firstName} ${person.lastName}`}
                                  key={person.id}
                                  onSelect={() => {
                                    form.setValue("personId", person.id.toString());
                                    form.setValue("reversals", []); // Clear current reversals if person changes
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
                                    <span className="text-xs text-muted-foreground">{person.structure?.name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </ScrollArea>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedPersonId && (
                <div className="space-y-4 pt-4 border-t">
                    <FormLabel>{t('articles_to_return')}</FormLabel>
                    
                    <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="rounded-md border p-4 space-y-4 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        
                        <div>
                            <p className="font-semibold text-sm">{field.item.article.model} - <span className="text-xs text-muted-foreground">{field.item.article.designation}</span></p>
                            <p className="text-sm">{t('serial_number')}: <Badge variant="secondary">{field.item.serialNumber}</Badge></p>
                            <p className="text-sm">{t('status')}: <StatusBadge status={field.item.status} /></p>
                        </div>

                        <FormField
                            control={form.control}
                            name={`reversals.${index}.remarks`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('remarks')}</FormLabel>
                                <FormControl>
                                <Textarea
                                    placeholder={t('add_remarks_placeholder')}
                                    {...field}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                    ))}
                    </div>

                    <div className="space-y-2">
                        <FormLabel>{t('select_item_from_assigned', 'Select Item from Assigned')}</FormLabel>
                        <Select onValueChange={(val) => {
                            const item = personItems.find(i => i.id.toString() === val);
                            if (item) handleSelectItem(item);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingItems ? t('loading_items', 'Loading items...') : t('select_item_placeholder', 'Select an assigned item to return')} />
                            </SelectTrigger>
                            <SelectContent>
                                {personItems.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground">{t('no_items_found', 'No items currently assigned to this person.')}</div>
                                ) : (
                                    personItems.map((item) => (
                                        <SelectItem key={item.id} value={item.id.toString()}>
                                            {item.serialNumber} - {item.article.model} ({item.status})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <FormMessage>
                            {form.formState.errors.reversals && typeof form.formState.errors.reversals.message === 'string' && t(form.formState.errors.reversals.message)}
                        </FormMessage>
                    </div>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={loading || !selectedPersonId}>
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

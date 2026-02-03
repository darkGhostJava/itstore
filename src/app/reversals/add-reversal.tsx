
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
import { PlusCircle, Trash2, Undo2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getAllDirections,
  getPersonsByIdStructure,
  searchItemsBySerialNumberAndPerson,
  registerReversals,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Item, Person, Structure } from "@/lib/definitions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTranslation } from "react-i18next";

const reversalItemSchema = z.object({
  item: z.any().refine(val => val, { message: "article_is_required" }),
  remarks: z.string().min(1, "remarks_are_required"),
});

const reversalFormSchema = z.object({
  structureId: z.string().min(1, "direction_is_required"),
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
  const [directions, setDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [searchedItems, setSearchedItems] = useState<Item[]>([]);

  const form = useForm<ReversalFormValues>({
    resolver: zodResolver(reversalFormSchema),
    defaultValues: {
      structureId: "",
      personId: "",
      reversals: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reversals",
  });
  
  const selectedPersonId = form.watch("personId");

  useEffect(() => {
    if (open) {
      (async () => {
        const res = await getAllDirections();
        setDirections(res.data || []);
      })();
    }
  }, [open]);

  const selectedStructureId = form.watch("structureId");

  useEffect(() => {
    const fetchPersons = async () => {
      form.resetField("personId");
      setPersons([]);
      if (selectedStructureId) {
        const res = await getPersonsByIdStructure(parseInt(selectedStructureId));
        setPersons(res || []);
      }
    };
    fetchPersons();
  }, [selectedStructureId, form]);


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
        <Button>
          <Undo2 className="mr-2 h-4 w-4" />
          {t('add_reversal')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('add_new_reversal')}</DialogTitle>
          <DialogDescription>
            {t('add_reversal_desc', 'Select who is returning the item, then find items by serial number to add for reversal.')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               {/* Person Selection */}
              <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem key={structure.id} value={structure.id.toString()}>
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
                  name="personId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('beneficiary')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedStructureId || persons.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_beneficiary_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {persons.map((person) => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.firstName} {person.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedStructureId && (
                        <FormDescription>
                            {t('select_direction_first')}
                        </FormDescription>
                     )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormLabel>{t('articles_to_return', 'Articles to Return')}</FormLabel>
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

                <div className="relative space-y-2">
                  <FormLabel htmlFor="item-search">{t('search_add_serial_placeholder')}</FormLabel>
                   <div className="relative">
                    <Input
                      id="item-search"
                      placeholder={t('search_add_serial_placeholder')}
                      onChange={(e) => handleItemSearch(e.target.value)}
                       onBlur={() => setTimeout(() => setSearchedItems([]), 150)}
                      className="flex-1"
                      disabled={!selectedPersonId}
                    />
                    {searchedItems.length > 0 && (
                      <div className="absolute z-10 w-full rounded border bg-background shadow-md mt-1 max-h-56 overflow-y-auto">
                        {searchedItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-2 cursor-pointer hover:bg-muted"
                            onMouseDown={() => {
                              append({ item: item, remarks: "" });
                              setSearchedItems([]);
                              const searchInput = document.getElementById('item-search');
                              if (searchInput) (searchInput as HTMLInputElement).value = "";
                            }}
                          >
                            {item.serialNumber} ({item.article.model}) - {t('status')}: {item.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!selectedPersonId && <FormDescription>{t('select_person_to_search_items', 'Please select a person to search for their items.')}</FormDescription>}
                  <FormMessage>
                    {form.formState.errors.reversals && typeof form.formState.errors.reversals.message === 'string' && t(form.formState.errors.reversals.message)}
                  </FormMessage>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? t('saving') : t('save_reversal', 'Save Reversal')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

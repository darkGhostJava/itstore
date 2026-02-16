
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
import { PlusCircle, Trash2, FileDigit } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getAllDirections,
  getPersonsByIdStructure,
  searchItemsBySerialNumberAndPerson,
  registerReparations,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Item, Person, Structure } from "@/lib/definitions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTranslation } from "react-i18next";

const reparationItemSchema = z.object({
  item: z.any().refine(val => val, { message: "Please select an item." }),
  remarks: z.string().min(1, "Remarks are required."),
});

const reparationFormSchema = z.object({
  structureId: z.string().min(1, "Please select a direction."),
  personId: z.string().min(1, "Please select the person returning the item."),
  attestationId: z.string().optional(),
  reparations: z.array(reparationItemSchema).min(1, "Please add at least one item for repair."),
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
  const [persons, setPersons] = useState<Person[]>([]);
  const [searchedItems, setSearchedItems] = useState<Item[]>([]);

  const form = useForm<ReparationFormValues>({
    resolver: zodResolver(reparationFormSchema),
    defaultValues: {
      structureId: "",
      personId: "",
      attestationId: "",
      reparations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reparations",
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
        // De-duplicate persons
        const uniquePersons = res.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        setPersons(uniquePersons || []);
      }
    };
    fetchPersons();
  }, [selectedStructureId, form]);


  async function onSubmit(values: ReparationFormValues) {
    setLoading(true);
    try {
      const repairsPayload = values.reparations.map(rep => ({
        itemId: rep.item.id,
        remarks: rep.remarks,
        userId: 1, // Assuming a logged-in user
      }));

      await registerReparations({
        attestationId: values.attestationId,
        reparations: repairsPayload
      });

      toast({
        title: "Repair(s) Registered",
        description: "The items have been successfully registered for repair.",
      });

      form.reset();
      remove();
      setOpen(false);
      onSuccess?.(); // Trigger refresh
    } catch (error) {
      console.error("Error registering repair:", error);
      toast({
        title: "Error",
        description: "Failed to register the items for repair.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleItemSearch = async (query: string) => {
    if (query.length > 1 && selectedPersonId) {
      const res = await searchItemsBySerialNumberAndPerson(parseInt(selectedPersonId), query);
      // De-duplicate items
      const uniqueItems = res.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
      setSearchedItems(uniqueItems);
    } else {
      setSearchedItems([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('reparation')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('register_for_repair', 'Register Items for Repair')}</DialogTitle>
          <DialogDescription>
            Select who is returning the item, then find items by serial number to add for repair.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               {/* Metadata Section */}
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
                  name="attestationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileDigit className="h-3.5 w-3.5" />
                        {t('attestation_id', 'Attestation ID')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., REP-2024-001" {...field} />
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
                  <FormItem>
                    <FormLabel>{t('returned_by', 'Returned By')}</FormLabel>
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
                          <SelectItem key={`rep-per-${person.id}`} value={person.id.toString()}>
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

              <div className="space-y-4 pt-4 border-t">
                <FormLabel>{t('items_to_repair', 'Items to Repair')}</FormLabel>
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
                        name={`reparations.${index}.remarks`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('repair_remarks', 'Repair Remarks')}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the issue with this item..."
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
                  <FormLabel htmlFor="item-search">{t('search_item_by_serial', 'Add Item by Serial Number')}</FormLabel>
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
                            key={`rep-search-${item.id}`}
                            className="p-2 cursor-pointer hover:bg-muted text-sm"
                            onMouseDown={() => {
                              append({ item: item, remarks: "" });
                              setSearchedItems([]);
                              const searchInput = document.getElementById('item-search');
                              if (searchInput) (searchInput as HTMLInputElement).value = "";
                            }}
                          >
                            {item.serialNumber} ({item.article.model}) - Status: {item.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!selectedPersonId && <FormDescription>{t('select_person_to_search_items')}</FormDescription>}
                  <FormMessage>
                    {form.formState.errors.reparations && typeof form.formState.errors.reparations.message === 'string' && form.formState.errors.reparations.message}
                  </FormMessage>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading || fields.length === 0}>
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

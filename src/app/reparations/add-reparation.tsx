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
import { PlusCircle, Trash2, FileDigit, Search } from "lucide-react";
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
        setPersons(res || []);
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
        userId: 1, // Current logged in user ID
      }));

      await registerReparations({
        attestationId: values.attestationId,
        reparations: repairsPayload
      });

      toast({
        title: t('reparation_added_toast_title', 'Repair Registered'),
        description: t('reparation_added_toast_desc', 'Items registered for repair successfully.'),
      });

      form.reset();
      remove();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error registering repair:", error);
      toast({
        title: t('error'),
        description: t('add_reparation_error', 'Failed to register repair.'),
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
            {t('register_for_repair_desc', 'Select beneficiary returning items and find them by serial number.')}
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                  name="attestationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <FileDigit className="h-3.5 w-3.5" />
                        {t('attestation_id')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., REP-2024-001" {...field} className="h-11" />
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
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('returned_by')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedStructureId || persons.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={t('select_beneficiary_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {persons.map((person) => (
                          <SelectItem key={`rep-per-${person.id}`} value={person.id.toString()}>
                            {person.grade} {person.firstName} {person.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                                placeholder={t('repair_remarks_placeholder', 'Describe the issue with this item...')}
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

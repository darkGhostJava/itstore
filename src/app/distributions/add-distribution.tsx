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
import { PlusCircle, Trash2, Check, ChevronsUpDown, Search } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getAllDirections,
  getSubDirectionsOfDirection,
  searchArticles,
  searchItemsBySerialNumber,
  searchPersons,
  getPersonsByIdStructure,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Article, Item, Person, Structure } from "@/lib/definitions";
import { api } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const articleDistributionSchema = z.object({
  article: z.any().refine(val => val, { message: "article_is_required" }),
  serialNumbers: z.array(z.string()).optional(),
  quantity: z.number().optional(),
});

const distributionFormSchema = z.object({
  directionId: z.string().min(1, "direction_is_required"),
  subDirectionId: z.string().optional(),
  beneficiaryId: z.string().min(1, "beneficiary_is_required"),
  remarks: z.string().optional(),
  articles: z.array(articleDistributionSchema).min(1, "at_least_one_article_is_required"),
});

type DistributionFormValues = z.infer<typeof distributionFormSchema>;

interface AddDistributionProps {
  onSuccess?: () => void;
}

export function AddDistribution({ onSuccess }: AddDistributionProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [searchedArticles, setSearchedArticles] = useState<Article[]>([]);
  const [directions, setDirections] = useState<Structure[]>([]);
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [serials, setSerials] = useState<Record<number, Item[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchArticleType, setSearchArticleType] = useState<"ALL" | "HARDWARE" | "CONSUMABLE">("ALL");
  const [personSearch, setPersonSearch] = useState("");
  const [isPersonPopoverOpen, setPersonPopoverOpen] = useState(false);
  const { t } = useTranslation('common');

  const form = useForm<DistributionFormValues>({
    resolver: zodResolver(distributionFormSchema),
    defaultValues: {
      directionId: "",
      subDirectionId: "",
      beneficiaryId: "",
      remarks: "",
      articles: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "articles",
  });

  useEffect(() => {
    if(open) {
      (async () => {
        const res = await getAllDirections();
        setDirections(res.data || []);
      })();
    }
  }, [open]);

  const selectedDirectionId = form.watch("directionId");

  // Load sub-directions and persons when the main direction changes
  useEffect(() => {
    form.setValue("subDirectionId", "");
    form.setValue("beneficiaryId", "");
    setSubDirections([]);
    setPersons([]);

    if (selectedDirectionId) {
      // 1. Load Sub-Directions
      (async () => {
        const res = await getSubDirectionsOfDirection(parseInt(selectedDirectionId, 10));
        setSubDirections(res.data || []);
      })();
      
      // 2. Load Persons from the main structure (always use main structure for persons)
      (async () => {
        const personsRes = await getPersonsByIdStructure(parseInt(selectedDirectionId, 10));
        setPersons(personsRes || []);
      })();
    }
  }, [selectedDirectionId, form]);

  // Handle dynamic person search (always uses main structure ID)
  useEffect(() => {
    const fetchPersonsData = async () => {
        if (personSearch && selectedDirectionId) {
            const res = await searchPersons(personSearch, selectedDirectionId);
            setPersons(res.data || []);
        } else if (selectedDirectionId) {
            const personsRes = await getPersonsByIdStructure(parseInt(selectedDirectionId, 10));
            setPersons(personsRes || []);
        }
    };

    if (isPersonPopoverOpen && selectedDirectionId) {
        const debounce = setTimeout(fetchPersonsData, 300);
        return () => clearTimeout(debounce);
    }
  }, [personSearch, selectedDirectionId, isPersonPopoverOpen]);

  async function onSubmit(values: DistributionFormValues) {
    setLoading(true);
    try {
      const hardwares: { [key: number]: string[] } = {};
      const consumables: { [key: number]: number } = {};

      values.articles.forEach(dist => {
        if (dist.article.type === 'HARDWARE' && dist.serialNumbers && dist.serialNumbers.length > 0) {
          hardwares[dist.article.id] = dist.serialNumbers;
        } else if (dist.article.type === 'CONSUMABLE' && dist.quantity && dist.quantity > 0) {
          consumables[dist.article.id] = dist.quantity;
        }
      });
      
      const payload = {
        personId: parseInt(values.beneficiaryId),
        remarks: values.remarks,
        userId: 1,
        hardwares,
        consumables,
        subDirectionId: values.subDirectionId ? parseInt(values.subDirectionId) : parseInt(values.directionId),
      };

      const response = await api.post("/distributions", payload, {
        responseType: "arraybuffer",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `decharge_${Date.now()}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t('distribution_added_toast_title'),
        description: t('distribution_added_toast_desc'),
      });

      form.reset();
      remove();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error adding distribution:", error);
      toast({
        title: t('error'),
        description: t('add_distribution_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleArticleSearch = async (query: string) => {
    if (query.length > 1) {
      const res = await searchArticles(query, searchArticleType);
      setSearchedArticles(res.data || []);
    } else {
      setSearchedArticles([]);
    }
  };

  const handleSerialSearch = async (serialNumber: string, articleId: number, fieldIndex: number) => {
    if (serialNumber.length > 0 && articleId) {
      const res = await searchItemsBySerialNumber(serialNumber, articleId);
      setSerials(prev => ({ ...prev, [fieldIndex]: res || [] }));
    } else {
      setSerials(prev => ({ ...prev, [fieldIndex]: [] }));
    }
  }

  const handleSelectSerial = (serial: Item, fieldIndex: number) => {
    const currentSerials = form.getValues(`articles.${fieldIndex}.serialNumbers`) || [];
    if (!currentSerials.includes(serial.serialNumber)) {
        const field = fields[fieldIndex];
        update(fieldIndex, {
            ...field,
            serialNumbers: [...currentSerials, serial.serialNumber]
        });
    }
    setSerials(prev => ({ ...prev, [fieldIndex]: [] }));
    const serialInput = document.getElementById(`serial-search-${fieldIndex}`);
    if (serialInput) (serialInput as HTMLInputElement).value = '';
  };
  
  const handleRemoveSerialNumber = (articleIndex: number, serialToRemove: string) => {
    const currentSerials = form.getValues(`articles.${articleIndex}.serialNumbers`) || [];
    const field = fields[articleIndex];
    update(articleIndex, {
        ...field,
        serialNumbers: currentSerials.filter(sn => sn !== serialToRemove)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_distribution')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('add_new_distribution')}</DialogTitle>
          <DialogDescription>
            {t('add_new_distribution_desc')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="directionId"
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
                  name="subDirectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sub_direction')} <span className="text-xs text-muted-foreground">({t('optional')})</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedDirectionId || subDirections.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_sub_direction_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subDirections.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id.toString()}>
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
                name="beneficiaryId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('beneficiary')}</FormLabel>
                    <Popover open={isPersonPopoverOpen} onOpenChange={setPersonPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={!selectedDirectionId}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? persons.find(
                                  (person) => person.id.toString() === field.value
                                )?.firstName + " " + persons.find(
                                  (person) => person.id.toString() === field.value
                                )?.lastName
                              : t('select_beneficiary_placeholder')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command filter={() => 1}>
                          <CommandInput
                            placeholder={t('search_person_placeholder')}
                            onValueChange={setPersonSearch}
                            disabled={!selectedDirectionId}
                          />
                           <ScrollArea className="max-h-56">
                          <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                            <CommandGroup>
                              <CommandList>
                                {persons.map((person) => (
                                  <CommandItem
                                    value={`${person.firstName} ${person.lastName}`}
                                    key={person.id}
                                    onSelect={() => {
                                      form.setValue("beneficiaryId", person.id.toString());
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
                                    {person.grade} {person.firstName} {person.lastName} {person.pseudo && `(${person.pseudo})`}
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

              <div className="space-y-4">
                <FormLabel className="text-lg font-bold">{t('articles_to_distribute')}</FormLabel>
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const article = (field as any).article as Article;
                    const articleType = article.type;
                    const currentSerialsList = serials[index] || [];
                    const addedSerials = form.getValues(`articles.${index}.serialNumbers`);

                    return (
                      <div key={field.id} className="rounded-lg border bg-muted/30 p-4 space-y-4 relative shadow-sm">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2 pr-8">
                          <p className="font-semibold text-sm">{article.model}</p>
                          <Badge variant={articleType === "HARDWARE" ? "default" : "secondary"}>
                            {t(articleType.toLowerCase() as "hardware" | "consumable")}
                          </Badge>
                          <span className={cn("text-[10px] ml-auto font-bold px-2 py-0.5 rounded-full border", article.quantity === 0 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-green-500/10 text-green-600 border-green-500/20")}>
                            {t('stock')}: {article.quantity}
                          </span>
                        </div>

                        {articleType === 'HARDWARE' && (
                          <FormItem>
                            <FormLabel>{t('serial_numbers')}</FormLabel>
                             <div className="relative">
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id={`serial-search-${index}`}
                                            placeholder={t('search_add_serial_placeholder')}
                                            onChange={(e) => handleSerialSearch(e.target.value, article.id, index)}
                                            onBlur={() => setTimeout(() => setSerials(prev => ({ ...prev, [index]: [] })), 150)}
                                            className="pl-9 bg-background"
                                        />
                                    </div>
                                  </div>
                                  {currentSerialsList.length > 0 && (
                                    <div className="absolute z-10 w-full rounded border bg-background shadow-lg mt-1 max-h-48 overflow-y-auto">
                                      {currentSerialsList.map((serial) => (
                                        <div
                                          key={serial.id}
                                          className="p-3 cursor-pointer hover:bg-accent transition-colors border-b last:border-0"
                                          onMouseDown={() => handleSelectSerial(serial, index)}
                                        >
                                          <code className="text-sm font-mono">{serial.serialNumber}</code>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {addedSerials?.map((sn) => (
                                <Badge key={sn} variant="secondary" className="flex items-center gap-1.5 py-1 pl-2">
                                  <span className="font-mono text-xs">{sn}</span>
                                  <button
                                    type="button"
                                    className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                    onClick={() => handleRemoveSerialNumber(index, sn)}
                                  >
                                    &times;
                                  </button>
                                </Badge>
                              ))}
                              {(!addedSerials || addedSerials.length === 0) && <p className="text-xs text-muted-foreground italic">{t('no_serials_added', 'No serial numbers selected.')}</p>}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}

                        {articleType === 'CONSUMABLE' && (
                          <FormField
                            control={form.control}
                            name={`articles.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('quantity')}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={article.quantity}
                                    placeholder={t('enter_quantity_placeholder')}
                                    {...field}
                                    className="bg-background"
                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                  />
                                </FormControl>
                                <FormDescription className="text-[10px]">
                                    {article.quantity === 0 ? t('out_of_stock', 'Out of stock') : t('max_available', 'Max available: {{count}}', { count: article.quantity })}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="relative space-y-2 pt-2">
                  <div className="flex gap-2">
                    <Select
                      value={searchArticleType}
                      onValueChange={(value: "ALL" | "HARDWARE" | "CONSUMABLE") => setSearchArticleType(value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder={t('select_type_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">{t('all_types')}</SelectItem>
                        <SelectItem value="HARDWARE">{t('hardware')}</SelectItem>
                        <SelectItem value="CONSUMABLE">{t('consumable')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="article-search"
                            placeholder={t('search_article_to_add_placeholder')}
                            onChange={(e) => handleArticleSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setSearchedArticles([]), 150)}
                            className="pl-9"
                        />
                    </div>
                  </div>
                  {searchedArticles.length > 0 && (
                    <div className="absolute z-10 w-full rounded border bg-popover shadow-xl mt-1 max-h-56 overflow-y-auto">
                      {searchedArticles.map((article) => (
                        <div
                          key={article.id}
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
                          onMouseDown={() => {
                            append({ article: article, serialNumbers: [], quantity: 1 });
                            setSearchedArticles([]);
                            const articleInput = document.getElementById('article-search');
                            if (articleInput) (articleInput as HTMLInputElement).value = '';
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{article.model}</span>
                            <span className="text-xs opacity-70">{article.designation}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={article.type === "HARDWARE" ? "outline" : "secondary"} className="text-[10px]">
                                {t(article.type.toLowerCase() as any)}
                            </Badge>
                            <span className={cn("text-[10px] font-bold", article.quantity === 0 ? "text-destructive" : "text-green-600")}>
                                {t('stock')}: {article.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <FormMessage />
              </div>

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
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? t('saving') : t('save_distribution')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

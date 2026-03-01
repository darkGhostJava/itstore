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
import { PlusCircle, Trash2, Check, ChevronsUpDown, Search, AlertTriangle, ChevronRight, ChevronLeft, User, Package, FileText } from "lucide-react";
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
import { ArticleSchema } from "@/lib/schemas";
import { api } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const articleDistributionSchema = z.object({
  article: ArticleSchema,
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

const steps = [
  { id: "beneficiary", title: "Beneficiary", icon: User },
  { id: "articles", title: "Articles", icon: Package },
  { id: "review", title: "Review", icon: FileText },
];

export function AddDistribution({ onSuccess }: AddDistributionProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
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
    if (open) {
      (async () => {
        const res = await getAllDirections();
        setDirections(res.data || []);
      })();
      setStep(0);
    }
  }, [open]);

  const selectedDirectionId = form.watch("directionId");

  useEffect(() => {
    form.setValue("subDirectionId", "");
    form.setValue("beneficiaryId", "");
    setSubDirections([]);
    setPersons([]);

    if (selectedDirectionId) {
      // Fetch sub-directions (Optional)
      (async () => {
        const res = await getSubDirectionsOfDirection(parseInt(selectedDirectionId, 10));
        setSubDirections(res.data || []);
      })();
      
      // Fetch persons based ONLY on directionId as per business rule
      (async () => {
        const personsRes = await getPersonsByIdStructure(parseInt(selectedDirectionId, 10));
        setPersons(personsRes);
      })();
    }
  }, [selectedDirectionId, form]);

  useEffect(() => {
    const fetchPersonsData = async () => {
        if (personSearch && selectedDirectionId) {
            // Search persons within the selected direction
            const res = await searchPersons(personSearch, selectedDirectionId);
            setPersons(res.data || []);
        } else if (selectedDirectionId) {
            const personsRes = await getPersonsByIdStructure(parseInt(selectedDirectionId, 10));
            setPersons(personsRes);
        }
    };

    if (isPersonPopoverOpen && selectedDirectionId) {
        const debounce = setTimeout(fetchPersonsData, 300);
        return () => clearTimeout(debounce);
    }
  }, [personSearch, selectedDirectionId, isPersonPopoverOpen]);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 0) fieldsToValidate = ["directionId", "beneficiaryId"];
    if (step === 1) fieldsToValidate = ["articles"];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

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
        // Fallback to directionId if subDirectionId is not selected
        subDirectionId: values.subDirectionId ? parseInt(values.subDirectionId) : parseInt(values.directionId),
      };

      const response = await api.post("/distributions", payload, {
        responseType: "arraybuffer",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `decharge_${Date.now()}.pdf`;
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
    if (!currentSerials.includes(serial.serialNumber!)) {
        update(fieldIndex, {
            ...fields[fieldIndex],
            serialNumbers: [...currentSerials, serial.serialNumber!]
        });
    }
    setSerials(prev => ({ ...prev, [fieldIndex]: [] }));
    const serialInput = document.getElementById(`serial-search-${fieldIndex}`) as HTMLInputElement;
    if (serialInput) serialInput.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hover:scale-105 transition-transform shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_distribution')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{t('add_new_distribution')}</DialogTitle>
          <DialogDescription>
            {t('add_new_distribution_desc')}
          </DialogDescription>
        </DialogHeader>

        {/* Wizard Progress */}
        <div className="px-6 py-4 flex items-center justify-between bg-muted/30 border-y">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-initial">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                step === i ? "bg-primary text-primary-foreground shadow-md scale-110" : (step > i ? "bg-green-500 text-white" : "bg-muted text-muted-foreground")
              )}>
                {step > i ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-xs font-medium", step === i ? "text-primary font-bold" : "text-muted-foreground")}>
                {t(s.id as any, s.title)}
              </span>
              {i < steps.length - 1 && <div className="h-px bg-border flex-1 mx-2" />}
            </div>
          ))}
        </div>

        <ScrollArea className="max-h-[60vh] p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="directionId"
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
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {t('sub_direction')} <span className="text-[10px] font-normal lowercase italic">({t('optional')})</span>
                            </FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!selectedDirectionId || subDirections.length === 0}
                            >
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
                      name="beneficiaryId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('beneficiary')}</FormLabel>
                          <Popover open={isPersonPopoverOpen} onOpenChange={setPersonPopoverOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  disabled={!selectedDirectionId}
                                  className={cn(
                                    "w-full justify-between h-12 text-left bg-background",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value
                                    ? persons.find((p) => p.id.toString() === field.value)?.firstName + " " + persons.find((p) => p.id.toString() === field.value)?.lastName
                                    : t('select_beneficiary_placeholder')}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl" align="start">
                              <Command shouldFilter={false}>
                                <CommandInput placeholder={t('search_person_placeholder')} onValueChange={setPersonSearch} />
                                <CommandList>
                                  <ScrollArea className="max-h-56">
                                    <CommandEmpty>{t('no_person_found')}</CommandEmpty>
                                    <CommandGroup>
                                      {persons.map((person) => (
                                        <CommandItem
                                          key={`person-${person.id}`}
                                          value={person.id.toString()}
                                          onSelect={() => {
                                            form.setValue("beneficiaryId", person.id.toString());
                                            setPersonPopoverOpen(false);
                                          }}
                                          className="py-3"
                                        >
                                          <Check className={cn("mr-2 h-4 w-4 text-primary", person.id.toString() === field.value ? "opacity-100" : "opacity-0")} />
                                          <div className="flex flex-col">
                                            <span className="font-semibold">{person.grade} {person.firstName} {person.lastName}</span>
                                            {person.pseudo && <span className="text-[10px] text-primary/70 font-mono tracking-tighter">@{person.pseudo}</span>}
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </ScrollArea>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="relative space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-primary/80">{t('search_article_to_add_placeholder')}</FormLabel>
                      <div className="flex gap-2">
                        <Select value={searchArticleType} onValueChange={(v: any) => setSearchArticleType(v)}>
                          <SelectTrigger className="w-[140px] h-10 bg-background border-none shadow-sm">
                            <SelectValue />
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
                            placeholder={t('search_article_placeholder')}
                            onChange={(e) => handleArticleSearch(e.target.value)}
                            className="pl-9 h-10 bg-background border-none shadow-sm"
                          />
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {searchedArticles.length > 0 && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="absolute z-50 w-full left-0 rounded-xl border bg-popover shadow-2xl mt-1 overflow-hidden"
                          >
                            <ScrollArea className="max-h-56">
                              {searchedArticles.map((article) => {
                                const isLow = article.strategicStock ? article.quantity <= article.strategicStock : article.quantity === 0;
                                return (
                                  <div
                                    key={`art-${article.id}`}
                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-accent transition-colors border-b last:border-0"
                                    onMouseDown={() => {
                                      append({ article, serialNumbers: [], quantity: 1 });
                                      setSearchedArticles([]);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-sm">{article.model}</span>
                                      <span className="text-[10px] text-muted-foreground">{article.designation}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge variant={article.type === "HARDWARE" ? "default" : "secondary"} className="text-[9px] h-4 uppercase">
                                        {t(article.type.toLowerCase() as any)}
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        <span className={cn("text-[10px] font-bold", isLow ? "text-destructive" : "text-green-600")}>
                                          {t('stock')}: {article.quantity}
                                        </span>
                                        {isLow && <AlertTriangle className="h-2.5 w-2.5 text-destructive animate-pulse" />}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </ScrollArea>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('articles_to_distribute')}</h4>
                        <Badge variant="outline" className="text-[10px]">{fields.length} {t('articles')}</Badge>
                      </div>
                      
                      {fields.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/10 opacity-60">
                          <Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                          <p className="text-sm text-muted-foreground">{t('no_articles_selected', 'Select articles from the search above.')}</p>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        {fields.map((field, index) => {
                          const article = (field as any).article as Article;
                          const addedSerials = form.getValues(`articles.${index}.serialNumbers`);
                          const isLow = article.strategicStock ? article.quantity <= article.strategicStock : article.quantity === 0;

                          return (
                            <motion.div 
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              key={field.id} 
                              className="rounded-xl border bg-card p-4 shadow-sm relative group hover:border-primary/30 transition-all"
                            >
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" 
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <Package className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm leading-tight">{article.model}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{article.designation}</span>
                                      <div className="flex items-center gap-1">
                                        <span className={cn("text-[9px] font-bold uppercase", isLow ? "text-destructive" : "text-green-600")}>
                                          {t('stock')}: {article.quantity}
                                        </span>
                                        {article.strategicStock! > 0 && (
                                          <span className="text-[9px] text-muted-foreground italic">(threshold: {article.strategicStock})</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {article.type === 'HARDWARE' ? (
                                  <div className="space-y-3">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                      <Input
                                        id={`serial-search-${index}`}
                                        placeholder={t('search_add_serial_placeholder')}
                                        onChange={(e) => handleSerialSearch(e.target.value, article.id, index)}
                                        className="pl-9 h-9 text-xs bg-muted/30 border-none"
                                      />
                                      {serials[index]?.length > 0 && (
                                        <div className="absolute z-10 w-full rounded-lg border bg-background shadow-xl mt-1 max-h-40 overflow-y-auto">
                                          {serials[index].map((s) => (
                                            <div 
                                              key={`ser-${s.id}`} 
                                              className="p-2.5 cursor-pointer hover:bg-accent text-xs font-mono border-b last:border-0" 
                                              onMouseDown={() => handleSelectSerial(s, index)}
                                            >
                                              {s.serialNumber}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                                      {addedSerials?.map((sn) => (
                                        <Badge key={`sel-ser-${sn}`} variant="secondary" className="px-2.5 py-1 text-[10px] font-mono gap-1.5 bg-secondary/50 border-none">
                                          {sn}
                                          <button 
                                            type="button"
                                            onClick={() => update(index, { ...fields[index], serialNumbers: addedSerials.filter(s => s !== sn) })} 
                                            className="hover:text-destructive transition-colors"
                                          >
                                            ×
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <FormField
                                    control={form.control}
                                    name={`articles.${index}.quantity`}
                                    render={({ field }) => (
                                      <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{t('quantity')}</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            min={1} 
                                            max={article.quantity} 
                                            {...field} 
                                            className="h-9 text-xs w-32 bg-muted/30 border-none" 
                                            onChange={e => field.onChange(parseInt(e.target.value) || 1)} 
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="rounded-2xl border bg-primary/5 p-5 space-y-4 shadow-sm border-primary/10">
                      <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-primary/10 pb-2">{t('summary', 'Summary')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('beneficiary')}</p>
                          <p className="font-semibold text-lg">
                            {persons.find(p => p.id.toString() === form.getValues('beneficiaryId'))?.firstName} {persons.find(p => p.id.toString() === form.getValues('beneficiaryId'))?.lastName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t('articles')}</p>
                          <p className="font-semibold text-lg">{fields.length} Items Selected</p>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('remarks')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('add_remarks_placeholder')} 
                              {...field} 
                              className="min-h-[150px] bg-muted/20 border-muted focus:bg-background transition-all rounded-xl" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 flex flex-row items-center justify-between border-t bg-muted/10">
          <Button variant="ghost" onClick={step === 0 ? () => setOpen(false) : prevStep} disabled={loading} className="gap-2 rounded-xl">
            {step === 0 ? t('cancel') : <><ChevronLeft className="h-4 w-4" /> {t('back')}</>}
          </Button>
          <Button 
            onClick={step === steps.length - 1 ? form.handleSubmit(onSubmit) : nextStep} 
            disabled={loading || (step === 1 && fields.length === 0)} 
            className="gap-2 shadow-xl hover:shadow-primary/20 transition-all rounded-xl h-11 px-6"
          >
            {loading ? t('saving') : (step === steps.length - 1 ? t('confirm_distribution', 'Finish & Download PDF') : <>{t('next')} <ChevronRight className="h-4 w-4" /></>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

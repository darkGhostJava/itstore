
"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, FileUp, X, Search, FileText, Package } from "lucide-react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { searchArticles } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Article } from "@/lib/definitions";
import { api } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { ErrorSummary } from "@/components/shared/error-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

const articleArrivalSchema = z.object({
  article: z.any().refine(val => val, { message: "article_is_required" }),
  serialNumbers: z.array(z.string()).optional(),
  quantity: z.number().optional(),
  file: z.any().optional(),
});

const arrivalFormSchema = z.object({
  budget: z.string().min(1, "budget_is_required"),
  remarks: z.string().optional(),
  articles: z.array(articleArrivalSchema).min(1, "at_least_one_article_is_required"),
  attestation: z.any().optional(),
});

type ArrivalFormValues = z.infer<typeof arrivalFormSchema>;

interface AddArrivalProps {
  onSuccess?: () => void;
}

export function AddArrival({ onSuccess }: AddArrivalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [searchedArticles, setSearchedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchArticleType, setSearchArticleType] = useState<"ALL" | "HARDWARE" | "CONSUMABLE">("ALL");
  const [serialNumberInputs, setSerialNumberInputs] = useState<Record<number, string>>({});
  const { t } = useTranslation('common');

  const form = useForm<ArrivalFormValues>({
    resolver: zodResolver(arrivalFormSchema),
    defaultValues: {
      budget: "",
      remarks: "",
      articles: [],
      attestation: undefined,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "articles",
  });

  const watchedArticles = useWatch({
    control: form.control,
    name: "articles",
  });

  const watchedAttestation = useWatch({
    control: form.control,
    name: "attestation",
  });

  async function onSubmit(values: ArrivalFormValues) {
    setLoading(true);
    try {
      const hasArticleFiles = values.articles.some(a => a.file);
      const hasAttestation = !!values.attestation;

      if (hasArticleFiles || hasAttestation) {
        const formData = new FormData();
        formData.append("budget", values.budget);
        formData.append("remark", values.remarks || "");
        
        if (hasAttestation) {
          formData.append("attestation", values.attestation);
        }

        values.articles.forEach((a) => {
          const articleId = a.article.id;
          if (a.article.type === 'HARDWARE') {
            if (a.serialNumbers && a.serialNumbers.length > 0) {
              a.serialNumbers.forEach(sn => {
                formData.append(`hardwares[${articleId}]`, sn);
              });
            }
            if (a.file) {
              formData.append(`hardwaresFile[${articleId}]`, a.file);
            }
          } else if (a.article.type === 'CONSUMABLE') {
            formData.append(`consumables[${articleId}]`, (a.quantity || 1).toString());
          }
        });

        await api.post("/arrivals/with_file", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        const hardwares: Record<number, string[]> = {};
        const consumables: Record<number, number> = {};

        values.articles.forEach(a => {
          if (a.article.type === 'HARDWARE') {
            hardwares[a.article.id] = a.serialNumbers || [];
          } else {
            consumables[a.article.id] = a.quantity || 1;
          }
        });

        await api.post("/arrivals", {
          budget: values.budget,
          remark: values.remarks || "",
          hardwares,
          consumables
        });
      }

      toast({
        title: t('arrival_added_toast_title'),
        description: t('arrival_added_toast_desc'),
      });

      form.reset();
      remove();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error adding arrival:", error);
      toast({
        title: t('error'),
        description: t('add_arrival_error'),
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
  
  const handleArticleSelect = (article: Article) => {
    append({ article: article, serialNumbers: [], quantity: 1 });
    setSearchedArticles([]);
    const articleInput = document.getElementById('article-search') as HTMLInputElement;
    if (articleInput) articleInput.value = '';
  }

  const handleAddSerialNumber = (index: number) => {
    const newSerial = serialNumberInputs[index]?.trim();
    if (!newSerial) return;

    const currentSerials = form.getValues(`articles.${index}.serialNumbers`) || [];
    if (!currentSerials.includes(newSerial)) {
        update(index, {
            ...fields[index],
            serialNumbers: [...currentSerials, newSerial]
        });
        setSerialNumberInputs(prev => ({ ...prev, [index]: '' }));
    } else {
        toast({
            title: t('duplicate_serial_toast_title'),
            description: t('duplicate_serial_toast_desc'),
            variant: "destructive"
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hover:scale-105 transition-transform shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_arrival')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{t('add_new_arrival')}</DialogTitle>
          <DialogDescription>
            {t('add_arrival_desc')}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
               {form.formState.isSubmitted && !form.formState.isValid && (
                <ErrorSummary errors={form.formState.errors} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('budget')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background h-11">
                            <SelectValue placeholder={t('select_budget_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="COOPERATION">{t('budget_cooperation')}</SelectItem>
                          <SelectItem value="MDN">{t('budget_mdn')}</SelectItem>
                          <SelectItem value="PRESIDENCE">{t('budget_presidence')}</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input placeholder={t('add_remarks_placeholder')} {...field} className="bg-background h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <FormLabel className="text-sm font-bold uppercase tracking-widest text-primary">{t('arrived_articles')}</FormLabel>
                  <Badge variant="secondary" className="font-mono text-xs">{fields.length} Selected</Badge>
                </div>
                
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {fields.map((field, index) => {
                      const article = watchedArticles?.[index]?.article;
                      if (!article) return null;
                      
                      const articleType = article.type;
                      const addedSerials = watchedArticles?.[index]?.serialNumbers || [];
                      const uploadedFile = watchedArticles?.[index]?.file;

                      return (
                        <motion.div 
                          key={field.id}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="rounded-xl border bg-muted/30 p-5 space-y-4 relative shadow-sm hover:shadow-md transition-all group"
                        >
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive" 
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-3 pr-10">
                            <div className="p-2 rounded-lg bg-background shadow-sm">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <p className="font-bold text-sm leading-none mb-1">{article.model}</p>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-tight">— {article.designation}</span>
                            </div>
                            <Badge variant={articleType === "HARDWARE" ? "default" : "secondary"} className="ml-auto text-[10px] h-5">
                              {t(articleType.toLowerCase() as "hardware" | "consumable")}
                            </Badge>
                          </div>

                          {articleType === 'HARDWARE' && (
                            <Tabs defaultValue="manual" className="w-full">
                              <TabsList className="grid w-full grid-cols-2 bg-background p-1 h-9 rounded-lg">
                                <TabsTrigger value="manual" className="text-xs rounded-md">{t('manual_entry')}</TabsTrigger>
                                <TabsTrigger value="excel" className="text-xs rounded-md">{t('excel_import')}</TabsTrigger>
                              </TabsList>
                              <TabsContent value="manual" className="space-y-4 pt-4">
                                <FormItem>
                                  <FormLabel className="text-[10px] font-bold uppercase">{t('serial_numbers')}</FormLabel>
                                  <div className="flex gap-2">
                                    <Input
                                      value={serialNumberInputs[index] || ''}
                                      onChange={(e) => setSerialNumberInputs(prev => ({ ...prev, [index]: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddSerialNumber(index);
                                        }
                                      }}
                                      placeholder={t('enter_serial_number_placeholder')}
                                      className="bg-background h-9 text-xs"
                                    />
                                    <Button type="button" size="sm" onClick={() => handleAddSerialNumber(index)}>{t('add')}</Button>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1.5 min-h-[2rem] items-center p-2 rounded-lg bg-background/50 border border-dashed">
                                    {addedSerials.map((sn) => (
                                      <Badge key={sn} variant="secondary" className="flex items-center gap-1 py-0.5 px-2 bg-secondary/50 text-[10px] font-mono border-none">
                                        {sn}
                                        <button
                                          type="button"
                                          className="ml-1 text-muted-foreground hover:text-destructive"
                                          onClick={() => {
                                            const current = form.getValues(`articles.${index}.serialNumbers`) || [];
                                            update(index, { ...fields[index], serialNumbers: current.filter(s => s !== sn)});
                                          }}
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      </Badge>
                                    ))}
                                    {addedSerials.length === 0 && <p className="text-[10px] text-muted-foreground italic px-1">{t('no_serials_added', 'Press Enter to add multiple serials.')}</p>}
                                  </div>
                                </FormItem>
                              </TabsContent>
                              <TabsContent value="excel" className="space-y-4 pt-4">
                                <FormItem>
                                  <FormLabel className="text-[10px] font-bold uppercase">{t('upload_excel_file')}</FormLabel>
                                  <div className="flex items-center gap-4">
                                    <FormControl>
                                      <div className="flex items-center gap-2 w-full">
                                        {!uploadedFile ? (
                                          <div className="relative w-full">
                                            <Input
                                              type="file"
                                              accept=".xlsx, .xls"
                                              className="hidden"
                                              id={`file-upload-${index}`}
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) update(index, { ...fields[index], file: file });
                                              }}
                                            />
                                            <label
                                              htmlFor={`file-upload-${index}`}
                                              className="flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/20 bg-background/50 text-[10px] text-muted-foreground hover:bg-primary/5 hover:border-primary/40 transition-all"
                                            >
                                              <FileUp className="mb-1 h-5 w-5 text-primary/60" />
                                              <span className="font-medium text-primary/80">{t('select_excel_file')}</span>
                                            </label>
                                          </div>
                                        ) : (
                                          <div className="flex flex-1 items-center justify-between rounded-xl border p-3 bg-background shadow-sm">
                                            <div className="flex items-center gap-3">
                                              <div className="p-2 rounded-lg bg-green-500/10">
                                                  <FileUp className="h-4 w-4 text-green-600" />
                                              </div>
                                              <div className="flex flex-col">
                                                  <span className="text-xs font-bold truncate max-w-[180px]">{uploadedFile.name}</span>
                                                  <span className="text-[9px] text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                                              </div>
                                            </div>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                              onClick={() => update(index, { ...fields[index], file: undefined })}
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </FormControl>
                                  </div>
                                </FormItem>
                              </TabsContent>
                            </Tabs>
                          )}

                          {articleType === 'CONSUMABLE' && (
                            <FormField
                              control={form.control}
                              name={`articles.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-bold uppercase">{t('quantity')}</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      placeholder={t('enter_quantity_placeholder')}
                                      {...field}
                                      className="bg-background h-10 text-sm"
                                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>

                <div className="relative space-y-3 pt-2 bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-primary/80">{t('add_article', 'Add Article to List')}</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      value={searchArticleType}
                      onValueChange={(value: any) => setSearchArticleType(value)}
                    >
                      <SelectTrigger className="w-[130px] h-10 bg-background border-none shadow-sm">
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
                            id="article-search"
                            placeholder={t('search_article_placeholder')}
                            onChange={(e) => handleArticleSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setSearchedArticles([]), 150)}
                            className="pl-9 h-10 bg-background border-none shadow-sm"
                        />
                    </div>
                  </div>
                  <AnimatePresence>
                    {searchedArticles.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full left-0 rounded-xl border bg-popover shadow-2xl mt-1 overflow-hidden"
                      >
                        <ScrollArea className="max-h-56">
                          {searchedArticles.map((article) => (
                            <div
                              key={article.id}
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-accent transition-colors border-b last:border-0"
                              onMouseDown={() => handleArticleSelect(article)}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{article.model}</span>
                                <span className="text-[10px] text-muted-foreground">{article.designation}</span>
                              </div>
                              <Badge variant={article.type === "HARDWARE" ? "outline" : "secondary"} className="text-[9px] h-4">
                                {t(article.type.toLowerCase() as any)}
                              </Badge>
                            </div>
                          ))}
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="attestation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('arrival_attestation', 'Arrival Attestation')}</FormLabel>
                      <FormControl>
                        <div className="w-full">
                          {!watchedAttestation ? (
                            <label
                              htmlFor="arrival-attestation-upload"
                              className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/10 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                            >
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id="arrival-attestation-upload"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) form.setValue("attestation", file);
                                }}
                              />
                              <FileText className="mb-2 h-7 w-7 text-primary/40 group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-bold text-primary/70">{t('upload_arrival_attestation', 'Upload Attestation Document')}</span>
                              <span className="text-[9px] text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</span>
                            </label>
                          ) : (
                            <motion.div 
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex items-center justify-between rounded-xl border p-4 bg-primary/5 border-primary/20 shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-primary/10">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold truncate max-w-[250px]">{watchedAttestation.name}</span>
                                  <span className="text-[9px] text-muted-foreground">{(watchedAttestation.size / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => form.setValue("attestation", undefined)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="p-0 border-t-0 mt-10">
                <Button type="submit" disabled={loading} size="lg" className="w-full shadow-lg shadow-primary/20 h-12 text-sm font-bold tracking-widest uppercase">
                  {loading ? t('saving') : t('save_arrival')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

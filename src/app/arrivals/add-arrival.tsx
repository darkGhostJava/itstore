
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2, FileUp, X, Search, FileText } from "lucide-react";
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
    const articleInput = document.getElementById('article-search');
    if (articleInput) (articleInput as HTMLInputElement).value = '';
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
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_arrival')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('add_new_arrival')}</DialogTitle>
          <DialogDescription>
            {t('add_arrival_desc')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
               {form.formState.isSubmitted && !form.formState.isValid && (
                <ErrorSummary errors={form.formState.errors} />
              )}

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('budget')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              <div className="space-y-4">
                <FormLabel className="text-lg font-bold">{t('arrived_articles')}</FormLabel>
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const article = watchedArticles?.[index]?.article;
                    if (!article) return null;
                    
                    const articleType = article.type;
                    const addedSerials = watchedArticles?.[index]?.serialNumbers || [];
                    const uploadedFile = watchedArticles?.[index]?.file;

                    return (
                      <div key={field.id} className="rounded-lg border bg-muted/30 p-4 space-y-4 relative shadow-sm">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-8 w-8 hover:bg-destructive/10 hover:text-destructive" 
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2 pr-8">
                          <p className="font-semibold">{article.model}</p>
                          <span className="text-xs text-muted-foreground">— {article.designation}</span>
                          <Badge variant={articleType === "HARDWARE" ? "default" : "secondary"} className="ml-auto">
                            {t(articleType.toLowerCase() as "hardware" | "consumable")}
                          </Badge>
                        </div>

                        {articleType === 'HARDWARE' && (
                          <Tabs defaultValue="manual" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-background/50">
                              <TabsTrigger value="manual">{t('manual_entry')}</TabsTrigger>
                              <TabsTrigger value="excel">{t('excel_import')}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="manual" className="space-y-4 pt-4">
                              <FormItem>
                                <FormLabel>{t('serial_numbers')}</FormLabel>
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
                                    className="bg-background"
                                  />
                                  <Button type="button" onClick={() => handleAddSerialNumber(index)}>{t('add')}</Button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {addedSerials.map((sn) => (
                                    <Badge key={sn} variant="secondary" className="flex items-center gap-1 py-1 pl-2">
                                      <span className="font-mono text-xs">{sn}</span>
                                      <button
                                        type="button"
                                        className="ml-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                        onClick={() => {
                                          const current = form.getValues(`articles.${index}.serialNumbers`) || [];
                                          update(index, { ...fields[index], serialNumbers: current.filter(s => s !== sn)});
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  {addedSerials.length === 0 && <p className="text-xs text-muted-foreground italic">{t('no_serials_added', 'No serial numbers added yet.')}</p>}
                                </div>
                              </FormItem>
                            </TabsContent>
                            <TabsContent value="excel" className="space-y-4 pt-4">
                              <FormItem>
                                <FormLabel>{t('upload_excel_file')}</FormLabel>
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
                                              if (file) {
                                                update(index, { ...fields[index], file: file });
                                              }
                                            }}
                                          />
                                          <label
                                            htmlFor={`file-upload-${index}`}
                                            className="flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                          >
                                            <FileUp className="mb-2 h-6 w-6 text-primary" />
                                            <span>{t('select_excel_file')}</span>
                                          </label>
                                        </div>
                                      ) : (
                                        <div className="flex flex-1 items-center justify-between rounded-md border p-3 bg-background">
                                          <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-primary/10">
                                                <FileUp className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium truncate max-w-[200px]">{uploadedFile.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => update(index, { ...fields[index], file: undefined })}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </FormControl>
                                </div>
                                <p className="text-[0.7rem] text-muted-foreground">
                                  {t('excel_format_hint')}
                                </p>
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
                                <FormLabel>{t('quantity')}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    placeholder={t('enter_quantity_placeholder')}
                                    {...field}
                                    className="bg-background"
                                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                                  />
                                </FormControl>
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
                            placeholder={t('search_article_placeholder')}
                            onChange={(e) => handleArticleSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setSearchedArticles([]), 150)}
                            className="pl-9"
                        />
                    </div>
                  </div>
                  {searchedArticles.length > 0 && (
                    <div className="absolute z-50 w-full rounded-md border bg-popover shadow-xl mt-1 max-h-56 overflow-y-auto">
                      {searchedArticles.map((article) => (
                        <div
                          key={article.id}
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
                          onMouseDown={() => handleArticleSelect(article)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{article.model}</span>
                            <span className="text-xs opacity-70">{article.designation}</span>
                          </div>
                          <Badge variant={article.type === "HARDWARE" ? "outline" : "secondary"} className="text-[10px]">
                            {t(article.type.toLowerCase() as any)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <FormMessage>
                  {form.formState.errors.articles && typeof form.formState.errors.articles.message === 'string' && t(form.formState.errors.articles.message)}
                </FormMessage>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="attestation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('arrival_attestation', 'Arrival Attestation')}</FormLabel>
                      <FormControl>
                        <div className="w-full">
                          {!watchedAttestation ? (
                            <div className="relative">
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id="arrival-attestation-upload"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    form.setValue("attestation", file);
                                  }
                                }}
                              />
                              <label
                                htmlFor="arrival-attestation-upload"
                                className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <FileText className="mb-2 h-8 w-8 text-primary/60" />
                                <span className="text-sm font-medium">{t('upload_arrival_attestation', 'Upload Attestation Document')}</span>
                                <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</span>
                              </label>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between rounded-lg border p-4 bg-primary/5 border-primary/20">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-full bg-primary/10">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold truncate max-w-[250px]">{watchedAttestation.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{(watchedAttestation.size / 1024).toFixed(1)} KB</span>
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
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
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


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
import { PlusCircle, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { searchArticles } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Article } from "@/lib/definitions";
import { api } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const articleArrivalSchema = z.object({
  article: z.any().refine(val => val, { message: "Please select an article." }),
  serialNumbers: z.array(z.string()).optional(),
  quantity: z.number().optional(),
});

const arrivalFormSchema = z.object({
  budget: z.string().min(1, "Please select a budget."),
  remarks: z.string().optional(),
  articles: z.array(articleArrivalSchema).min(1, "Please add at least one article."),
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
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "articles",
  });

  async function onSubmit(values: ArrivalFormValues) {
    setLoading(true);
    try {
      const hardwares: { [key: number]: string[] } = {};
      const consumables: { [key: number]: number } = {};

      values.articles.forEach(a => {
        if (a.article.type === 'HARDWARE') {
          hardwares[a.article.id] = a.serialNumbers || [];
        } else if (a.article.type === 'CONSUMABLE') {
          consumables[a.article.id] = a.quantity || 1;
        }
      });
      
      const payload = {
        budget: values.budget,
        hardwares,
        consumables,
        userId: 1, // Assuming a logged-in user
        remark: values.remarks,
      };

      await api.post("/arrivals", payload);

      toast({
        title: t('arrival_added_toast_title'),
        description: t('arrival_added_toast_desc'),
      });

      form.reset();
      remove(); // Clear all appended fields
      setOpen(false);
      onSuccess?.(); // Trigger refresh
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

  const handleAddSerialNumber = (index: number) => {
    const newSerial = serialNumberInputs[index]?.trim();
    if (!newSerial) return;

    const currentSerials = form.getValues(`articles.${index}.serialNumbers`) || [];
    if (!currentSerials.includes(newSerial)) {
        const field = fields[index];
        update(index, {
            ...field,
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <FormLabel>{t('arrived_articles')}</FormLabel>
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const articleType = form.getValues(`articles.${index}.article.type`);
                    const addedSerials = form.getValues(`articles.${index}.serialNumbers`);
                    return (
                      <div key={field.id} className="rounded-md border p-4 space-y-4 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>

                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{form.getValues(`articles.${index}.article.model`)} - <span className="text-xs text-muted-foreground">{form.getValues(`articles.${index}.article.designation`)}</span></p>
                          <Badge variant={articleType === "HARDWARE" ? "default" : "secondary"}>
                            {t(articleType.toLowerCase() as "hardware" | "consumable")}
                          </Badge>
                        </div>

                        {articleType === 'HARDWARE' && (
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
                              />
                              <Button type="button" onClick={() => handleAddSerialNumber(index)}>{t('add')}</Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {addedSerials?.map((sn) => (
                                <Badge key={sn} variant="secondary" className="flex items-center gap-1">
                                  {sn}
                                  <button
                                    type="button"
                                    className="ml-1 rounded-full text-destructive hover:text-red-500"
                                    onClick={() => handleRemoveSerialNumber(index, sn)}
                                  >
                                    &times;
                                  </button>
                                </Badge>
                              ))}
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
                                    placeholder={t('enter_quantity_placeholder')}
                                    {...field}
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

                <div className="relative space-y-2">
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
                    <Input
                      id="article-search"
                      placeholder={t('search_article_placeholder')}
                      onChange={(e) => handleArticleSearch(e.target.value)}
                      onBlur={() => setTimeout(() => setSearchedArticles([]), 150)}
                      className="flex-1"
                    />
                  </div>
                  {searchedArticles.length > 0 && (
                    <div className="absolute z-10 w-full rounded border bg-background shadow-md mt-1 max-h-56 overflow-y-auto">
                      {searchedArticles.map((article) => (
                        <div
                          key={article.id}
                          className="p-2 cursor-pointer hover:bg-muted"
                          onMouseDown={() => {
                            append({ article: article, serialNumbers: [], quantity: 1 });
                            setSearchedArticles([]);
                            const articleInput = document.getElementById('article-search');
                            if (articleInput) (articleInput as HTMLInputElement).value = '';
                          }}
                        >
                          {article.model} ({t(article.type.toLowerCase() as "hardware" | "consumable")})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <FormMessage>
                  {form.formState.errors.articles && typeof form.formState.errors.articles.message === 'string' && form.formState.errors.articles.message}
                </FormMessage>
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
                <Button type="submit" disabled={loading}>
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

    
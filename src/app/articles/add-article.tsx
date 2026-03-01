
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
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import categories from "@/lib/article-categories.json";
import { useTranslation } from "react-i18next";

const articleFormSchema = z.object({
  model: z.string().min(1, "model_is_required"),
  designation: z.string().min(1, "designation_is_required"),
  type: z.enum(["HARDWARE", "CONSUMABLE"]),
  category: z.string().min(1, "category_is_required"),
  strategicStock: z.coerce.number().min(0).default(0),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

interface AddArticleProps {
  onSuccess?: () => void;
}

export function AddArticle({ onSuccess }: AddArticleProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('common');
  
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      model: "",
      designation: "",
      type: "HARDWARE",
      category: "",
      strategicStock: 0,
    },
  });

  async function onSubmit(values: ArticleFormValues) {
    setLoading(true);
    try {
      await api.post("/articles", values);
      toast({
        title: t('article_added_toast_title'),
        description: t('article_added_toast_desc', { model: values.model }),
      });
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
       toast({
        title: t('error'),
        description: t('add_article_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg hover:scale-105 transition-transform">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_article')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('add_new_article')}</DialogTitle>
          <DialogDescription>
            {t('add_new_article_desc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('model')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('model_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('designation')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('designation_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_type_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HARDWARE">{t('hardware')}</SelectItem>
                        <SelectItem value="CONSUMABLE">{t('consumable')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="strategicStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('strategic_stock')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('category')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_category_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(`category_${category.toLowerCase()}` as any, category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t('saving') : t('save_article')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

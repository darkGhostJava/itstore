
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
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Structure } from "@/lib/definitions";
import { fetchAllStructures } from "@/lib/data";
import grades from "@/lib/grades.json";

const personFunctions = [
    "DIRECTEUR_GENERALE",
    "DIRECTEUR",
    "SOUS_DIRECTEUR",
    "CHARGEE_DE_DOSSIER",
    "SECRITEUR"
] as const;

const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  grade: z.string().optional(),
  matricule: z.string().optional(),
  pseudo: z.string().optional(),
  structureId: z.string().optional(),
  function: z.enum(personFunctions),
});

interface AddPersonProps {
  onSuccess?: () => void;
}

export function AddPerson({ onSuccess }: AddPersonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [structures, setStructures] = useState<Structure[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation('common');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      grade: "",
      matricule: "",
      pseudo: "",
      structureId: "",
      function: "SECRITEUR",
    },
  });

  useEffect(() => {
    if (open) {
      const loadStructures = async () => {
        try {
          const allStructures = await fetchAllStructures();
          setStructures(allStructures);
        } catch (error) {
          console.error("Failed to fetch structures", error);
          toast({
            title: t('error'),
            description: t('fetch_structures_error'),
            variant: "destructive",
          });
        }
      };
      loadStructures();
    }
  }, [open, t, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      await api.post("/persons", {
        ...values,
        structureId: values.structureId ? parseInt(values.structureId, 10) : null
      });
      toast({
        title: t('person_added_toast_title'),
        description: t('person_added_toast_desc', { name: `${values.firstName} ${values.lastName}` }),
      });
      setOpen(false);
      form.reset();
      onSuccess?.(); // Trigger refresh
    } catch (error) {
       toast({
        title: t('error'),
        description: t('add_person_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_person')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('add_new_person')}</DialogTitle>
          <DialogDescription>
            {t('add_new_person_desc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('first_name')}</FormLabel>
                    <FormControl>
                        <Input placeholder={t('first_name_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage>{form.formState.errors.firstName && t(form.formState.errors.firstName.message as string)}</FormMessage>
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('last_name')}</FormLabel>
                    <FormControl>
                        <Input placeholder={t('last_name_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage>{form.formState.errors.lastName && t(form.formState.errors.lastName.message as string)}</FormMessage>
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="pseudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pseudo')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('pseudo_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage>{form.formState.errors.pseudo && t(form.formState.errors.pseudo.message as string)}</FormMessage>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('grade')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={t('select_grade_placeholder')} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {grades.grades.map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                    {t(`grade_${grade.toLowerCase()}` as any, grade.replace(/_/g, " "))}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage>{form.formState.errors.grade && t(form.formState.errors.grade.message as string)}</FormMessage>
                        </FormItem>
                    )}
                />
                <FormField
                control={form.control}
                name="matricule"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('matricule')}</FormLabel>
                    <FormControl>
                        <Input placeholder={t('matricule_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage>{form.formState.errors.matricule && t(form.formState.errors.matricule.message as string)}</FormMessage>
                    </FormItem>
                )}
                />
            </div>
            
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
                      {structures.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage>{form.formState.errors.structureId && t(form.formState.errors.structureId.message as string)}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="function"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('function')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_function_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {personFunctions.map((func) => (
                        <SelectItem key={func} value={func}>
                          {t(`function_${func.toLowerCase()}` as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage>{form.formState.errors.function && t(form.formState.errors.function.message as string)}</FormMessage>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? t('saving') : t('save_person')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

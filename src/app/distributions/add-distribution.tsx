"use client";

import { useState, useMemo } from "react";
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
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { mockPersons, mockArticles, mockStructures } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  articleId: z.string().min(1, "Please select an article."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  structureId: z.string().min(1, "Please select a structure."),
  beneficiaryId: z.string().min(1, "Please select a beneficiary."),
  remarks: z.string().optional(),
});

export function AddDistribution() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      articleId: "",
      quantity: 1,
      structureId: "",
      beneficiaryId: "",
      remarks: "",
    },
  });

  const selectedStructureId = form.watch("structureId");

  const filteredPersons = useMemo(() => {
    if (!selectedStructureId) return [];
    return mockPersons.filter(
      (p) => p.structureId === parseInt(selectedStructureId)
    );
  }, [selectedStructureId]);
  
  // Reset beneficiary when structure changes
  React.useEffect(() => {
    form.resetField("beneficiaryId");
  }, [selectedStructureId, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("New Distribution:", {
        ...values,
        articleId: parseInt(values.articleId),
        structureId: parseInt(values.structureId),
        beneficiaryId: parseInt(values.beneficiaryId),
        date: new Date().toISOString(),
        userId: 1, // Mock user ID
        type: 'DISTRIBUTION',
    });
    toast({
      title: "Distribution Added",
      description: `Distribution for ${mockPersons.find(p => p.id === parseInt(values.beneficiaryId))?.firstName} has been registered.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Distribution
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Distribution</DialogTitle>
          <DialogDescription>
            Record a new distribution of items to a beneficiary.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="articleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an article" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockArticles.map((article) => (
                          <SelectItem key={article.id} value={article.id.toString()}>
                            {article.model}
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="structureId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Structure</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a structure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockStructures.map((structure) => (
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
              name="beneficiaryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiary</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedStructureId || filteredPersons.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a beneficiary" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredPersons.map((person) => (
                        <SelectItem
                          key={person.id}
                          value={person.id.toString()}
                        >
                          {person.firstName} {person.lastName}
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
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any relevant remarks..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Distribution</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

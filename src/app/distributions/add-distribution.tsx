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
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { mockItems, mockPersons, mockArticles } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  itemIds: z.array(z.number()).min(1, "Please select at least one item."),
  beneficiaryId: z.string().min(1, "Please select a beneficiary."),
  remarks: z.string().optional(),
});

export function AddDistribution() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemIds: [],
      beneficiaryId: "",
      remarks: "",
    },
  });

  const availableItems = mockItems.filter((item) => item.status === "IN_STOCK");

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("New Distribution:", {
        ...values,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Distribution</DialogTitle>
          <DialogDescription>
            Record a new distribution of items to a beneficiary.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemIds"
              render={() => (
                <FormItem>
                  <FormLabel>Items</FormLabel>
                  <div className="max-h-48 overflow-y-auto rounded-md border p-2">
                    {availableItems.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="itemIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0 p-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {mockArticles.find(a => a.id === item.articleId)?.model} - {item.serialNumber}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
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
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a beneficiary" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockPersons.map((person) => (
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


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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { searchItems, registerReparations } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Item } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const reparationItemSchema = z.object({
  item: z.any().refine(val => val, { message: "Please select an item." }),
  remarks: z.string().min(1, "Remarks are required."),
});

const reparationFormSchema = z.object({
  reparations: z.array(reparationItemSchema).min(1, "Please add at least one item for repair."),
});

type ReparationFormValues = z.infer<typeof reparationFormSchema>;

export function AddReparation() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [searchedItems, setSearchedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<ReparationFormValues>({
    resolver: zodResolver(reparationFormSchema),
    defaultValues: {
      reparations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reparations",
  });

  async function onSubmit(values: ReparationFormValues) {
    setLoading(true);
    try {
      const payload = values.reparations.map(rep => ({
        itemId: rep.item.id,
        remarks: rep.remarks,
        userId: 1, // Assuming a logged-in user
      }));

      await registerReparations(payload);

      toast({
        title: "Repair(s) Registered",
        description: "The items have been successfully registered for repair.",
      });

      form.reset();
      remove();
      setOpen(false);
    } catch (error) {
      console.error("Error registering repair:", error);
      toast({
        title: "Error",
        description: "Failed to register the items for repair.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleItemSearch = async (query: string) => {
    if (query.length > 1) {
      const res = await searchItems(query);
      setSearchedItems(res);
    } else {
      setSearchedItems([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Register for Repair
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register Items for Repair</DialogTitle>
          <DialogDescription>
            Find items by serial number and add repair remarks for each.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <FormLabel>Items to Repair</FormLabel>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-md border p-4 space-y-4 relative">
                       <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      
                      <div>
                        <p className="font-semibold text-sm">{field.item.article.model} - <span className="text-xs text-muted-foreground">{field.item.article.designation}</span></p>
                        <p className="text-sm">Serial Number: <Badge variant="secondary">{field.item.serialNumber}</Badge></p>
                        <p className="text-sm">Current Status: <Badge variant="outline">{field.item.status.replace("_", " ")}</Badge></p>
                      </div>

                      <FormField
                        control={form.control}
                        name={`reparations.${index}.remarks`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repair Remarks</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the issue with this item..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>

                <div className="relative space-y-2">
                  <FormLabel htmlFor="item-search">Add Item by Serial Number</FormLabel>
                   <div className="relative">
                    <Input
                      id="item-search"
                      placeholder="Search by serial number to add..."
                      onChange={(e) => handleItemSearch(e.target.value)}
                       onBlur={() => setTimeout(() => setSearchedItems([])), 150)}
                      className="flex-1"
                    />
                    {searchedItems.length > 0 && (
                      <div className="absolute z-10 w-full rounded border bg-background shadow-md mt-1 max-h-56 overflow-y-auto">
                        {searchedItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-2 cursor-pointer hover:bg-muted"
                            onMouseDown={() => {
                              append({ item: item, remarks: "" });
                              setSearchedItems([]);
                              const searchInput = document.getElementById('item-search');
                              if (searchInput) (searchInput as HTMLInputElement).value = "";
                            }}
                          >
                            {item.serialNumber} ({item.article.model})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage>
                    {form.formState.errors.reparations &&  typeof form.formState.errors.reparations.message === 'string' && form.formState.errors.reparations.message}
                  </FormMessage>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Repairs"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


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
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { searchItems } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Item } from "@/lib/definitions";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const reparationFormSchema = z.object({
  item: z.any().refine(val => val, { message: "Please select an item." }),
  remarks: z.string().min(1, "Remarks are required."),
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
      item: null,
      remarks: "",
    },
  });

  async function onSubmit(values: ReparationFormValues) {
    setLoading(true);
    try {
      const payload = {
        itemId: values.item.id,
        remarks: values.remarks,
        userId: 1, // Assuming a logged-in user
      };

      await api.post("/reparations", payload);

      toast({
        title: "Repair Registered",
        description: "The item has been successfully registered for repair.",
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error registering repair:", error);
      toast({
        title: "Error",
        description: "Failed to register the item for repair.",
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
  
  const selectedItem = form.watch("item");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Register for Repair
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register Item for Repair</DialogTitle>
          <DialogDescription>
            Find an item by its serial number and add remarks.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Serial Number</FormLabel>
                   <div className="relative">
                    <Input
                      id="item-search"
                      placeholder="Search by serial number..."
                      onChange={(e) => handleItemSearch(e.target.value)}
                       onBlur={() => setTimeout(() => setSearchedItems([]), 150)}
                      className="flex-1"
                    />
                    {searchedItems.length > 0 && (
                      <div className="absolute z-10 w-full rounded border bg-background shadow-md mt-1 max-h-56 overflow-y-auto">
                        {searchedItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-2 cursor-pointer hover:bg-muted"
                            onMouseDown={() => {
                              field.onChange(item);
                              setSearchedItems([]);
                              const searchInput = document.getElementById('item-search');
                              if (searchInput) (searchInput as HTMLInputElement).value = item.serialNumber;
                            }}
                          >
                            {item.serialNumber} ({item.article.model})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedItem && (
                    <div className="mt-2 rounded-md border p-4 space-y-2">
                         <p className="font-semibold text-sm">{selectedItem.article.model} - <span className="text-xs text-muted-foreground">{selectedItem.article.designation}</span></p>
                         <p className="text-sm">Serial Number: <Badge variant="secondary">{selectedItem.serialNumber}</Badge></p>
                         <p className="text-sm">Current Status: <Badge variant="outline">{selectedItem.status.replace("_", " ")}</Badge></p>
                    </div>
                  )}
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
                      placeholder="Describe the issue with the item..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Repair"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

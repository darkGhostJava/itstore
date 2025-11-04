
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  getAllDirections,
  getSubDirectionsOfDirection,
  getPersonsByIdStructure,
  searchItemsBySerialNumberAndPerson,
  registerReparations,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Item, Person, Structure } from "@/lib/definitions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";

const reparationItemSchema = z.object({
  item: z.any().refine(val => val, { message: "Please select an item." }),
  remarks: z.string().min(1, "Remarks are required."),
});

const reparationFormSchema = z.object({
  structureId: z.string().min(1, "Please select a direction."),
  subDirectionId: z.string().min(1, "Please select a sub direction."),
  personId: z.string().min(1, "Please select the person returning the item."),
  reparations: z.array(reparationItemSchema).min(1, "Please add at least one item for repair."),
});

type ReparationFormValues = z.infer<typeof reparationFormSchema>;

export function AddReparation() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState<Structure[]>([]);
  const [subDirections, setSubDirections] = useState<Structure[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [searchedItems, setSearchedItems] = useState<Item[]>([]);

  const form = useForm<ReparationFormValues>({
    resolver: zodResolver(reparationFormSchema),
    defaultValues: {
      structureId: "",
      subDirectionId: "",
      personId: "",
      reparations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reparations",
  });
  
  const selectedPersonId = form.watch("personId");

  useEffect(() => {
    if (open) {
      (async () => {
        const res = await getAllDirections();
        setDirections(res.data || []);
      })();
    }
  }, [open]);

  const selectedStructureId = form.watch("structureId");
  const selectedSubDirectionId = form.watch("subDirectionId");

  useEffect(() => {
    const fetchSubDirections = async () => {
      form.resetField("subDirectionId");
      form.resetField("personId");
      setSubDirections([]);
      setPersons([]);
      if (selectedStructureId) {
        const res = await getSubDirectionsOfDirection(parseInt(selectedStructureId));
        setSubDirections(res.data || []);
      }
    };
    fetchSubDirections();
  }, [selectedStructureId, form]);

  useEffect(() => {
    const fetchPersons = async () => {
      form.resetField("personId");
      setPersons([]);
      if (selectedSubDirectionId) {
        const res = await getPersonsByIdStructure(parseInt(selectedSubDirectionId));
        setPersons(res.data || []);
      }
    };
    fetchPersons();
  }, [selectedSubDirectionId, form]);


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
    if (query.length > 1 && selectedPersonId) {
      const res = await searchItemsBySerialNumberAndPerson(parseInt(selectedPersonId), query);
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
            Select who is returning the item, then find items by serial number to add for repair.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               {/* Person Selection */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="structureId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Structure</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a structure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {directions.map((structure) => (
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
                  name="subDirectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub Direction</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedStructureId || subDirections.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a sub direction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subDirections.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id.toString()}>
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
                  name="personId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Returned By</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedSubDirectionId || persons.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a person" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {persons.map((person) => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.firstName} {person.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


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
                        <p className="text-sm">Current Status: <StatusBadge status={field.item.status} /></p>
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
                       onBlur={() => setTimeout(() => setSearchedItems([]), 150)}
                      className="flex-1"
                      disabled={!selectedPersonId}
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
                            {item.serialNumber} ({item.article.model}) - Status: {item.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!selectedPersonId && <p className="text-xs text-muted-foreground">Please select a person to search for their items.</p>}
                  <FormMessage>
                    {form.formState.errors.reparations && typeof form.formState.errors.reparations.message === 'string' && form.formState.errors.reparations.message}
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

    